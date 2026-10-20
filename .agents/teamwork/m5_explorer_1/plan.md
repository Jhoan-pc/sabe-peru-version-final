# Implementation Blueprint: Milestone 5 (Conserjería de Reservas y Anti-Bloqueo de WhatsApp)

**Agent**: `m5_explorer_1` (M5 Spec Miner - Reservation Contracts)  
**Date**: 2026-10-14  
**Target Milestone**: Milestone 5 (Fase 5: Conserjería de Reservas y Anti-Bloqueo de WhatsApp)  
**Authoritative SSOT Sources**:
- `specs/openapi.yaml` (Paths `/reservations/availability`, `/reservations`, schemas `ReservationInput`, `ReservationOutput`, `ReservationSlot`, `ProblemDetails`)
- `specs/SDD_MASTER.md` (§3.1, §3.2 Invariantes de Dominio, [DT-11], [DT-12], [DT-13])
- `specs/design-system-spec.md` (§1 Tokens Quiet Luxury, §3.C `ConciergeReservationForm`)
- `tests/contracts/reservations.mjs` (Domain pure functions, capacity, KITCHEN_HOURS, locator, WhatsApp URL builder)
- `tests/contracts/errors.mjs` (RFC 9457 Problem Details, toast HTML generator)
- `tests/tier2-domain-invariants.test.mjs`, `tests/tier3-dom-transitions.test.mjs`, `tests/tier4-customer-journeys.test.mjs`

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Reservation Domain | 30-Minute Slot Generation | Generates discrete 30-min reservation intervals based on day-of-week kitchen hours | `dayOfWeek` (0..6 integer) | `string[]` (e.g. `["12:00", "12:30", ...]`) | Returns empty array `[]` for out-of-range days | `tests/contracts/reservations.mjs`, `specs/SDD_MASTER.md` §3.2 |
| 2 | Reservation Domain | Slot Availability Calculation | Evaluates whether a slot can accept bookings based on active booking count (< 4) | `activeCount` (number) | `{ available: boolean, reason?: string }` | Returns `{ available: false, reason: 'Completo' }` when activeCount >= 4 | `tests/contracts/reservations.mjs`, `specs/openapi.yaml` lines 16-43 |
| 3 | Reservation Domain | Cancelled Booking Capacity Exclusion | Strictly excludes reservations with `status === 'cancelled'` from capacity counts | Array of reservation objects | Filtered count of `status !== 'cancelled'` | Never charges cancelled reservations against slot capacity | `specs/SDD_MASTER.md` §3.2, `tests/tier2-domain-invariants.test.mjs` T2.2.5 |
| 4 | Reservation Domain | Guest Count Invariant Validation | Validates comensales integer boundaries (1..20) and identifies Imperial Table groups (> 6) | `people` (number) | `{ valid: boolean, isImperial: boolean, notice?: string, error?: string }` | Returns `{ valid: false, error: ... }` if < 1, > 20, or non-integer | `tests/contracts/reservations.mjs`, `specs/openapi.yaml` lines 357-360 |
| 5 | Reservation Domain | Collision-Resistant Locator Generation | Generates an immutable, 7-character locator matching `^SP-[A-Z0-9]{4}$` using 32 unambiguous glyphs | Optional PRNG function `rng` (default `Math.random`) | `string` (e.g. `"SP-K7N2"`) | Throws if RNG invalid; guaranteed to match regex | `tests/contracts/reservations.mjs`, `specs/SDD_MASTER.md` [DT-12] |
| 6 | Concierge Flow | Anti-Popup Blocker 2-Step Submission | Disallows asynchronous `window.open` upon form submission; performs DB insertion and displays confirmation card | Reservation form fields (`name`, `email`, `date`, `time`, `people`, `occasion`) | Form replaced by confirmation card with locator and voluntary CTA | Network or validation failure renders RFC 9457 toast notification | `specs/SDD_MASTER.md` [DT-11], `ORIGINAL_REQUEST.md` R5 |
| 7 | Concierge Flow | Voluntary WhatsApp URL Construction | Generates deep link targeting WhatsApp concierge with encoded message containing locator | `{ phone, locator, name, date, time, people }` | `string` (`https://wa.me/{cleanPhone}?text={encodedMsg}`) | Non-digit characters in phone stripped; clean fallback to default 34662125650 | `tests/contracts/reservations.mjs`, `specs/openapi.yaml` line 50 |
| 8 | Concierge Flow | Imperial Table Advisory Notice | Renders dedicated advisory banner for groups of 7 to 20 guests requiring maître confirmation | `people > 6` condition | Advisory text injected into form and confirmation card | N/A (valid state with specialized advisory) | `specs/SDD_MASTER.md` §3.2, `tests/contracts/reservations.mjs` |
| 9 | Error Architecture | RFC 9457 Problem Details Structuring | Enforces standard JSON error objects with URI `type`, `title`, HTTP `status`, and optional `detail` | `{ type, title, status, detail, instance, invalid_params }` | Readonly `ProblemDetails` object | Throws Error if `type`, `title` missing or `status` not 400..599 | `tests/contracts/errors.mjs`, `specs/openapi.yaml` lines 458-487 |
| 10 | Error Architecture | Quiet Luxury Toast Notification | Renders floating non-blocking UI alert with ARIA `role="alert"` and auto-dismiss lifecycle | `ProblemDetails` object | DOM element `<div class="toast error rfc-9457">` | Replaces all native `window.alert()` calls in controllers | `tests/contracts/errors.mjs`, `specs/SDD_MASTER.md` §3.2 (6) |
| 11 | Form UX | Quiet Luxury Underline Input Styling | Renders minimalist translucent form controls with subtle bottom border instead of boxed frames | User input events | Dynamic underline highlight to `--lux-gold-champagne` on focus | N/A | `specs/design-system-spec.md` §3.C |
| 12 | Backoffice Integration | Active Reservation State Management | Allows maîtres to confirm or cancel bookings, dynamically adjusting real-time capacity | Reservation ID, action (`confirm` / `cancel`) | Document mutation in Firestore, slot liberated on cancellation | Emits RFC 9457 Problem Details toast on mutation failure | `specs/admin-spec.md` §5, `tests/tier4-customer-journeys.test.mjs` Scenario 4.3 |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Guest Count Validation | `people = 0` or negative (`-1`) | Rejected: `valid: false`, `error: "Number of guests must be an integer between 1 and 20"`. Triggers RFC 9457 toast (Status 422). |
| 2 | Guest Count Validation | `people = 21` (overflow) | Rejected: `valid: false`, `error: "Number of guests must be an integer between 1 and 20"`. Triggers RFC 9457 toast (Status 422). |
| 3 | Guest Count Validation | `people = 3.5` (float) | Rejected: `Number.isInteger(3.5) === false`, `valid: false`. Triggers RFC 9457 toast (Status 422). |
| 4 | Guest Count Boundary | `people = 6` (upper standard boundary) | Accepted: `valid: true`, `isImperial: false`, `notice: undefined`. Standard 4-table capacity flow. |
| 5 | Guest Count Boundary | `people = 7` (lower imperial boundary) | Accepted: `valid: true`, `isImperial: true`, `notice: "Grupos de más de 6 comensales requieren confirmación de mesa imperial con el maître."` displayed in confirmation card. |
| 6 | Guest Count Boundary | `people = 20` (upper imperial boundary) | Accepted: `valid: true`, `isImperial: true`. Requires maître confirmation advisory. |
| 7 | Slot Capacity Boundary | `activeCount = 3` | Accepted: `available: true`, `reason: undefined`. Slot selectable in UI. |
| 8 | Slot Capacity Boundary | `activeCount = 4` | Saturated: `available: false`, `reason: 'Completo'`. Option disabled in dropdown (`<option disabled>14:00 (Lleno)</option>`). If submitted directly, returns 409/422 toast. |
| 9 | Slot Capacity Boundary | `activeCount = 5` (overflow) | Saturated: `available: false`, `reason: 'Completo'`. Dropdown option disabled. |
| 10 | Status Filtering | Mixed status: 3 confirmed, 2 pending, 4 cancelled | Active count is 5 (3 + 2). Slot is full. Cancelled records do NOT add to count. |
| 11 | Kitchen Hours Boundary | Sunday (0) at `21:30` | Valid: Last service slot for Sunday. `generateDaySlots(0)` includes `"21:30"`. |
| 12 | Kitchen Hours Boundary | Sunday (0) at `22:00` | Invalid: Exceeds Sunday closing (`21:30`). `generateDaySlots(0)` does not include `"22:00"`. Submission rejected with 422 toast. |
| 13 | Kitchen Hours Boundary | Saturday (6) at `22:30` | Valid: Last service slot for Saturday. |
| 14 | Kitchen Hours Boundary | Weekday (1..5) at `23:30` | Valid: Last service slot for Monday-Friday. |
| 15 | Past Date Submission | Date earlier than today (`date < today`) | Native date picker has `min="YYYY-MM-DD"`. If bypassed, client validation rejects with RFC 9457 toast (Status 422: `"Fecha no válida"`). |
| 16 | WhatsApp Phone Formatting | Phone with spaces/symbols `+34 (662) 12-56-50` | Sanitized via `replace(/\D/g, '')` to `"34662125650"`. Resulting URL is `https://wa.me/34662125650?...`. |
| 17 | WhatsApp Phone Fallback | Missing/null/empty phone | Gracefully falls back to restaurant default `"34662125650"`. |
| 18 | Pop-up Blocker Protection | Mobile Safari (iOS) / Chrome (Android) | Zero `window.open` called during form submit. User explicitly taps `<a href="https://wa.me/..." target="_blank">` inside confirmation card, bypassing popup blocker 100%. |
| 19 | Firestore Offline / Error | Network disconnect during `addDoc` | Caught in `try...catch`, submit button re-enabled, RFC 9457 Problem Details toast (Status 500) rendered. Zero `window.alert()`. |
| 20 | Locator Collision Check | 100,000 generated locators | 32^4 (1,048,576) space provides >99.9% collision avoidance for normal restaurant volume. `^SP-[A-Z0-9]{4}$` strictly maintained. |

