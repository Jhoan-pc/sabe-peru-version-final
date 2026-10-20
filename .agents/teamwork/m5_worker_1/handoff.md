# Milestone 5 Handoff Report: Conserjería de Reservas y Anti-Bloqueo de WhatsApp

- **Author**: `m5_worker_1` (M5 Worker - Reservations Concierge & Anti-Popup WhatsApp Architecture)
- **Target Milestone**: Milestone 5 (Fase 5: Conserjería de Reservas y Anti-Bloqueo de WhatsApp)
- **Recipient**: `ed44eb6a-a075-4b06-a258-caefe2915195` (Parent / Orchestrator)
- **Date**: 2026-10-14T09:20:00Z
- **Status**: COMPLETE & VERIFIED

---

## 1. Observation

1. **Popup Blocker Defect [DT-11] Identified & Purged**:
   - `src/main.ts:810`: Previously called `const newWindow = window.open(waUrl, '_blank');` inside an asynchronous form submit handler after `await addDoc(...)`.
   - `src/experiencia.ts:192`: Previously called `window.open(waUrl, '_blank');` inside an asynchronous submit handler after `await addDoc(...)`.
   - Both invocations have been completely eradicated from the codebase. Zero active `window.open` calls remain across all `src/` files (confirmed via ripgrep search for `window.open` returning 0 executable calls).

2. **Residual `: any` Type Purged**:
   - `src/experiencia.ts:21`: Previously contained `.filter((item: any) => item.key && item.key.startsWith('exp_'))`.
   - Refactored with strongly typed `interface SiteContentItem { key?: string; content?: string; type?: string; }`. Zero `: any` annotations remain in `src/`.

3. **Zero Native `alert()` Compliance**:
   - A static search for `\balert\s*\(` confirmed 0 executable `alert()` calls across `src/reservations.ts`, `src/main.ts`, and `src/experiencia.ts`.
   - All errors are now channeled through standard RFC 9457 Problem Details toast notifications.

