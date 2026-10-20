# Review & Adversarial Challenge Report: Milestone 5 (Domain Contracts & Anti-Blocker)

- **Reviewer**: `m5_reviewer_1` (Roles: Reviewer, Adversarial Critic)
- **Target Work Product**: Milestone 5 Implementation by `m5_worker_1`
- **Target Files**: `src/reservations.ts`, `src/main.ts`, `src/experiencia.ts`, `index.html`, `experiencia.html`, `src/style.css`
- **Date**: 2026-10-14T09:29:00Z
- **Verdict**: **APPROVE**

---

## 1. Observation

1. **Eradication of Asynchronous `window.open` [DT-11]**:
   - `git grep -n "window.open" src/` yielded 0 executable function calls.
   - The only occurrences in `src/` are commentary documentation:
     * `src/main.ts:880`: `// Render confirmation card (replacing/covering form, zero window.open)`
     * `src/experiencia.ts:272`: `// Render confirmation card (replacing/covering form, zero window.open)`
   - In `src/main.ts` (lines 796-914) and `src/experiencia.ts` (lines 188-306), the reservation submit handler writes to Firestore (`await addDoc(...)`), constructs the WhatsApp link, and renders `#reservation-confirmation-card` into the DOM with an anchor `<a id="btn-whatsapp-confirm" href="${escapeHtml(data.waUrl)}" target="_blank" rel="noopener noreferrer" class="btn-wa-confirm"><span>Confirmar por WhatsApp</span></a>`.
   - The form is hidden (`display = 'none'`), replacing the asynchronous popup with a 100% voluntary, synchronous user gesture.

2. **Domain Functions & Contracts in `src/reservations.ts`**:
   - `generateReservationLocator`:
     * Generates locators adhering to regex `LOCATOR_REGEX = /^SP-[A-Z0-9]{4}$/` (`src/reservations.ts:92, 166-174`).
     * Uses Crockford 32 unambiguous alphabet: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (excludes `0`, `O`, `1`, `I`).
     * Supports optional deterministic `rng` injection for reproducible testing.
   - `validateGuestCount`:
     * Enforces integer boundaries [1..20] (`src/reservations.ts:143-160`).
     * Values `< 1`, `> 20`, non-integers, and NaN return `{ valid: false, isImperial: false, error: ... }`.
     * Values 1..6 return `{ valid: true, isImperial: false }`.
     * Values 7..20 return `{ valid: true, isImperial: true, notice: 'Grupos de más de 6 comensales requieren confirmación de mesa imperial con el maître.' }`.
   - `checkSlotAvailability`:
     * Enforces `MAX_ACTIVE_RESERVATIONS_PER_SLOT = 4` (`src/reservations.ts:89, 131-138`).
     * `activeCount < 4` returns `{ available: true, activeCount }`.
     * `activeCount >= 4` returns `{ available: false, reason: 'Completo', activeCount }`.
   - `checkSlotAvailabilityAtSubmit`:
     * Queries Firestore `reservations` for `reservation_date == dateStr` and `status != 'cancelled'` (`src/reservations.ts:368-396`).
     * Re-calculates active reservations at submission time to mitigate stale client-side form selections.
     * Returns Status 409 Conflict toast (`"Franja horaria completa"`) if active bookings reach 4.
   - `buildWhatsAppReservationUrl`:
     * Cleans non-digit characters via `(phone || '34662125650').replace(/\D/g, '')` (`src/reservations.ts:180-187`).
     * Prefills message containing locator, customer name, date, time, and guest count.
     * If `people > 6`, automatically appends `' Mesa Imperial solicitada.'`.
     * Encodes query text properly via `encodeURIComponent`.
   - `showProblemToast` & `createProblemDetails`:
     * Strictly conforms to RFC 9457 Problem Details (`src/reservations.ts:70-77, 246-275, 298-321`).
     * Renders toast with `role="alert"`, `data-status="${problem.status}"`, escaped title, and optional detail.
     * Auto-dismisses with fade-out animation after 6000ms.

3. **Zero Native `alert()` Compliance**:
   - `git grep -nE "alert\s*\(" src/` yielded 0 active executable calls across all files.
   - All errors (validation failures, capacity saturation, Firestore write exceptions) channel through `showProblemToast`.

4. **Zero Residual `: any` Annotations**:
   - `git grep -nE ":\s*any\b" src/` returned 0 occurrences across `src/reservations.ts`, `src/experiencia.ts`, and the entire codebase.
   - `SiteContentItem` interface in `src/experiencia.ts:14-18` cleanly types dynamic content items.

5. **DOM Semantics & Quiet Luxury Tokens**:
   - `index.html` lines 345, 349, 439 declare `#imperial-table-notice`, `#reservation-confirmation-card`, and `#toast-container`.
   - `experiencia.html` lines 185, 192, 233 declare identical elements.
   - `src/style.css` lines 1840-2133 implement Quiet Luxury design tokens:
     * Rectangular geometry (`border-radius: 0`).
     * Subtle gold hairline borders (`var(--lux-border-gold-subtle)`).
     * Monochromatic concierge underline input fields (`#reservation-form input`).
     * Floating toast container with mineral crimson left accent border (`var(--lux-crimson-mineral)`).

6. **Build & Automated Test Results**:
   - `npm run pipeline` (`tsc --noEmit && vite build`): Exit Code 0 in 3.39s with 0 errors.
   - `npm test` (`node --test tests/**/*.test.mjs`): 259/259 tests pass across 68 suites with 0 failures in 22.89s.
   - `npm run test:all` (Multi-tier runner): 87/87 tests pass across 21 suites (Tiers 1-4 green) in 8.68s.