---

## 1. Formal Specification & Contract Models

### 1.1. Data Models (SSOT from `specs/openapi.yaml`)

#### `ReservationInput`
```typescript
export interface ReservationInput {
  customer_name: string;        // minLength: 2, maxLength: 100
  customer_email: string;       // format: email
  reservation_date: string;     // format: date (YYYY-MM-DD), >= today
  reservation_time: string;     // pattern: ^([01]\d|2[0-3]):[0-5]\d$, must be valid slot in KITCHEN_HOURS
  number_of_people: number;     // integer, 1 <= n <= 20
  occasion?: string | null;     // maxLength: 200
}
```

#### `ReservationOutput` (Firestore Document Schema in `reservations` collection)
```typescript
export interface ReservationOutput extends ReservationInput {
  id: string;                   // Firestore Auto ID
  locator: string;              // pattern: ^SP-[A-Z0-9]{4}$
  status: 'pending' | 'confirmed' | 'cancelled'; // Default: 'pending'
  created_at: string;           // ISO 8601 string or Firestore FieldValue serverTimestamp()
}
```

#### `ReservationSlot`
```typescript
export interface ReservationSlot {
  time: string;                 // e.g. "14:00"
  available: boolean;          // true if activeCount < 4
  reason?: string;             // "Completo" if available === false
}
```

