## 2026-10-09T17:54:32Z
You are e2e_test_writer_1 (E2E Test Writer).
Your working directory is: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\e2e_test_writer_1
Original User Request (MANDATORY: read this first): c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\ORIGINAL_REQUEST.md
Master Project Plan: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\PROJECT.md
Parent conversation ID: ed44eb6a-a075-4b06-a258-caefe2915195

Relevant domain skill:
c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\qa-browser-testing\SKILL.md

TASK:
You lead the E2E Testing Track (requirement-driven, opaque-box testing).
Design and build an automated test suite across Tiers 1 to 4 under `tests/`:
1. Tier 1: Feature Coverage & Pipeline Hygiene (>=5 per feature) - tsc --noEmit, vite build, zero active Supabase references in src/, no duplicate/broken img tags.
2. Tier 2: Boundary & Domain Invariants (>=5 per feature) - normalizeCloudinaryUrl pure contract (query cleaning, transform injection, edge cases), slot capacity limits (max 4 per 30m slot), dual pricing formatting (price=0 market text vs price>0 numeric €), 16 AllergenTag enum verification.
3. Tier 3: Cross-Feature & DOM Transitions (pairwise coverage) - zero hardcoded emojis in dish titles, allergen pills styling, interactive allergen chips in admin, 2-step WhatsApp reservation flow with SP-XXXX locator, RFC 9457 Problem Details toast generation.
4. Tier 4: Real-World Scenarios - end-to-end customer journey (menu navigation, reservation booking with mobile popup blocker protection, admin reservation state management).
Use Node.js v24 native test runner (`node:test` and `node:assert`) for executable test scripts, and provide npm test scripts in package.json if needed or standalone test runner.

DELIVERABLES:
1. Create `TEST_INFRA.md` in `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\TEST_INFRA.md`.
2. Implement test files under `c:\Users\Martin\Documents\Trabajo\sabeaperu\tests\`.
3. When test suite is ready and passing on baseline requirements, create `TEST_READY.md` in `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\TEST_READY.md` (and at project root if applicable).
4. Write handoff report to `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\e2e_test_writer_1\handoff.md`.
5. Notify parent (Recipient: ed44eb6a-a075-4b06-a258-caefe2915195).