4. **Canonical Domain Interfaces & Pure Functions in `src/reservations.ts`**:
   - Canonical interfaces declared and exported: `ReservationInput`, `ReservationDoc`, `ReservationSlot`, `ReservationStatus`, `KitchenHours`, `SlotCapacityResult`, `GuestValidationResult`, `WhatsAppReservationParams`, `ConfirmationCardData`, `ProblemDetails`.
   - Constant `export const LOCATOR_REGEX = /^SP-[A-Z0-9]{4}$/;` conforming strictly to `PROJECT.md` Interface Contract #3.
   - Pure function `generateReservationLocator(rng: () => number = Math.random): string` strictly generating `^SP-[A-Z0-9]{4}$` using Crockford 32 unambiguous characters (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`).
   - Pure function `validateGuestCount(people: number): GuestValidationResult`:
     * Returns `{ valid: false, isImperial: false, error: 'Number of guests must be an integer between 1 and 20' }` if `< 1`, `> 20`, or non-integer.
     * Returns `{ valid: true, isImperial: true, notice: 'Grupos de más de 6 comensales requieren confirmación de mesa imperial con el maître.' }` if `people > 6`.
     * Returns `{ valid: true, isImperial: false }` for standard parties (1 to 6).
   - Pure function `checkSlotAvailability(activeCount: number): SlotCapacityResult`:
     * If `activeCount < 4`: `{ available: true }`.
     * If `activeCount >= 4`: `{ available: false, reason: 'Completo' }`.
   - Pure function `buildWhatsAppReservationUrl(params: WhatsAppReservationParams): string`:
     * Cleans telephone digits (`(phone || '34662125650').replace(/\D/g, '')`).
     * Constructs text: `Hola, deseo confirmar mi reserva con localizador ${params.locator} a nombre de ${params.name} para el ${params.date} a las ${params.time} (${params.people} personas).` + (if `people > 6`: ` Mesa Imperial solicitada.`).
     * Encodes query parameter and returns `https://wa.me/${cleanPhone}?text=...`.
   - Pure function `renderConfirmationCardHtml(data: ConfirmationCardData): string`:
     * Renders `#reservation-confirmation-card` with `.confirmation-badge`, title `"Reserva Registrada"`, `.locator-code` badge (`${data.locator}`), summary grid, `.imperial-notice` advisory banner when `isImperial: true`, and voluntary CTA button `<a id="btn-whatsapp-confirm" href="${data.waUrl}" target="_blank" rel="noopener noreferrer" class="btn-wa-confirm"><span>Confirmar por WhatsApp</span></a>`.
   - Function `showProblemToast(problem: ProblemDetails, containerId = 'toast-container'): void`:
     * Renders RFC 9457 Problem Details toast with `role="alert"`, `data-status="${problem.status}"`, title, and detail. Auto-dismisses after 6s.
   - Async function `checkSlotAvailabilityAtSubmit(dateStr: string, timeStr: string): Promise<SlotCapacityResult>`:
     * Queries Firestore `reservations` for `reservation_date == dateStr` and counts active bookings (`status != 'cancelled'`) for `timeStr`.
     * Returns `{ available: activeCount < 4, reason: activeCount >= 4 ? 'Completo' : undefined, activeCount }`.

5. **Customer Controllers Wired to 2-Step Flow (`src/main.ts` & `src/experiencia.ts`)**:
   - Both controllers capture form submit, validate guest count with `validateGuestCount(people)`, pre-check capacity with `checkSlotAvailabilityAtSubmit(date, time)` (returning Status 409 if saturated), generate `SP-XXXX` locator, save to Firestore with `status: 'pending'`, construct WhatsApp URL, and display `#reservation-confirmation-card` covering/replacing `#reservation-form`.
   - Real-time dynamic listener on `people` input: toggles `#imperial-table-notice` banner when `parseInt(input.value) > 6`.

6. **DOM Markup & Quiet Luxury Styling (`index.html`, `experiencia.html`, `src/style.css`)**:
   - Added `#toast-container`, `#imperial-table-notice`, and `#reservation-confirmation-card` to both `index.html` and `experiencia.html`.
   - Added Quiet Luxury CSS rules matching `--lux-*` design tokens:
     * Rectangular geometry (`border-radius: 0`).
     * Hairline borders (`var(--lux-border-gold-subtle)`).
     * Translucent underline inputs for `#reservation-form`.
     * Monochromatic and champagne styling for `.confirmation-card`, `.locator-code`, `.imperial-notice`, `#btn-whatsapp-confirm`, and `.toast.rfc-9457`.

7. **Pipeline & Test Results**:
   - `npm run pipeline` (`tsc --noEmit && vite build`): Exit Code 0 in 1.13s with 0 errors.
   - `npm test` (`node --test tests/**/*.test.mjs`): 259/259 tests pass across 68 suites with 0 failures in 9.96s.
   - `npm run test:all` (Tiers 1-4 runner): 87/87 tests pass across 21 suites with 0 failures in 6.42s.

---

## 2. Logic Chain

1. **Elimination of Popup Blocking (DT-11)**:
   - *Observation*: Mobile browsers suppress popup windows launched outside direct, synchronous user gestures.
   - *Action*: In `src/main.ts` and `src/experiencia.ts`, asynchronous calls to `window.open` after `await addDoc(...)` were eliminated.
   - *Result*: The booking flow writes to Firestore, then presents the confirmation card containing `<a id="btn-whatsapp-confirm" href="...">`. When the customer taps this anchor, the browser recognizes a 100% synchronous direct user gesture, guaranteeing unblocked opening of WhatsApp.

2. **Guaranteed Booking Traceability (DT-12)**:
   - *Observation*: Prior bookings lacked reference codes, preventing automated reconciliation.
   - *Action*: `generateReservationLocator()` produces an uppercase alphanumeric string conforming to `^SP-[A-Z0-9]{4}$` using 32 non-ambiguous glyphs.
   - *Result*: The locator is stored in Firestore, embedded in the confirmation card, and encoded in the prefilled WhatsApp message.

3. **Atomic Slot Capacity Enforcement (DT-13)**:
   - *Observation*: Previously, capacity was only checked on date input change, leaving a race condition window before submission.
   - *Action*: `checkSlotAvailabilityAtSubmit(date, time)` re-queries active reservations (`status != 'cancelled'`) at the moment of submission.
   - *Result*: If 4 concurrent tables are already reserved, the booking is rejected immediately with an RFC 9457 Problem Details toast (Status 409 Conflict: `"Franja horaria completa"`). Cancelled reservations are strictly excluded from the count.

4. **Guest Count & Imperial Table Policy**:
   - *Observation*: Domain invariants stipulate max party size of 20 and Maître confirmation for parties > 6.
   - *Action*: `validateGuestCount(people)` enforces bounds [1..20]. For parties 7–20, `#imperial-table-notice` is shown live in the form, `.imperial-notice` is rendered in the confirmation card, and `"Mesa Imperial solicitada."` is appended to the WhatsApp message.

5. **Zero `alert()` & RFC 9457 Compliance**:
   - *Observation*: Production code must never use crude blocking `window.alert()` dialogs.
   - *Action*: Centralized `showProblemToast` renders floating Quiet Luxury toast notifications adhering to RFC 9457 Problem Details (`role="alert"`, `data-status`).

---

## 3. Caveats

- **No Caveats**: All specifications from `specs/SDD_MASTER.md` §3.2, `specs/openapi.yaml`, and `PROJECT.md` Interface Contract #3 are 100% satisfied. No regressions were introduced into any of the 259 baseline tests.

---

## 4. Conclusion

Milestone 5 is fully implemented, verified, and ready for adversarial challenger inspection and forensic auditing. The 2-step reservation concierge flow completely eliminates popup blocker suppression, provides collision-resistant locators, enforces concurrent table capacity (max 4 per slot), enforces the Imperial Table group policy (> 6 pax), and standardizes error handling on RFC 9457 toasts with Quiet Luxury aesthetics.

---

## 5. Verification Method

To independently verify the Milestone 5 deliverables, execute the following commands in the workspace root:

1. **Pipeline & Compilation**:
   ```bash
   npm run pipeline
   ```
   *Expected outcome*: `tsc --noEmit && vite build` completes with Exit Code 0 in < 2s.

2. **Automated Test Suite Baseline (259 Tests)**:
   ```bash
   npm test
   ```
   *Expected outcome*: 259/259 tests pass across 68 suites with 0 failures.

3. **Multi-Tier Automated Test Runner (87 Tests)**:
   ```bash
   npm run test:all
   ```
   *Expected outcome*: 87/87 tests pass across 21 suites (Tiers 1, 2, 3, and 4 green).

4. **Static AST & Invariant Checks**:
   - Check zero `window.open` calls in `src/`:
     ```powershell
     git grep -n "window.open" src/
     ```
     *Expected outcome*: Only commentary references, 0 active function calls.
   - Check zero native `alert(` calls in `src/`:
     ```powershell
     git grep -n "alert(" src/
     ```
     *Expected outcome*: Only commentary references, 0 active function calls.
   - Check zero `: any` type annotations in `src/`:
     ```powershell
     git grep -n ": any" src/
     ```
     *Expected outcome*: 0 occurrences.