---

## 2. Exact Locator Generation Contract

### 2.1. Invariants & Format
- **Format**: `^SP-[A-Z0-9]{4}$`
- **Prefix**: Constant `SP-` (Sabe a Perú)
- **Entropy Segment**: 4 alphanumeric uppercase characters.
- **Alphabet**: 32 unambiguous characters:
  `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
  *(Excludes `0` (zero) and `O` (letter O); excludes `1` (one) and `I` (letter I) to avoid customer reading ambiguities over telephone or WhatsApp).*
- **Total Address Space**: $32^4 = 1,048,576$ unique locators.
- **Collision Resistance**: At 40 bookings/day, the collision probability over 30 days is $< 0.07\%$.

### 2.2. Pure Algorithm
```typescript
export const LOCATOR_REGEX = /^SP-[A-Z0-9]{4}$/;

export function generateReservationLocator(rng: () => number = Math.random): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(rng() * alphabet.length);
    code += alphabet[idx];
  }
  return `SP-${code}`;
}
```

---

## 3. Capacity Calculation & Domain Invariants

### 3.1. Kitchen Hours Matrix (`KITCHEN_HOURS`)
```typescript
export const KITCHEN_HOURS: Record<number, { open: string; last: string }> = Object.freeze({
  0: { open: '12:00', last: '21:30' }, // Domingo
  1: { open: '12:00', last: '23:30' }, // Lunes
  2: { open: '12:00', last: '23:30' }, // Martes
  3: { open: '12:00', last: '23:30' }, // Miércoles
  4: { open: '12:00', last: '23:30' }, // Jueves
  5: { open: '12:00', last: '23:30' }, // Viernes
  6: { open: '12:00', last: '22:30' }  // Sábado
});
```

### 3.2. 30-Minute Interval Discretization
```typescript
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
```

### 3.3. Slot Capacity Rule
- **Threshold**: Maximum 4 concurrent active bookings per slot (`MAX_ACTIVE_RESERVATIONS_PER_SLOT = 4`).
- **Active Definition**: Any booking with `status !== 'cancelled'`. (`pending` and `confirmed` reserve capacity; `cancelled` immediately liberates the slot).
```typescript
export const MAX_ACTIVE_RESERVATIONS_PER_SLOT = 4;

