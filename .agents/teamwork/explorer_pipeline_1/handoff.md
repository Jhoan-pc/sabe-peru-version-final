# Handoff Report — Pipeline & Test Infrastructure Survey

**Role**: Pipeline Explorer (`teamwork_preview_explorer_survey_pipeline`)  
**Working Directory**: `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\explorer_pipeline_1`  
**Target Milestone**: Survey Phase / Pipeline & E2E Testing Track Initialization  
**Date**: 2026-10-09  

---

## 1. Observation

1. **`package.json`**:
   - `scripts`: `"dev": "vite"`, `"build": "tsc && vite build"`, `"preview": "vite preview"`, `"pipeline": "tsc --noEmit && vite build"`. No `test`, `test:unit`, or `test:e2e` scripts exist.
   - `dependencies`: `@supabase/supabase-js` (`^2.104.1`), `axios` (`^1.14.0`), `csv-parser` (`^3.2.0`), `firebase` (`^12.12.1`), `lucide-static` (`^0.564.0`), `qrcode` (`^1.5.4`), `sharp` (`^0.34.5`).
   - `devDependencies`: `@types/dom-mediacapture-record` (`^1.0.22`), `@types/node` (`^25.3.0`), `typescript` (`~5.9.3`), `vite` (`^7.3.1`).
   - Cero testing libraries installed (no `@playwright/test`, `vitest`, `jest`, or `puppeteer`).

2. **`tsconfig.json`**:
   - `"target": "ES2022"`, `"module": "ESNext"`, `"moduleResolution": "bundler"`, `"allowImportingTsExtensions": true`, `"noEmit": true`, `"strict": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`, `"erasableSyntaxOnly": true`.
   - `"include": ["src"]`. Test files located outside `src/` (e.g. `tests/`) are excluded from `tsc --noEmit` checks unless explicitly configured.

3. **`vite.config.ts`**:
   - Multi-Page Application (MPA) with 4 inputs: `main` (`index.html`), `carta` (`carta.html`), `admin` (`admin.html`), `experiencia` (`experiencia.html`).
   - `manualChunks` is **not configured**, violating `specs/performance-spec.md` Section 5.

4. **Command Execution Results**:
   - Command `npm run pipeline` executed in `c:\Users\Martin\Documents\Trabajo\sabeaperu`:
     - Exited with code `0`.
     - Output:
       ```
       > sabeaperu@0.0.0 pipeline
       > tsc --noEmit && vite build

       vite v7.3.1 building client environment for production...
       transforming...
       ✓ 34 modules transformed.
       rendering chunks...
       computing gzip size...
       dist/carta.html                         8.35 kB │ gzip:   2.36 kB
       dist/experiencia.html                  16.19 kB │ gzip:   4.10 kB
       dist/index.html                        22.87 kB │ gzip:   5.47 kB
       dist/admin.html                        31.36 kB │ gzip:   5.15 kB
       dist/assets/experiencia-B0fP9rJR.css    6.32 kB │ gzip:   2.01 kB
       dist/assets/style-C5TgX9lU.css         26.70 kB │ gzip:   6.51 kB
       dist/assets/reservations-DD61N7zP.js    2.10 kB │ gzip:   1.04 kB
       dist/assets/experiencia-DbECqGMU.js     4.29 kB │ gzip:   1.98 kB
       dist/assets/admin-ClVik-LY.js          13.30 kB │ gzip:   4.49 kB
       dist/assets/main-Aa1hZj4t.js           15.82 kB │ gzip:   6.21 kB
       dist/assets/firebase-BC8am6bB.js      376.09 kB │ gzip: 116.81 kB
       ✓ built in 903ms
       ```
   - Command `npx tsc --noEmit` executed in `c:\Users\Martin\Documents\Trabajo\sabeaperu`:
     - Exited with code `0` and 0 errors.

5. **Codebase Type Hygiene & Evasion**:
   - Exactly 22 instances of explicit `: any` located in `src/`:
     - `src/admin.ts`: lines 82, 146, 151, 152, 191, 276, 286, 349, 374, 387, 458, 494, 537, 544, 545, 593, 635, 644.
     - `src/main.ts`: lines 219, 222, 233, 234, 266, 385, 410, 411.
     - `src/experiencia.ts`: line 21.
   - `src/supabase.ts` is still present in `src/` and declares `export const supabase = createClient(...)`.

