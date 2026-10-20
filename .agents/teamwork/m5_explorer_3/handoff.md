# Milestone 5: Handoff Report — Test Matrix & Safety Assurance
**Explorer Agent**: `m5_explorer_3`  
**Timestamp**: 2026-10-14T09:12:00Z  
**Recipient**: `ed44eb6a-a075-4b06-a258-caefe2915195` (Orchestrator)  
**Deliverable Document**: `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m5_explorer_3\plan.md`  

---

## 1. Observation

Direct code and test observations extracted from the live repository:

1. **Current Pipeline & Test Baseline**:
   - `npm run pipeline` (`tsc --noEmit && vite build`):
     ```text
     vite v7.3.1 building client environment for production...
     transforming...
     ✓ 34 modules transformed.
     dist/carta.html                         8.67 kB │ gzip:   2.48 kB
     dist/experiencia.html                  16.35 kB │ gzip:   4.08 kB
     dist/index.html                        22.22 kB │ gzip:   5.59 kB
     dist/admin.html                        34.42 kB │ gzip:   5.76 kB
     dist/assets/style-qPEXDy5l.css         26.65 kB │ gzip:   6.39 kB
     dist/assets/reservations-_sfcBc-F.js    2.10 kB │ gzip:   1.04 kB
     dist/assets/admin-C4LvboR6.js          20.95 kB │ gzip:   6.61 kB
     dist/assets/main-DC5e3o42.js           17.06 kB │ gzip:   7.00 kB
     dist/assets/firebase-DsyAj6dp.js      367.95 kB │ gzip: 114.50 kB
     ✓ built in 2.10s
     ```
     Exit Code: **0**.
   - `npm test` (`node --test tests/**/*.test.mjs`):
     ```text
     ℹ tests 259
     ℹ suites 68
     ℹ pass 259
     ℹ fail 0
     ℹ cancelled 0
     ℹ skipped 0
     ℹ todo 0
     ℹ duration_ms 11396.8692
     ```
     Exit Code: **0**.

2. **Critical Anti-Blocker Violation [DT-11] Active in Customer Controllers**:
   - `src/main.ts` lines 809–811:
     ```typescript
     // Try to open WhatsApp
     const newWindow = window.open(waUrl, '_blank');
     ```
   - `src/experiencia.ts` lines 192–193:
     ```typescript
     window.open(waUrl, '_blank');
     ```
   Both calls execute inside asynchronous form submission listeners (`async (e) => { ... await addDoc(...); window.open(...) }`). On mobile browsers (Safari on iOS, Chrome on Android), this asynchronous gesture is systematically blocked as an unrequested popup.

3. **Absence of Locator Generation in Customer Controllers**:
   - `src/main.ts` lines 785–796 saves:
     ```typescript
     const reservationForDb = {
       customer_name: formData.get('name'),
       customer_email: formData.get('email'),
       reservation_date: formData.get('date'),
       reservation_time: formData.get('time'),
       number_of_people: parseInt(formData.get('people') as string),
       occasion: formData.get('occasion'),
       status: 'pending'
     };
     ```
     `locator` is completely missing from the Firestore document and the WhatsApp message.
   - `src/reservations.ts` does NOT export or define `generateReservationLocator` or `LOCATOR_REGEX`.

4. **Absence of Submission-Time Capacity Verification**:
   - In `src/reservations.ts` lines 19–70, `getAvailableSlots(dateStr)` fetches slot availability on date input change.
   - However, in `src/main.ts` (lines 772–845) and `src/experiencia.ts` (lines 156–224), when `submit` fires, there is **zero re-verification of slot capacity** before `addDoc`. If 4 bookings already exist, a 5th overbooking is written without error.

5. **Absence of Imperial Table Validation (> 6 Pax)**:
   - Neither `src/main.ts` nor `src/experiencia.ts` imports or invokes `validateGuestCount`.
   - Groups with 7–20 people do not trigger the Maître imperial table notice in the UI or in the WhatsApp template.
   - Invalids (< 1 or > 20) are not validated client-side in TypeScript.

6. **Missing RFC 9457 Toast Infrastructure in Customer Pages**:
   - `admin.html` contains `<div id="toast-container"></div>` and `.toast` styles.
   - `index.html` and `experiencia.html` contain **no `#toast-container`**.
   - `src/style.css` contains **zero rules for `.toast` or `.toast.error.rfc-9457`**.
   - Customer error handling falls back to raw text injection in `#form-message` or unhandled promise rejections.

7. **Static Integrity (Zero `alert(` Calls)**:
   - `tests/tier5-m4-challenger.test.mjs` lines 366–371 tests `M4.7.6`:
     ```typescript
     test('M4.7.6: src/reservations.ts contains exactly 0 active alert( function calls', () => {
       const resCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'reservations.ts'), 'utf8');
       const cleanCode = resCode.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
       const alertCalls = [...cleanCode.matchAll(/\balert\s*\(/g)];
       assert.equal(alertCalls.length, 0, `Found ${alertCalls.length} alert() calls in src/reservations.ts`);
     });
     ```
     Currently `src/reservations.ts` has 0 active `alert(` calls.

---

## 2. Logic Chain

1. **Premise 1 (Contract Authority)**: `PROJECT.md` Features 22–26, `specs/SDD_MASTER.md` [DT-11], [DT-12], [DT-13], and `specs/openapi.yaml` define the immutable requirements for Milestone 5:
   - Flujo 2 pasos con apertura voluntaria de WhatsApp (0 `window.open` asíncronos).
   - Generador de localizador conforme a `^SP-[A-Z0-9]{4}$`.
   - Límite de 4 mesas por franja de 30m; saturación rechazada con Problem Details status 409.
   - Advertencia de mesa imperial para grupos > 6 comensales (máximo 20).
   - Erradicación total de `alert()` en favor de toasts flotantes RFC 9457.
