# Handoff Report: Milestone 5 Codebase & DOM Flow Investigation

**Agent**: `m5_explorer_2` (M5 Explorer - Codebase & DOM Flow)  
**Date**: 2026-10-14  
**Type**: Hard Handoff (Investigation & Architecture Blueprint Complete)  
**Artifact Path**: `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m5_explorer_2\plan.md`  

---

## 1. Observation

1. **Active `window.open` Invocations in Production**:
   - `src/main.ts:810`:
     ```typescript
     const newWindow = window.open(waUrl, '_blank');
     ```
   - `src/experiencia.ts:192`:
     ```typescript
     window.open(waUrl, '_blank');
     ```
   Both calls execute after `await addDoc(collection(db, 'reservations'), reservationForDb);`, breaking user-gesture activation chains and causing popup blockers to suppress the window on mobile devices (iOS Safari, Android Chrome).
2. **Native `alert()` Calls**:
   - Inspection of `src/reservations.ts`, `src/main.ts`, and `src/experiencia.ts` confirmed exactly **0 active calls** to `alert()`.
   - Error messages are currently rendered via crude `formMessage.textContent` assignments rather than RFC 9457 Problem Details toast notifications.
3. **Capacity Checking & Race Condition Flaws**:
   - In `src/reservations.ts:40-69`, `getAvailableSlots(dateStr)` computes slot occupancy `(counts[time] || 0) < 4` solely on date change.
   - At form submission (`src/main.ts:772-845` and `src/experiencia.ts:156-224`), **no pre-flight capacity check** is performed before Firestore insertion (`addDoc`), allowing concurrent overbooking.
4. **Missing Collision-Resistant Locator (`SP-XXXX`)**:
   - Neither `src/main.ts` nor `src/experiencia.ts` generates or stores a reservation locator when persisting to Firestore.
   - The test contract helper `tests/contracts/reservations.mjs:86-94` defines `generateReservationLocator()`, but it is currently absent from `src/reservations.ts`.
5. **Missing Group > 6 Dynamic Reaction**:
   - `index.html:318-346` and `experiencia.html:152-188` define `<input type="number" name="people" ... min="1" max="20">`, but neither form provides an advisory container (`#imperial-table-notice`) nor listeners reacting to comensales > 6.
6. **Form Inputs Inventory**:
   - Both `index.html` and `experiencia.html` currently lack an input for customer phone (`name="phone"`), preventing direct backoffice Maître WhatsApp engagement (`specs/admin-spec.md` §5).
7. **CSS Tokens & Styling Status**:
   - In `src/style.css:810-865`, `.modern-form` and `.booking-card` use generic styling.
   - Rules for `.confirmation-card`, `#reservation-confirmation-card`, `.locator-code`, `.btn-wa-confirm`, and `#imperial-table-notice` do not exist in `src/style.css`.
8. **Pipeline & Test Suite Baseline**:
   - `npm run pipeline` completes with **Exit Code 0** in 1.55s.
   - `npm test` runs 13 suites and passes **259/259 tests** with zero failures.

---

## 2. Logic Chain

1. **From Observation 1 to Anti-Popup Strategy**:
   - Because `window.open` is called after an asynchronous `await addDoc` call, modern browsers classify it as an unsolicited popup and block it.
   - Therefore, the application must decouple the Firestore persistence step from the WhatsApp interaction.
   - Step 1: Save the record to Firestore with `status: 'pending'` and a generated locator `SP-XXXX`.
   - Step 2: Render a dedicated confirmation card (`#reservation-confirmation-card`) featuring the locator, booking summary, and a voluntary anchor `<a id="btn-whatsapp-confirm" href="${waUrl}" target="_blank">`.
   - Since the user manually clicks the rendered WhatsApp button, this constitutes a direct, trusted user gesture that no browser will block.
2. **From Observation 3 to Atomic Capacity Enforcement**:
   - Because users may spend several minutes filling the form after choosing a date/time, a slot with 3 bookings may become fully booked (4 bookings) in the interim.
   - Therefore, the submission controller must execute an atomic pre-flight query: if active bookings for `(reservation_date, reservation_time)` have reached 4, it must reject the submission with an RFC 9457 Problem Details toast (`type: 'https://api.sabeaperu.es/errors/slot-full'`) and refresh available slots.
3. **From Observation 4 & 5 to Domain Engine Hardening**:
   - `src/reservations.ts` must export pure domain functions (`generateReservationLocator`, `validateGuestCount`, `checkSlotAvailability`, `buildWhatsAppReservationUrl`, `renderConfirmationCardHtml`).
   - Group counts > 6 must dynamically display `#imperial-table-notice` in the form, and embed `<div class="imperial-notice">` inside the confirmation card, satisfying `specs/SDD_MASTER.md` §3.2 and test T3.4.5.
4. **From Observation 6 & 7 to Quiet Luxury Harmonization**:
   - Implementing `#imperial-table-notice` and `#reservation-confirmation-card` using `--lux-bg-charcoal`, `--lux-gold-champagne`, and straight hairlines (`border-radius: 0`) aligns the reservation flow with the 3-Michelin-Star Quiet Luxury specification.

---

## 3. Caveats

1. **Firestore Security Rules**: The pre-flight check in `src/reservations.ts` is client-side. In a high-concurrency production scenario with hundreds of simultaneous requests, a Firestore Cloud Function or transaction would provide absolute concurrency guarantees; for the current MPA scope, client-side pre-flight querying meets all spec requirements.
2. **Phone Number Field**: Adding `<input type="tel" name="phone">` must remain optional (`required` false) so existing tests and casual users can submit without mandatory phone entry, while populating `customer_phone` for backoffice operations.
3. **Inline Styles Cleanup**: `experiencia.html` contains heavy inline CSS on form elements. These should be progressively migrated to CSS classes in `src/style.css` without breaking layout geometry.

---

## 4. Conclusion

The technical architecture for Milestone 5 is fully mapped, verified against test suites Tiers 1-5, and documented in `plan.md`. The implementation requires:
1. Eradicating `window.open` in `src/main.ts` and `src/experiencia.ts` in favor of a 2-step confirmation flow.
2. Expanding `src/reservations.ts` with zero-`: any` interfaces, pure domain utilities, atomic capacity validation, and DOM UI binding.
3. Adding `#imperial-table-notice`, optional phone input, and `#reservation-confirmation-card` to `index.html` and `experiencia.html`.
4. Adding Quiet Luxury CSS rules for confirmation cards, locators, and imperial notices to `src/style.css`.

---

## 5. Verification Method

To independently verify the implementation once applied:
1. **Compilation Check**:
   ```powershell
   npm run pipeline
   ```
   *Expected result*: Exit Code 0, TypeScript checks clean, Vite build completes in < 2.0s.
2. **Test Suite Verification**:
   ```powershell
   npm test
   ```
   *Expected result*: 259/259 tests passing.
3. **Static Hygiene Audit**:
   - Search for `window.open` across `src/`: must return 0 occurrences.
   - Search for `alert(` across `src/`: must return 0 occurrences.
   - Search for `: any` in `src/reservations.ts`: must return 0 occurrences.
   - Verify locator regex: `assert.match(locator, /^SP-[A-Z0-9]{4}$/)`.
