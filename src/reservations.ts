import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface KitchenHours {
  readonly open: string;
  readonly last: string;
}

export interface ReservationSlot {
  time: string;
  available: boolean;
  reason?: string;
}

export interface ReservationInput {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  reservation_date: string;
  reservation_time: string;
  number_of_people: number;
  occasion?: string;
}

export interface ReservationDoc extends ReservationInput {
  id?: string;
  locator: string;
  status: ReservationStatus;
  created_at: string;
}

export interface SlotCapacityResult {
  available: boolean;
  reason?: string;
  activeCount?: number;
}

export interface GuestValidationResult {
  valid: boolean;
  isImperial: boolean;
  notice?: string;
  error?: string;
}

export interface WhatsAppReservationParams {
  phone?: string;
  locator: string;
  name: string;
  date: string;
  time: string;
  people: number;
}

export interface ConfirmationCardData {
  locator: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  reservation_date: string;
  reservation_time: string;
  number_of_people: number;
  occasion?: string;
  waUrl: string;
  isImperial: boolean;
  imperialNotice?: string;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  invalid_params?: Array<{ name: string; reason: string }>;
}

export const KITCHEN_HOURS: Readonly<Record<number, KitchenHours>> = Object.freeze({
  0: { open: '12:00', last: '21:30' }, // Domingo
  1: { open: '12:00', last: '23:30' }, // Lunes
  2: { open: '12:00', last: '23:30' }, // Martes
  3: { open: '12:00', last: '23:30' }, // Miércoles
  4: { open: '12:00', last: '23:30' }, // Jueves
  5: { open: '12:00', last: '23:30' }, // Viernes
  6: { open: '12:00', last: '22:30' }  // Sábado
});

export const MAX_ACTIVE_RESERVATIONS_PER_SLOT = 4;
export const MAX_STANDARD_GROUP_SIZE = 6;
export const MAX_TOTAL_GUEST_CAPACITY = 20;
export const LOCATOR_REGEX = /^SP-[A-Z0-9]{4}$/;

/**
 * Escapes HTML characters to prevent XSS.
 */
export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate discrete 30-minute intervals based on day-of-week kitchen hours.
 */
export function generateDaySlots(dayOfWeek: number): string[] {
  const hours = KITCHEN_HOURS[dayOfWeek];
  if (!hours) return [];

  const slots: string[] = [];
  let current = hours.open;

  while (current <= hours.last) {
    slots.push(current);
    const [h, m] = current.split(':').map(Number);
    const nextM = m + 30;
    const nextH = h + Math.floor(nextM / 60);
    const nextMFinal = nextM % 60;
    current = `${String(nextH).padStart(2, '0')}:${String(nextMFinal).padStart(2, '0')}`;
  }

  return slots;
}

/**
 * Evaluates whether a slot can accept bookings based on active booking count (< 4).
 */
export function checkSlotAvailability(activeCount: number): SlotCapacityResult {
  const isAvailable = (activeCount || 0) < MAX_ACTIVE_RESERVATIONS_PER_SLOT;
  return {
    available: isAvailable,
    reason: isAvailable ? undefined : 'Completo',
    activeCount
  };
}

/**
 * Validates comensales integer boundaries (1..20) and identifies Imperial Table groups (> 6).
 */
export function validateGuestCount(people: number): GuestValidationResult {
  if (typeof people !== 'number' || !Number.isInteger(people) || people < 1 || people > MAX_TOTAL_GUEST_CAPACITY) {
    return {
      valid: false,
      isImperial: false,
      error: `Number of guests must be an integer between 1 and ${MAX_TOTAL_GUEST_CAPACITY}`
    };
  }

  const isImperial = people > MAX_STANDARD_GROUP_SIZE;
  return {
    valid: true,
    isImperial,
    notice: isImperial
      ? 'Grupos de más de 6 comensales requieren confirmación de mesa imperial con el maître.'
      : undefined
  };
}

/**
 * Generates an immutable, collision-resistant reservation locator: SP-XXXX
 * Uses 32 unambiguous Crockford characters (excludes 0, O, 1, I).
 */
export function generateReservationLocator(rng: () => number = Math.random): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(rng() * alphabet.length);
    code += alphabet[idx];
  }
  return `SP-${code}`;
}

/**
 * Constructs the voluntary 2-step WhatsApp direct chat URL.
 * Prevents mobile browser popup blockers by relying on voluntary user click.
 */
