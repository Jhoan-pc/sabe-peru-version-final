## 2026-10-14T08:55:29Z
You are m5_explorer_1 (M5 Spec Miner - Reservation Contracts).
Your working directory is: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m5_explorer_1
Original User Request (MANDATORY: read this first): c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\ORIGINAL_REQUEST.md
Master Project Plan: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\PROJECT.md
Parent conversation ID: ed44eb6a-a075-4b06-a258-caefe2915195

Relevant domain skill:
c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\arquitecto-sdd\SKILL.md

TASK:
Mine and formalize the exact specifications and contracts for Milestone 5 (Fase 5: Conserjería de Reservas y Anti-Bloqueo de WhatsApp):
1. Extract formal reservation contracts from `specs/openapi.yaml`, `specs/SDD_MASTER.md` ([DT-11], [DT-12], [DT-13]), and `tests/contracts/reservations.mjs`.
2. Define the exact locator generation contract: format `^SP-[A-Z0-9]{4}$`, uppercase alphanumeric 4 chars, uniqueness.
3. Define capacity calculation rules:
   - 4 active bookings (`status !== 'cancelled'`) per 30-minute slot during `KITCHEN_HOURS`.
   - `number_of_people`: integer between 1 and 20.
   - Group policy: 1..6 standard; > 6 requires imperial table advisory ("Grupos de más de 6 personas...").
4. Define the 2-step concierge flow contract:
   - Step 1: Form submission -> client-side validation -> Firestore document insertion with `status: 'pending'`, `locator: 'SP-XXXX'`, `created_at: serverTimestamp()`.
   - Step 2: Confirmation card rendering with locator, booking summary, and voluntary user-clicked WhatsApp action button targeting `https://wa.me/34662125650?text=...`.
5. Define RFC 9457 Problem Details toast error contracts for all error cases (slot full 409, invalid kitchen hour 422, past date 422, out-of-range pax 422).

DELIVERABLES:
Write your implementation blueprint to:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m5_explorer_1\plan.md`
And write your handoff report to:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m5_explorer_1\handoff.md`
Notify parent (Recipient: ed44eb6a-a075-4b06-a258-caefe2915195).
