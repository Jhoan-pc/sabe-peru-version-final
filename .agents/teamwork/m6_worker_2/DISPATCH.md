## 2026-10-14T12:46:25Z
You are m6_worker_2 (Milestone 6 Final Remediation & Chunk Fix Worker).
Your working directory is: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m6_worker_2
Original User Request (MANDATORY: read this first): c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\ORIGINAL_REQUEST.md
Master Project Plan: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\orchestrator_1\PROJECT.md
Dead Ends Log: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\orchestrator_1\DEAD_ENDS.md
Parent conversation ID: ed44eb6a-a075-4b06-a258-caefe2915195

Relevant domain skills:
c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\web-performance\SKILL.md
c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\luxury-web-design\SKILL.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

READ THE EXPLORER BLUEPRINTS FIRST:
- c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m6_explorer_1\plan.md (Vite / Rollup Asset Chunk Naming Specification)
- c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m6_explorer_2\plan.md (Experiencia DOM, CSS & Quiet Luxury Harmonization)
- c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m6_explorer_3\plan.md (Regression & Test Safety Matrix)

EXCLUSIVE WRITE OWNERSHIP:
You have exclusive write ownership of:
- vite.config.ts
- experiencia.html
- src/experiencia.css

TASK:
Implement the remediation specified across the 3 Explorer blueprints:

1. In `vite.config.ts`:
   Configure `output.assetFileNames` in `build.rollupOptions` so Rollup deterministically names the shared CSS chunk as `style-[hash].css`:
   ```typescript
   output: {
       assetFileNames: (assetInfo) => {
           const name = assetInfo.name || '';
           if (name.endsWith('.css')) {
               if (name.includes('experiencia')) {
                   return 'assets/experiencia-[hash][extname]';
               }
               return 'assets/style-[hash][extname]';
           }
           return 'assets/[name]-[hash][extname]';
       }
   }
   ```

2. In `experiencia.html`:
   - Line 12: Uncomment `<link rel="stylesheet" href="/src/style.css">` right before `<link rel="stylesheet" href="/src/experiencia.css">`. Ensure there are NO HTML comment tags (`<!-- ... -->`) around it.
   - Adjust inline `border-radius: 12px;` on carousel slides (lines 102, 110, 118, 126) and `.booking-card` (line 146) to `2px` per Quiet Luxury tokens.
   - Update form inputs to remove heavy brassy borders, allowing the subtle bottom hairline from `src/style.css` to render.
   - Update `#imperial-table-notice` (line 186) to include `<strong>Mesa Imperial:</strong>`.

3. In `src/experiencia.css`:
   - In `:root` (lines 1-9), alias variables to canonical `--lux-*` Quiet Luxury tokens:
     ```css
     :root {
         --bg-color: var(--lux-bg-obsidian);
         --gold: var(--lux-gold-champagne);
         --gold-hover: var(--lux-gold-burnished);
         --text-primary: var(--lux-text-primary);
         --text-secondary: var(--lux-text-secondary);
         --font-title: var(--font-serif);
         --font-body: var(--font-sans);
     }
     ```
   - In `.carousel-slide img`: set `border-radius: 2px;` and `border: 1px solid var(--lux-border-gold-subtle);`.
   - In `.btn-primary.glow-btn`: refine box-shadow to champagne ambiance `rgba(197, 168, 128, 0.25)`.

4. Verification Sequence:
   - Run `npm run pipeline` (`tsc --noEmit && vite build`) -> verify Exit Code 0, duration < 20s, 0 TS compilation errors.
   - Verify `dist/assets/style-*.css` exists and is < 35 kB raw / < 10 kB gzip.
   - Verify `dist/assets/experiencia-*.css` exists.
   - Verify `dist/assets/firebase-*.js` exists.
   - Verify both `style-*.css` and `experiencia-*.css` are injected in `dist/experiencia.html`.
   - Run `node --test tests/tier5-m6-pipeline-stress.test.mjs` -> verify 15/15 PASS!
   - Run `node --test tests/tier5-m6-e2e-final.test.mjs` -> verify 24/24 PASS!
   - Run `npm run test:all` -> verify 87/87 PASS!
   - Run `npm test` -> verify 360/360 PASS across 91 suites with 0 failures!

DELIVERABLES:
Write your complete handoff report to:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m6_worker_2\handoff.md`
Notify parent (Recipient: ed44eb6a-a075-4b06-a258-caefe2915195).