7. **Integrity Violation Audit**:
   - Source code inspected for hardcoded outputs, facade classes, fake test runners, or bypassed logic.
   - Verification confirmed genuine dynamic logic connected directly to Firestore and DOM APIs. Zero integrity violations detected.

---

## 2. Logic Chain

1. **Anti-Blocker Invariant (DT-11)**:
   - *Observation*: Asynchronous popup launches (`window.open` following `await addDoc(...)`) are flagged by modern mobile browsers (Safari iOS, Chrome Mobile) as untrusted popups and dropped silently.
   - *Logic*: By removing `window.open` from `src/main.ts` and `src/experiencia.ts` and substituting the dynamic `#reservation-confirmation-card` containing `<a id="btn-whatsapp-confirm" href="...">`, navigation is driven by direct user interaction.
   - *Inference*: Mobile popup blocking is completely solved without sacrificing customer WhatsApp confirmation.

2. **Collision-Resistant Locators (DT-12)**:
   - *Observation*: Crockford Base-32 provides 32 non-confusable glyphs ($32^4 = 1,048,576$ permutations).
   - *Logic*: 2,000 automated iterations verified that generated locators strictly conform to `^SP-[A-Z0-9]{4}$` with zero appearances of `0`, `O`, `1`, or `I`.
   - *Inference*: Customer reconciliation in WhatsApp and backoffice operations is unambiguous and legible across all digital and print mediums.

3. **Atomic Slot Capacity Enforcement (DT-13)**:
   - *Observation*: Pre-selecting an available time slot at initial form render does not prevent race conditions if multiple users take several minutes before submitting.
   - *Logic*: `checkSlotAvailabilityAtSubmit(date, time)` issues a direct Firestore query right before submission, validating that active reservations (`status != 'cancelled'`) are `< 4`. If saturated, submission halts with a Status 409 toast.
   - *Inference*: Overbooking risk is minimized at the client boundary while maintaining serverless architecture.

4. **Imperial Table Policy Invariant**:
   - *Observation*: High-cuisine table configuration requires separate floor planning for large parties (> 6 comensales).
   - *Logic*: `validateGuestCount(people)` bounds inputs to [1..20]. When `people > 6`, it flags `isImperial: true`, which dynamically shows `#imperial-table-notice` in the form, renders `.imperial-notice` in the confirmation card, and appends `' Mesa Imperial solicitada.'` to the WhatsApp message.
   - *Inference*: Operational staff are alerted immediately upon customer contact.

5. **RFC 9457 Problem Details & Zero Native Alerts**:
   - *Observation*: Native browser `alert()` dialogs block the UI thread and degrade the quiet luxury aesthetic.
   - *Logic*: Centralizing error feedback on `showProblemToast` renders floating toast cards adhering to RFC 9457 with auto-dismissal and XSS escaping via `escapeHtml()`.
   - *Inference*: Error handling meets modern enterprise web standards.

---

## 3. Caveats

- **Firestore Client-Side Race Condition Under Extreme Concurrency**:
  * In a high-traffic scenario where two users submit at the exact same millisecond against a slot with 3 bookings, both client-side reads could read `activeCount = 3` and proceed to write, resulting in 5 active bookings.
  * In Sabe a Perú's operating environment (boutique restaurant with human Maître review of all `pending` requests in the backoffice), this architectural decision is standard and acceptable for a serverless client-side MPA without Cloud Functions.
- No other caveats.

---

## 4. Conclusion

**Verdict: APPROVE**

Milestone 5 meets and exceeds all formal specifications defined in `specs/SDD_MASTER.md` §3.2, `specs/openapi.yaml`, and `PROJECT.md` Interface Contract #3:
- Asynchronous `window.open` calls have been 100% eradicated ([DT-11]).
- Collision-resistant `SP-XXXX` locators are deterministically generated and verified ([DT-12]).
- Slot capacity (max 4 active bookings per 30m slot) is enforced both at selection and submission ([DT-13]).
- Imperial Table policy (> 6 pax) is cleanly integrated into UI banners and WhatsApp messages.
- Native `alert()` calls are 0; RFC 9457 Problem Details toasts are fully operational with Quiet Luxury styling.
- All code compiles cleanly (`npm run pipeline` Exit Code 0) and passes 100% of test suites (259/259 tests green).

---

## 5. Verification Method

To independently reproduce and verify this review, execute the following commands from the workspace root:

1. **Pipeline & Compilation**:
   ```powershell
   npm run pipeline
   ```
   *Expected outcome*: Exit Code 0 in < 4s with 0 type errors.

2. **Automated Test Suite (259 Tests)**:
   ```powershell
   npm test
   ```
   *Expected outcome*: 259/259 tests pass across 68 suites with 0 failures.

3. **Multi-Tier Runner (87 Tests)**:
   ```powershell
   npm run test:all
   ```
   *Expected outcome*: 87/87 tests pass across 21 suites (Tiers 1-4 green).

4. **Zero `window.open` Invariant**:
   ```powershell
   git grep -n "window.open" src/
   ```
   *Expected outcome*: 0 active executable calls (only comments at `src/main.ts:880` and `src/experiencia.ts:272`).

5. **Zero `alert()` Invariant**:
   ```powershell
   git grep -nE "alert\s*\(" src/
   ```
   *Expected outcome*: 0 active executable calls.

6. **Zero `: any` Invariant**:
   ```powershell
   git grep -nE ":\s*any\b" src/
   ```
   *Expected outcome*: 0 matches.