2. **Premise 2 (Empirical Gap)**: Observations 2, 3, 4, 5, and 6 confirm that while domain contracts exist in `tests/contracts/reservations.mjs` and pass unit tests, **the production application controllers (`src/reservations.ts`, `src/main.ts`, `src/experiencia.ts`) and HTML entrypoints (`index.html`, `experiencia.html`) still operate under legacy, non-compliant implementations**.
3. **Premise 3 (Mobile Failure Point)**: Observation 2 proves that `window.open` is called after an asynchronous `await addDoc()`. In Safari (iOS) and Chrome (Android), user activation tokens expire across microtasks/macrotasks, guaranteeing that the WhatsApp window will be blocked by default browser popup blockers unless replaced with a voluntary click flow.
4. **Premise 4 (Safety & Invariant Shielding)**:
   - Adding `<img ...>` without `id="preview-..."` would break `T1.4.3`.
   - Introducing any `alert(` would fail `M4.7.6` and `M4.7.5`.
   - Rejection of saturated slots must emit RFC 9457 toast with HTTP status **409 Conflict** (or 422 if validation).
5. **Conclusion**:
   Milestone 5 implementation must execute a coordinated, 4-step deployment:
   - Step 1: Enrich `src/reservations.ts` with pure exports (`generateReservationLocator`, `validateGuestCount`, `checkSlotAvailability`, `buildWhatsAppReservationUrl`, and RFC 9457 toast functions).
   - Step 2: Inject `#toast-container` into `index.html` & `experiencia.html`, and add Quiet Luxury toast & confirmation card CSS to `src/style.css`.
   - Step 3: Refactor form submit handlers in `src/main.ts` and `src/experiencia.ts` to enforce capacity re-validation, status 409 rejection, locator generation, and 2-step confirmation card rendering with zero `window.open`.
   - Step 4: Validate against the 20-point verification matrix and establish the new Tier 5 Challenger suite (`tests/tier5-m5-challenger.test.mjs`).

---

## 3. Caveats

- **Network Mode**: The investigation was conducted in code-only local mode without external network requests to live Firestore or Cloudinary endpoints. All database interactions were inspected via TypeScript source code and simulated test harnesses.
- **Shared Code between Customer Pages**: Both `src/main.ts` and `src/experiencia.ts` handle reservation submissions independently. If the worker updates only `src/main.ts`, `experiencia.html` will remain vulnerable to DT-11 popup blocking. Both files must be refactored or delegated to a common function in `src/reservations.ts`.
- **Status Code 409 vs 422**: The dispatch specifically mandates status **409** for slot saturation rejection (RFC 9457 Problem Details toast with status 409). In `specs/openapi.yaml`, 422 is used as a generic validation schema response. Both 409 and 422 must be accepted by the toast renderer, with 409 explicitly enforced for slot capacity saturation.

---

## 4. Conclusion

The verification matrix and safety requirements for Milestone 5 are fully formulated and documented in:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m5_explorer_3\plan.md`

Key verified invariants for M5 execution:
1. **Locator Conformance**: `^SP-[A-Z0-9]{4}$` via 32-character unambiguous alphabet (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`).
2. **Capacity Limit & Rejection**: Max 4 active bookings per 30m slot in `KITCHEN_HOURS`. Slot full -> RFC 9457 Problem Details toast with status **409 Conflict**.
3. **Imperial Table**: Guests > 6 (up to 20) triggers `.imperial-notice` advisory banner in confirmation card and Maître confirmation note in WhatsApp URL.
4. **Zero `alert(`**: Strictly 0 active calls in `src/reservations.ts`, `src/main.ts`, `src/experiencia.ts`.
5. **Zero Asynchronous `window.open`**: Complete eradication of `window.open` in booking flow; replaced by 2-step confirmation card `#reservation-confirmation-card` with voluntary link `#btn-whatsapp-confirm`.
6. **Pipeline Baseline**: Strict preservation of `npm run pipeline` Exit Code 0 and all 259/259 baseline tests passing.

---

## 5. Verification Method

To independently verify all findings and test requirements:

1. **Run Full Test Baseline**:
   ```bash
   npm test
   ```
   *Expected Result*: 259 tests passing across 68 test suites in ~11s.

2. **Run Pipeline Check**:
   ```bash
   npm run pipeline
   ```
   *Expected Result*: `tsc --noEmit && vite build` finishes with Exit Code 0 in ~2s.

3. **Verify Existing Reservation Tests**:
   ```bash
   node --test tests/tier2-domain-invariants.test.mjs
   node --test tests/tier3-dom-transitions.test.mjs
   node --test tests/tier4-customer-journeys.test.mjs
   ```
   *Expected Result*: Features 2.2, 3.4, 3.5, and Scenario 4.2 all PASS.

4. **Verify Active `window.open` and `alert(` in Source Code**:
   ```powershell
   Select-String -Path src\main.ts, src\experiencia.ts -Pattern "window\.open"
   Select-String -Path src\reservations.ts, src\main.ts, src\admin.ts -Pattern "\balert\s*\("
   ```
   *Observation*: Confirms `window.open` is present at `src/main.ts:810` and `src/experiencia.ts:192` (the defect to be fixed in M5), while `alert(` is 0 in all files.