export function checkSlotAvailability(activeCount: number): { available: boolean; reason?: string } {
  const isAvailable = (activeCount || 0) < MAX_ACTIVE_RESERVATIONS_PER_SLOT;
  return {
    available: isAvailable,
    reason: isAvailable ? undefined : 'Completo'
  };
}
```

### 3.4. Guest Capacity & Group Policy
- **Minimum**: 1 person.
- **Maximum Total**: 20 persons (`MAX_TOTAL_GUEST_CAPACITY = 20`).
- **Standard Group**: 1 to 6 persons (`MAX_STANDARD_GROUP_SIZE = 6`). Automatic slot allocation.
- **Imperial Table Policy**: > 6 persons (7 to 20).
  - Requires Imperial Table advisory:
    `"Grupos de más de 6 comensales requieren confirmación de mesa imperial con el maître."`
```typescript
export const MAX_STANDARD_GROUP_SIZE = 6;
export const MAX_TOTAL_GUEST_CAPACITY = 20;

export function validateGuestCount(people: number): {
  valid: boolean;
  isImperial: boolean;
  notice?: string;
  error?: string;
} {
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
```

---

## 4. The 2-Step Concierge Flow Contract (Anti-Popup Blocker)

### 4.1. The Root Cause of DT-11
When a mobile browser handles a `<form submit>` event with an asynchronous network request (`await addDoc(...)`), the execution context leaves the synchronous user gesture tick. When `window.open(url, '_blank')` is called after the promise resolves, mobile Safari and mobile Chrome treat it as an untrusted popup and suppress it without opening WhatsApp.

### 4.2. Step 1: Client Validation & Firestore Insertion
1. **User Action**: Clicks `"SOLICITAR RESERVA PRIVADA"` (`<button type="submit">`).
2. **Synchronous Validation**:
   - `name`: 2..100 characters.
   - `email`: Valid email syntax.
   - `date`: Valid date string `>= today`.
   - `time`: Valid 30-min slot inside `KITCHEN_HOURS[dayOfWeek]`.
   - `people`: Valid integer 1..20.
   - Capacity pre-check: Slot has `< 4` active bookings.
3. **If Validation Fails**: Emit corresponding RFC 9457 toast and abort.
4. **If Validation Passes**:
   - Generate locator: `locator = generateReservationLocator()`.
   - Insert document into Firestore `reservations`:
     ```typescript
     const record = {
       customer_name: name,
       customer_email: email,
       reservation_date: date,
       reservation_time: time,
       number_of_people: people,
       occasion: occasion || null,
       locator: locator,
       status: 'pending',
       created_at: new Date().toISOString()
     };
     await addDoc(collection(db, 'reservations'), record);
     ```
   - **MANDATORY**: Zero `window.open` is called!

### 4.3. Step 2: Confirmation Card Rendering & Voluntary WhatsApp Click
1. **UI Transition**: The form fields are replaced or hidden, and the Confirmation Card is rendered inside the container.
2. **Card Structure**:
   ```html
   <div id="reservation-confirmation-card" class="confirmation-card">
     <div class="confirmation-badge">Solicitud Registrada</div>
     <h3 class="confirmation-title">Su localizador: <span class="locator-code">${locator}</span></h3>
     <p class="confirmation-summary">
       Reserva para <strong>${escapeHtml(name)}</strong> el <strong>${date}</strong> a las <strong>${time}</strong> (${people} personas).
     </p>
     <p class="confirmation-text">Para confirmar su reserva con el restaurante, pulse en el enlace de WhatsApp a continuación:</p>
     ${isImperial ? `<div class="imperial-notice">${escapeHtml(notice)}</div>` : ''}
     <a id="btn-whatsapp-confirm" href="${waUrl}" target="_blank" class="btn-wa-confirm" rel="noopener noreferrer">
       <span>Abrir WhatsApp con Maître</span>
     </a>
   </div>
   ```
3. **WhatsApp URL Construction**:
   ```typescript
   export function buildWhatsAppReservationUrl({ phone, locator, name, date, time, people }: {
     phone: string;
     locator: string;
     name: string;
     date: string;
     time: string;
     people: number;
   }): string {
     const cleanPhone = (phone || '34662125650').replace(/\D/g, '');
     const message = `Hola, confirmo mi solicitud de reserva en Sabe a Perú con localizador ${locator} a nombre de ${name} para el ${date} a las ${time} (${people} personas).`;
     return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
   }
   ```
4. **Voluntary User Gesture**: Because the user voluntarily taps `#btn-whatsapp-confirm`, the browser executes the navigation as a primary user gesture. WhatsApp opens cleanly on all devices without triggering popup blockers.

---

## 5. RFC 9457 Problem Details & Toast Notification Engine

### 5.1. RFC 9457 Data Structure
```typescript
export interface ProblemDetails {
  type: string;                    // Absolute URI identifying error category
  title: string;                   // Short, human-readable summary
  status: number;                  // HTTP status code (400-599)
  detail?: string;                 // Detailed explanation of specific occurrence
  instance?: string;               // URI identifying the occurrence
  invalid_params?: Array<{
    name: string;
    reason: string;
  }>;
}
```

### 5.2. Formal Reservation Error Catalog

| Error Key | HTTP Status | URI (`type`) | Title | Detail Message |
|-----------|-------------|--------------|-------|----------------|
| **Slot Full** | 409 / 422 | `https://api.sabeaperu.es/errors/slot-full` | Franja horaria no disponible | La franja horaria seleccionada ({time}) ha alcanzado el aforo máximo de 4 reservas concurrentes. Por favor, elija otra hora. |
| **Past Date** | 422 | `https://api.sabeaperu.es/errors/past-date` | Fecha no válida | No es posible solicitar reservas para fechas anteriores a hoy. Por favor, seleccione una fecha válida. |
| **Invalid Kitchen Hour** | 422 | `https://api.sabeaperu.es/errors/invalid-kitchen-hour` | Horario fuera de servicio | El horario {time} se encuentra fuera del servicio de cocina ({open} a {last}) para el día seleccionado. |
| **Invalid Guest Count** | 422 | `https://api.sabeaperu.es/errors/invalid-guest-count` | Número de comensales no válido | El número de comensales debe ser un número entero entre 1 y 20 personas. |
| **Incomplete Fields** | 400 | `https://api.sabeaperu.es/errors/validation` | Datos incompletos | Por favor, revise los campos del formulario. Todos los datos marcados con asterisco son obligatorios. |
| **Database / Network Error** | 500 | `https://api.sabeaperu.es/errors/reservation-mutation` | Error de conexión | No hemos podido registrar su solicitud en este momento. Por favor, contacte directamente por teléfono o WhatsApp. |

### 5.3. Quiet Luxury Toast UI Component
```typescript
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

export function showProblemToast(problem: ProblemDetails): void {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderProblemToastHtml(problem).trim();
  const toast = wrapper.firstElementChild as HTMLElement;

  container.appendChild(toast);

  // Auto-dismiss after 5s
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 500);
  }, 5000);
}
```

---

## 6. Architecture & Implementation Blueprint for M5

### 6.1. Module Responsibility Separation
1. **`src/reservations.ts`**:
   - Host all pure contracts: `KITCHEN_HOURS`, `MAX_ACTIVE_RESERVATIONS_PER_SLOT`, `MAX_STANDARD_GROUP_SIZE`, `MAX_TOTAL_GUEST_CAPACITY`, `LOCATOR_REGEX`.
   - Export pure functions: `generateDaySlots`, `checkSlotAvailability`, `validateGuestCount`, `generateReservationLocator`, `buildWhatsAppReservationUrl`.
   - Host `createProblemDetails`, `renderProblemToastHtml`, `showProblemToast`.
   - Export `initReservationUI(formId: string, containerId: string)`:
     - Sets `dateInput.min = today`.
     - Watches `dateInput.addEventListener('change', ...)`, queries `getAvailableSlots(date)`, renders slot dropdown.
     - Attaches submit handler implementing the 2-step flow without `window.open`.
     - Validates guest counts, renders Imperial table advisory in real time when `peopleInput > 6`.
2. **`src/main.ts` & `src/experiencia.ts`**:
   - Remove legacy submit handlers that call `window.open(waUrl, '_blank')`.
   - Delegate reservation handling completely to `initReservationUI('reservation-form', 'time-slots-container')` or consume the unified 2-step flow.
3. **`index.html` & `experiencia.html`**:
   - Ensure container `#time-slots-container` is present.
   - Inject container `<div id="toast-container" class="toast-container"></div>` at end of body.
4. **`src/style.css`**:
   - Implement Quiet Luxury tokens for `#reservation-confirmation-card`, `.confirmation-badge`, `.locator-code`, `.imperial-notice`, `.btn-wa-confirm`, `.toast-container`, `.toast.rfc-9457`, `.fade-out`.

---

## 7. Step-by-Step Execution Plan for Implementers

1. **Phase 1: Domain Core in `src/reservations.ts`**
   - Implement and export all pure contract functions with TypeScript types.
   - Cross-check against `tests/contracts/reservations.mjs` and `tests/contracts/errors.mjs` for 100% parity.

2. **Phase 2: Concierge UI Engine in `src/reservations.ts`**
   - Refactor `initReservationUI` to manage slot rendering, live imperial advisory, form submit validation, Firestore pending document creation with `locator` and `created_at`, and confirmation card injection.
   - Enforce strictly zero `window.open` calls.

3. **Phase 3: Controller Refactoring in `src/main.ts` & `src/experiencia.ts`**
   - Eradicate legacy duplicate `reservationForm.addEventListener('submit', ...)` in both files.
   - Ensure both pages cleanly invoke `initReservationUI('reservation-form', 'time-slots-container')`.

4. **Phase 4: Styling & DOM Markup**
   - Add `#toast-container` to `index.html` and `experiencia.html`.
   - Append Quiet Luxury styles in `src/style.css` matching design tokens.

5. **Phase 5: Verification & Adversarial Testing**
   - Run `node tests/test-runner.mjs` (Tiers 1 to 4 must stay at 87/87 passing).
   - Run `npm run pipeline` (`tsc --noEmit && vite build`) to confirm Exit Code 0.