6. **Existing Test Files & Test Runners**:
   - `find_by_name` across `c:\Users\Martin\Documents\Trabajo\sabeaperu` (excluding `node_modules`): exactly **0 test files** (`*.test.ts`, `*.spec.ts`, `tests/` directory).
   - System runtime: Node.js `v24.13.1` (includes built-in `node:test` and `node:assert`).

---

## 2. Logic Chain

1. **Premise 1 (Current Build Status)**: Observation 4 proves that `npm run pipeline` and `npx tsc --noEmit` currently terminate with Exit Code 0, building production assets in `dist/` in under 1 second.
2. **Premise 2 (Zero Test Infrastructure)**: Observations 1, 4, and 6 show that no tests exist, no test scripts are declared, and no test dependencies are installed in `package.json`. Therefore, regressions cannot be caught automatically without establishing a testing harness.
3. **Premise 3 (Hidden Debt and Invalidation Conditions)**: Observation 5 proves that although `tsc` passes, the codebase uses explicit `: any` across 22 places and retains orphan Supabase code (`src/supabase.ts`). Under the Zero-Trust mandate of SDD and the Tirano auditor, `: any` evasions violate contractual integrity.
4. **Premise 4 (Bundle Splitting Gap)**: Observation 3 and the Rollup output in Observation 4 show that `firebase-BC8am6bB.js` weighs 376.09 kB (116.81 kB gzip) and is shared across all pages because `manualChunks` is missing from `vite.config.ts`, directly contradicting `specs/performance-spec.md`.
5. **Deduction**: The pipeline is functional for building, but lacks testing validation and contract type safety. To safeguard the 6 refactoring phases, an E2E Testing Track structured across 4 Tiers (Tier 1: Pipeline & Zero-Supabase, Tier 2: Domain Invariants, Tier 3: DOM Transitions, Tier 4: Headless Browser & Adversarial Hardening) is strictly required.

---

## 3. Caveats

1. **No External Network Dependencies Installed**: No npm packages (such as `@playwright/test`) were installed during this survey to maintain a read-only investigation posture.
2. **Local Environment Port Availability**: When running Vite dev server or preview for Tier 4 browser tests, available ports (5173 or 4173) must be dynamically bound or guaranteed free.
3. **Node.js 24 Native Test Runner Alternative**: Node v24.13.1's native `node:test` runner is available immediately without any external npm packages, making it an excellent zero-dependency harness for Tiers 1-3. For Tier 4 (full browser interaction and screenshot verification), Playwright is the official requirement defined in `specs/SDD_MASTER.md` and `qa-browser-testing` skill.

---

## 4. Conclusion

The build and compilation pipeline is currently green (`npm run pipeline` exit code 0 in ~900ms), but it operates as an unchecked build without any unit, contract, or E2E tests. Furthermore, 22 instances of explicit `: any`, an unconfigured `manualChunks` in `vite.config.ts`, and orphan Supabase files pose latent risks that must be resolved in upcoming milestones.

An E2E Testing Track structured in 4 Tiers has been designed and documented in detail in `pipeline_state.md`:
- **Tier 1**: Pipeline Hygiene (`tsc --noEmit`, `vite build`, 0 Supabase, strict types).
- **Tier 2**: Domain Invariants (`normalizeCloudinaryUrl`, `getAvailableSlots`, dual pricing, 16 `AllergenTag` enums).
- **Tier 3**: DOM State Transitions (no emojis in titles, active allergen chips, 2-step WhatsApp reservation flow, RFC 9457 toasts).
- **Tier 4**: Headless Browser & Adversarial Hardening (Chromium headless, 0 `console.error`, 0 ghost image loads, mobile/desktop viewports, CWV SLA).

---

## 5. Verification Method

To independently verify the pipeline and survey findings:

1. **Verify Current Pipeline Execution**:
   ```powershell
   npm run pipeline
   ```
   *Expected output*: Vite build completes with `✓ built in ~900ms` and Exit Code 0.
2. **Verify Typecheck**:
   ```powershell
   npx tsc --noEmit
   ```
   *Expected output*: Exit Code 0, no output.
3. **Verify Absence of Test Files**:
   ```powershell
   Get-ChildItem -Recurse -File -Include *.test.*,*.spec.* -Exclude node_modules
   ```
   *Expected output*: Empty result (0 files).
4. **Inspect Pipeline State Document**:
   Check `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\explorer_pipeline_1\pipeline_state.md`.
