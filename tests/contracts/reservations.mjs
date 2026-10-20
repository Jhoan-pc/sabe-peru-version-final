/**
 * Reservation Domain Contract: Capacity, Kitchen Hours, Locators & WhatsApp
 * Formal SSOT: specs/SDD_MASTER.md §3.2, specs/openapi.yaml, PROJECT.md Interface Contract #3
 */

export const KITCHEN_HOURS = Object.freeze({
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
 * Generate 30-minute intervals for a day of week
 * @param {number} dayOfWeek (0-6)
 * @returns {string[]} e.g. ["12:00", "12:30", ...]
 */
export function generateDaySlots(dayOfWeek) {
  const hours = KITCHEN_HOURS[dayOfWeek];
  if (!hours) return [];

  const slots = [];
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
 * Calculates slot availability given active reservation count.
 * @param {number} activeCount
 * @returns {{ available: boolean, reason?: string }}
 */
export function checkSlotAvailability(activeCount) {
  const isAvailable = (activeCount || 0) < MAX_ACTIVE_RESERVATIONS_PER_SLOT;
  return {
    available: isAvailable,
    reason: isAvailable ? undefined : 'Completo'
  };
}

/**
 * Validates group size invariants.
 * @param {number} people
 * @returns {{ valid: boolean, isImperial: boolean, error?: string }}
 */
export function validateGuestCount(people) {
  if (typeof people !== 'number' || !Number.isInteger(people) || people < 1 || people > MAX_TOTAL_GUEST_CAPACITY) {
    return {
      valid: false,
      isImperial: false,
      error: `Number of guests must be an integer between 1 and ${MAX_TOTAL_GUEST_CAPACITY}`
    };
  }

  return {
    valid: true,
    isImperial: people > MAX_STANDARD_GROUP_SIZE,
    notice: people > MAX_STANDARD_GROUP_SIZE
      ? 'Grupos de más de 6 comensales requieren confirmación de mesa imperial con el maître.'
      : undefined
  };
}

/**
 * Generates an immutable, collision-resistant reservation locator: SP-XXXX
 * @param {() => number} [rng=Math.random]
 * @returns {string} e.g. "SP-K7N2"
 */
export function generateReservationLocator(rng = Math.random) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 unambiguous chars (no 0/O, 1/I)
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
 * @param {{ phone: string, locator: string, name: string, date: string, time: string, people: number }} data
 * @returns {string}
 */
export function buildWhatsAppReservationUrl({ phone, locator, name, date, time, people }) {
  const cleanPhone = (phone || '34662125650').replace(/\D/g, '');
  const message = `Hola, confirmo mi solicitud de reserva en Sabe a Perú con localizador ${locator} a nombre de ${name} para el ${date} a las ${time} (${people} personas).`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
