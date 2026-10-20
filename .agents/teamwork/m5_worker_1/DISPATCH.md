## 2026-10-14T09:04:29Z
You are m5_worker_1 (M5 Worker - Reservations Concierge & Anti-Popup WhatsApp Architecture).
Your working directory is: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m5_worker_1
Original User Request (MANDATORY: read this first): c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\ORIGINAL_REQUEST.md
Master Project Plan: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\PROJECT.md
Parent conversation ID: ed44eb6a-a075-4b06-a258-caefe2915195

Relevant domain skills:
c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\especialista-admin-backoffice\SKILL.md
c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\luxury-web-design\SKILL.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

READ THE IMPLEMENTATION BLUEPRINTS FIRST:
- c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m5_explorer_1\plan.md (Specification Mining & Contracts)
- c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m5_explorer_2\plan.md (Codebase & DOM Architecture Blueprint)
- c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m5_explorer_3\plan.md (Test Matrix & Safety Rules)

WRITE OWNERSHIP:
You have exclusive write ownership of:
- src/reservations.ts
- src/main.ts
- src/experiencia.ts
- index.html
- experiencia.html
- src/style.css

TASK:
Implement Milestone 5 (Fase 5: Conserjería de Reservas y Anti-Bloqueo de WhatsApp):

1. In `src/reservations.ts`:
   - Declare canonical interfaces: `ReservationInput`, `ReservationDoc`, `ReservationSlot`, `ReservationStatus`, `KitchenHours`, `SlotCapacityResult`, `GuestValidationResult`, `WhatsAppReservationParams`, `ConfirmationCardData`, `ProblemDetails`.
   - Implement and export pure functions:
     * `export const LOCATOR_REGEX = /^SP-[A-Z0-9]{4}$/;`
     * `export function generateReservationLocator(rng: () => number = Math.random): string` strictly conforming to `^SP-[A-Z0-9]{4}$` using Crockford 32 unambiguous characters (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`).
     * `export function validateGuestCount(people: number): GuestValidationResult`:
       - Valid if integer between 1 and 20.
       - If `people > 6`: `isImperial: true`, with notice `"Grupos de más de 6 comensales requieren confirmación de mesa imperial con el maître."`.
       - If invalid (`< 1`, `> 20`, or non-integer): `valid: false`, `error: "Number of guests must be an integer between 1 and 20"`.
     * `export function checkSlotAvailability(activeCount: number): { available: boolean; reason?: string }`:
       - If `activeCount < 4`: `{ available: true }`.
       - If `activeCount >= 4`: `{ available: false, reason: 'Completo' }`.
     * `export function buildWhatsAppReservationUrl(params: WhatsAppReservationParams): string`:
       - Clean phone (`replace(/\D/g, '')` or fallback `'34662125650'`).
       - Construct text: `Hola, deseo confirmar mi reserva con localizador ${params.locator} a nombre de ${params.name} para el ${params.date} a las ${params.time} (${params.people} personas).` + (if `people > 6`: ` Mesa Imperial solicitada.`).
       - Return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`.
     * `export function renderConfirmationCardHtml(data: ConfirmationCardData): string`:
       - Renders `#reservation-confirmation-card` containing:
         * Header / title: "Reserva Registrada"
         * Prominent locator badge with class `.locator-code`: `${data.locator}`
         * Details list (fecha, hora, comensales, nombre, email/teléfono)
         * If `data.isImperial`: advisory banner `.imperial-notice` with text `"Mesa Imperial: Su solicitud para más de 6 personas requiere confirmación de disponibilidad por parte del Maître."`
         * Voluntary WhatsApp CTA button:
           `<a id="btn-whatsapp-confirm" href="${data.waUrl}" target="_blank" rel="noopener noreferrer" class="btn-wa-confirm"><span>Confirmar por WhatsApp</span></a>`
     * `export function showProblemToast(problem: ProblemDetails, containerId = 'toast-container'): void`:
       - Renders structured RFC 9457 Problem Details toast with `role="alert"`, `data-status="${problem.status}"`, title, and detail. Auto-dismiss after 6s.
     * `export async function checkSlotAvailabilityAtSubmit(dateStr: string, timeStr: string): Promise<SlotCapacityResult>`:
       - Queries Firestore `reservations` collection for `reservation_date == dateStr` and counts active bookings (`status != 'cancelled'`) for `timeStr`.
       - Returns `{ available: activeCount < 4, reason: activeCount >= 4 ? 'Completo' : undefined, activeCount }`.

2. In `src/main.ts` and `src/experiencia.ts`:
   - COMPLETELY ERADICATE `window.open` in both files (lines 810 and 192). Zero asynchronous `window.open` calls allowed!
   - Wire customer reservation submission to the 2-step concierge flow:
     * Read form inputs (`name`, `email`, `phone`, `date`, `time`, `people`, `occasion`).
     * Validate guest count with `validateGuestCount(people)`. If invalid, show RFC 9457 toast (Status 422) and stop.
     * Check slot capacity with `checkSlotAvailabilityAtSubmit(date, time)`. If full (`available === false`), show RFC 9457 toast (Status 409: "Franja horaria completa", detail: "El aforo máximo de 4 mesas concurrentes ha sido alcanzado.") and stop.
     * Generate locator via `generateReservationLocator()`.
     * Persist reservation in Firestore collection `reservations` with:
       `{ customer_name, customer_email, customer_phone, reservation_date, reservation_time, number_of_people, occasion, locator, status: 'pending', created_at: new Date().toISOString() }`
     * Build WhatsApp URL with `buildWhatsAppReservationUrl(...)`.
     * Display `#reservation-confirmation-card` with `renderConfirmationCardHtml(...)` replacing or covering `#reservation-form`.
     * Wire dynamic listener on comensales input: when `parseInt(input.value) > 6`, display `#imperial-table-notice` banner; when `<= 6`, hide it.
   - Eradicate any residual `: any` types. Ensure 0 native `alert()` calls.

3. In `index.html` and `experiencia.html`:
   - Ensure `<div id="toast-container" class="toast-container"></div>` is present inside `<body>`.
   - Add `<div id="imperial-table-notice" class="imperial-notice" style="display:none;" role="status">Grupos de más de 6 comensales se asignan a nuestra Mesa Imperial y requieren confirmación directa con el Maître.</div>` above or below the guest input in `#reservation-form`.

4. In `src/style.css`:
   - Add Quiet Luxury styles using `--lux-*` design tokens for:
     * `#toast-container` and `.toast.rfc-9457`
     * `#reservation-confirmation-card`, `.locator-code`, `.imperial-notice`, `#btn-whatsapp-confirm`
     * Underline inputs and transitions.

5. Verification:
   - Run `npm run pipeline` (`tsc --noEmit && vite build`) -> verify Exit Code 0 and 0 errors.
   - Run `npm test` -> verify all 259+ tests pass.
   - Run `npm run test:all` -> verify 87/87 tests pass.
   - Write your complete handoff report to: `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m5_worker_1\handoff.md`.
   - Notify parent (Recipient: ed44eb6a-a075-4b06-a258-caefe2915195).
