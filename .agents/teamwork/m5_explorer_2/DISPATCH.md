## 2026-10-14T08:55:29Z
You are m5_explorer_2 (M5 Explorer - Codebase & DOM Flow).
Your working directory is: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m5_explorer_2
Original User Request (MANDATORY: read this first): c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\ORIGINAL_REQUEST.md
Master Project Plan: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\PROJECT.md
Parent conversation ID: ed44eb6a-a075-4b06-a258-caefe2915195

Relevant domain skill:
c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\especialista-admin-backoffice\SKILL.md
c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\luxury-web-design\SKILL.md

TASK:
Investigate and map the current reservation implementation across `src/reservations.ts`, `index.html`, `experiencia.html`, and `src/style.css`:
1. Map `#reservation-form` in `index.html` and `experiencia.html` (inputs: date, time, pax, name, phone, notes/email).
2. Inspect `src/reservations.ts`:
   - Identify any `window.open` calls and native `alert()` calls.
   - Examine how capacity checking and Firestore insertion currently function.
   - Design the exact DOM architecture for the confirmation card `#reservation-confirmation-card` (or modal/container) to replace direct popups, displaying locator `SP-XXXX`, booking summary, and voluntary WhatsApp button.
   - Design dynamic UI reaction for groups > 6 (e.g. displaying imperial table advisory banner `#imperial-table-notice` when pax > 6).
   - Formulate eradication of all `: any` types in `src/reservations.ts`, creating clean interfaces (`ReservationInput`, `ReservationDoc`, `SlotCapacityResult`).
   - Map CSS rules needed in `src/style.css` using `--lux-*` Quiet Luxury tokens.

DELIVERABLES:
Write your implementation blueprint and diff proposals to:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m5_explorer_2\plan.md`
And write your handoff report to:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m5_explorer_2\handoff.md`
Notify parent (Recipient: ed44eb6a-a075-4b06-a258-caefe2915195).