export function buildWhatsAppReservationUrl(params: WhatsAppReservationParams): string {
  const cleanPhone = (params.phone || '34662125650').replace(/\D/g, '') || '34662125650';
  let msg = `Hola, deseo confirmar mi reserva con localizador ${params.locator} a nombre de ${params.name} para el ${params.date} a las ${params.time} (${params.people} personas).`;
  if (params.people > 6) {
    msg += ' Mesa Imperial solicitada.';
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

/**
 * Renders the Confirmation Card HTML with locator badge and voluntary WhatsApp CTA.
 */
export function renderConfirmationCardHtml(data: ConfirmationCardData): string {
  const escapedLocator = escapeHtml(data.locator);
  const escapedName = escapeHtml(data.customer_name);
  const escapedEmail = escapeHtml(data.customer_email);
  const escapedPhone = data.customer_phone ? escapeHtml(data.customer_phone) : '';
  const escapedDate = escapeHtml(data.reservation_date);
  const escapedTime = escapeHtml(data.reservation_time);
  const escapedOccasion = data.occasion ? escapeHtml(data.occasion) : '';

  const imperialHtml = data.isImperial
    ? `<div class="imperial-notice" role="status"><strong>Mesa Imperial:</strong> ${escapeHtml(data.imperialNotice || 'Mesa Imperial: Su solicitud para más de 6 personas requiere confirmación de disponibilidad de mesa imperial por parte del Maître.')}</div>`
    : '';

  return `<div id="reservation-confirmation-card" class="confirmation-card" role="region" aria-label="Confirmación de Reserva">
  <div class="confirmation-badge">Solicitud Registrada</div>
  <h3 class="confirmation-title">Reserva Registrada</h3>
  <div class="locator-wrapper">
    <span class="locator-label">Su localizador:</span>
    <span class="locator-code">${escapedLocator}</span>
  </div>
  <p class="confirmation-text">Para confirmar su reserva con el restaurante, pulse en el enlace de WhatsApp a continuación:</p>
  ${imperialHtml}
  <div class="confirmation-summary-grid">
    <div class="summary-item">
      <span class="summary-label">Titular</span>
      <span class="summary-value">${escapedName}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Comensales</span>
      <span class="summary-value">${data.number_of_people} personas</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Fecha</span>
      <span class="summary-value">${escapedDate}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Hora</span>
      <span class="summary-value">${escapedTime}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Contacto</span>
      <span class="summary-value">${escapedEmail}${escapedPhone ? ` / ${escapedPhone}` : ''}</span>
    </div>
    ${escapedOccasion ? `<div class="summary-item"><span class="summary-label">Ocasión</span><span class="summary-value">${escapedOccasion}</span></div>` : ''}
  </div>
  <a id="btn-whatsapp-confirm" href="${escapeHtml(data.waUrl)}" target="_blank" rel="noopener noreferrer" class="btn-wa-confirm">
    <span>Confirmar por WhatsApp</span>
  </a>
  <div class="card-payment-info" style="margin-top: 20px; padding: 12px 16px; background: rgba(197, 168, 128, 0.06); border: 1px solid rgba(197, 168, 128, 0.18); text-align: center;">
    <div style="font-family: var(--font-sans); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--lux-gold-champagne, #c5a880); font-weight: 600; margin-bottom: 4px;">Pago en Restaurante</div>
    <div style="font-family: var(--font-sans); font-size: 0.8rem; color: var(--lux-text-secondary, #c0bab0); letter-spacing: 0.05em;">Aceptamos Tarjetas bancarias, Efectivo y Bizum</div>
  </div>
</div>`;
}

/**
 * Creates and validates an RFC 9457 Problem Details object.
 */
export function createProblemDetails(params: {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  invalid_params?: Array<{ name: string; reason: string }>;
}): ProblemDetails {
  if (!params.type || typeof params.type !== 'string') {
    throw new Error('ProblemDetails requires a string "type" URI');
  }
  if (!params.title || typeof params.title !== 'string') {
    throw new Error('ProblemDetails requires a string "title"');
  }
  if (typeof params.status !== 'number' || !Number.isInteger(params.status) || params.status < 400 || params.status > 599) {
    throw new Error('ProblemDetails requires an HTTP error status code (400-599)');
  }

  const problem: ProblemDetails = {
    type: params.type,
    title: params.title,
    status: params.status
  };

  if (params.detail && typeof params.detail === 'string') problem.detail = params.detail;
  if (params.instance && typeof params.instance === 'string') problem.instance = params.instance;
  if (Array.isArray(params.invalid_params)) problem.invalid_params = params.invalid_params;

  return Object.freeze(problem);
}

/**
 * Renders an RFC 9457 Problem Details object into HTML.
 */
export function renderProblemToastHtml(problem: ProblemDetails): string {
  const icon = problem.status >= 500 ? '⚠️' : 'ℹ️';
  const detailHtml = problem.detail
    ? `<div class="toast-detail">${escapeHtml(problem.detail)}</div>`
    : '';

  return `<div class="toast error rfc-9457" role="alert" data-status="${problem.status}">
  <span class="toast-icon">${icon}</span>
  <div class="toast-content">
    <div class="toast-title">${escapeHtml(problem.title)}</div>
    ${detailHtml}
  </div>
</div>`;
}

/**
 * Displays an RFC 9457 Problem Details toast with auto-dismiss after 6s.
 */
export function showProblemToast(problem: ProblemDetails, containerId = 'toast-container'): void {
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderProblemToastHtml(problem).trim();
  const toast = wrapper.firstElementChild as HTMLElement;
  if (!toast) return;

  container.appendChild(toast);

  // Auto-dismiss after 6s
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 6000);
}

/**
 * Queries Firestore for available 30-min slots for a given date.
 */
export async function getAvailableSlots(dateStr: string): Promise<ReservationSlot[]> {
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  const allSlots = generateDaySlots(dayOfWeek);
  if (allSlots.length === 0) return [];

  try {
    const q = query(
      collection(db, 'reservations'),
      where('reservation_date', '==', dateStr),
      where('status', '!=', 'cancelled')
    );
    const qs = await getDocs(q);

    const counts: Record<string, number> = {};
    qs.docs.forEach(docSnap => {
      const r = docSnap.data();
      if (r.reservation_time) {
        const time = r.reservation_time.substring(0, 5);
        counts[time] = (counts[time] || 0) + 1;
      }
    });

    return allSlots.map(time => {
      const count = counts[time] || 0;
      const slotAvail = checkSlotAvailability(count);
      return {
        time,
        available: slotAvail.available,
        reason: slotAvail.reason
      };
    });
  } catch (err) {
    console.error('Error fetching availability:', err);
    return allSlots.map(time => ({ time, available: true }));
  }
}

/**
 * Queries Firestore reservations collection for reservation_date == dateStr
 * and counts active bookings (status != 'cancelled') for timeStr.
 */
export async function checkSlotAvailabilityAtSubmit(dateStr: string, timeStr: string): Promise<SlotCapacityResult> {
  const normTime = timeStr.trim().substring(0, 5);
  try {
    const q = query(
      collection(db, 'reservations'),
      where('reservation_date', '==', dateStr),
      where('status', '!=', 'cancelled')
    );
    const qs = await getDocs(q);

    let activeCount = 0;
    qs.docs.forEach(docSnap => {
      const r = docSnap.data();
      if (r.reservation_time && r.reservation_time.substring(0, 5) === normTime) {
        activeCount++;
      }
    });

    const isAvailable = activeCount < MAX_ACTIVE_RESERVATIONS_PER_SLOT;
    return {
      available: isAvailable,
      reason: isAvailable ? undefined : 'Completo',
      activeCount
    };
  } catch (err) {
    console.error('Error checking slot availability at submit:', err);
    return { available: true, activeCount: 0 };
  }
}

/**
 * Initializes reservation date picker, dynamic slots rendering,
 * and real-time Imperial Table advisory reaction on guest count change.
 */
export function initReservationUI(formId: string, containerId: string): void {
  const form = document.getElementById(formId) as HTMLFormElement | null;
  const container = document.getElementById(containerId);
  const dateInput = form?.querySelector('input[name="date"]') as HTMLInputElement | null;

  if (!form || !container || !dateInput) return;

  // Set min date to today
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;

  dateInput.addEventListener('change', async () => {
    const selectedDate = dateInput.value;
    if (!selectedDate) return;

    container.innerHTML = '<div class="loading-slots">Consultando disponibilidad...</div>';
    const slots = await getAvailableSlots(selectedDate);
    renderSlots(slots);
  });

  // Dynamic reaction for groups > 6 pax (Imperial Table banner)
  const peopleInput = form.querySelector('input[name="people"]') as HTMLInputElement | null;
  const imperialBanner = document.getElementById('imperial-table-notice');
  if (peopleInput && imperialBanner) {
    const updateImperialNotice = () => {
      const pax = parseInt(peopleInput.value, 10);
      if (!isNaN(pax) && pax > MAX_STANDARD_GROUP_SIZE) {
        imperialBanner.style.display = 'block';
      } else {
        imperialBanner.style.display = 'none';
      }
    };
    peopleInput.addEventListener('input', updateImperialNotice);
    peopleInput.addEventListener('change', updateImperialNotice);
    updateImperialNotice();
  }

  function renderSlots(slots: ReservationSlot[]) {
    container!.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '5px';
    wrapper.style.width = '100%';

    const label = document.createElement('label');
    label.className = 'slot-label-small';
    label.textContent = 'Hora disponible *';
    wrapper.appendChild(label);

    const select = document.createElement('select');
    select.name = 'time';
    select.required = true;
    select.className = 'slot-select-menu';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = slots.length === 0 ? 'Sin disponibilidad' : 'Seleccione hora...';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    slots.forEach(slot => {
      const opt = document.createElement('option');
      opt.value = slot.time;
      opt.textContent = `${slot.time}${slot.available ? '' : ' (Lleno)'}`;
      opt.disabled = !slot.available;
      select.appendChild(opt);
    });

    wrapper.appendChild(select);
    container!.appendChild(wrapper);
  }
}
