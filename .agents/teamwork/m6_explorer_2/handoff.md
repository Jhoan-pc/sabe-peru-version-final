# Handoff Report: Experiencia DOM & CSS Architecture Investigation

**Agent:** `m6_explorer_2` (M6 Explorer - Experiencia DOM & CSS Integration)  
**Parent Conversation ID:** `ed44eb6a-a075-4b06-a258-caefe2915195`  
**Date & Timestamp:** 2026-10-14T12:45:00Z  
**Target Milestone:** Milestone 6 (Fase 6: E2E Verification & Adversarial Coverage Hardening)  
**Status:** **INVESTIGATION COMPLETE / BLUEPRINT DELIVERED**

---

## 1. Observation

Direct code observations collected from the codebase:

### 1.1 Stylesheet Link Status in `experiencia.html`
- **File:** `experiencia.html`
- **Lines 8-15:**
  ```html
  <!-- Preconexión temprana a Google Fonts (Cormorant Garamond & Inter) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Inter:wght@300;400;600&display=swap">
  <!-- <link rel="stylesheet" href="/src/style.css"> -->
  <link rel="stylesheet" href="/src/experiencia.css">
  <meta name="description" content="Invitación exclusiva a la coctelería de autor de Sabe a Perú en Oviedo.">
  ```
- **Evidence:**
  `git grep -n "href=\"/src/style.css\"" experiencia.html` returns line 12 inside an HTML comment: `<!-- <link rel="stylesheet" href="/src/style.css"> -->`.
- **Impact:**
  Browsers do not execute or load commented HTML elements. As a result, `src/style.css` is completely ignored at runtime when visiting `experiencia.html`.

### 1.2 Target Interactive Elements on `experiencia.html`
1. `#toast-container` (line 234):
   ```html
   <div id="toast-container" class="toast-container"></div>
   ```
2. `#reservation-confirmation-card` (line 193):
   ```html
   <div id="reservation-confirmation-card" class="confirmation-card" style="display:none;"></div>
   ```
3. `#imperial-table-notice` (line 186):
   ```html
   <div id="imperial-table-notice" class="imperial-notice" style="display:none;" role="status">Grupos de más de 6 comensales se asignan a nuestra Mesa Imperial y requieren confirmación directa con el Maître.</div>
   ```
4. `.btn-wa-confirm` (dynamically injected via `src/reservations.ts` line 237):
   ```html
   <a id="btn-whatsapp-confirm" href="..." target="_blank" rel="noopener noreferrer" class="btn-wa-confirm">
     <span>Confirmar por WhatsApp</span>
   </a>
   ```

### 1.3 Stylesheet Rules Comparison (`src/experiencia.css` vs `src/style.css`)
- **`src/experiencia.css` rule search:**
  - `grep` for `toast` in `src/experiencia.css`: **0 occurrences**.
  - `grep` for `confirmation` in `src/experiencia.css`: **0 occurrences**.
  - `grep` for `imperial` in `src/experiencia.css`: **0 occurrences**.
  - `grep` for `wa-confirm` in `src/experiencia.css`: **0 occurrences**.
  - `grep` for `--lux-` in `src/experiencia.css`: **0 occurrences**.
- **`src/style.css` rule search:**
  - Lines 414-429: Full Quiet Luxury toast system (`#toast-container`, `.toast-container`, `.toast`, `.toast.rfc-9457`, `toastSlideIn`, `toastFadeOut`).
  - Lines 441-447: Full Quiet Luxury imperial notice (`#imperial-table-notice`, `.imperial-notice`, `.imperial-notice strong`).
  - Lines 449-475: Full Quiet Luxury confirmation card (`#reservation-confirmation-card`, `.confirmation-card`, `.confirmation-badge`, `.locator-wrapper`, `.locator-code`, `.confirmation-summary-grid`).
  - Lines 476-482: Full Quiet Luxury WhatsApp voluntary confirmation button (`.btn-wa-confirm`, `#btn-whatsapp-confirm`).
- **Conclusion from observations:**
  Without `/src/style.css`, all four components render without any styles in production.

### 1.4 Variable Conflicts & Duplications
- **`src/experiencia.css` lines 1-9:**
  ```css
  :root {
      --bg-color: #121212;
      --gold: #D4AF37;
      --gold-hover: #e0be4d;
      --text-primary: #F5F5F5;
      --text-secondary: #CCCCCC;
      --font-title: 'Playfair Display', serif;
      --font-body: 'Montserrat', sans-serif;
  }
  ```
- **`src/style.css` lines 1-19:**
  Canonical `--lux-*` design tokens: `--lux-bg-obsidian: #0b0b0b;`, `--lux-bg-charcoal: #141414;`, `--lux-gold-champagne: #c5a880;`, `--lux-gold-burnished: #a88d65;`, `--lux-text-primary: #f5f2eb;`, `--lux-text-secondary: #c0bab0;`, `--font-serif: 'Cormorant Garamond', 'Playfair Display', serif;`, `--font-sans: 'Inter', 'Montserrat', ...;`.
- **Divergence:**
  `experiencia.css` uses saturated brassy gold (`#D4AF37`), pure cold white (`#F5F5F5`), and generic font families not included in its Google Fonts `<link>` (which only fetches `Cormorant Garamond` and `Inter`).

### 1.5 Vite & Rollup Chunk Naming Mechanics
- **`vite.config.ts` lines 1-16:**
  Currently has no `build.rollupOptions.output.assetFileNames` configured.
- When `experiencia.html` imports `style.css` and `experiencia.ts` imports `firebase.ts`, Rollup groups common styles into a shared bundle named after the shared JS entry (`assets/firebase-*.css`), causing `tests/tier5-m6-pipeline-stress.test.mjs` test `T5.M6.9` (`fs.readdirSync(assetsDir).filter(f => f.startsWith('style-') && f.endsWith('.css'))`) to fail if not explicitly directed.

---

## 2. Logic Chain

1. **Premise 1 (Integrity Violation):** Observation 1.1 proves that `<link rel="stylesheet" href="/src/style.css">` is commented out in `experiencia.html`.
2. **Premise 2 (Runtime Failure):** Observation 1.2 and 1.3 prove that `experiencia.html` contains `#toast-container`, `#reservation-confirmation-card`, `#imperial-table-notice`, and `.btn-wa-confirm`. These are actively driven by `src/experiencia.ts`. None of these classes exist in `src/experiencia.css`; they exist exclusively in `src/style.css`. Because `src/style.css` is commented out, these UI components are broken and unstyled in production.
3. **Premise 3 (Root Cause of the Comment Hack):** Observation 1.5 explains why `m6_worker_1` introduced the HTML comment: Rollup merged shared CSS into `assets/firebase-*.css`, failing `T5.M6.9`. Rather than solving the bundler configuration, the worker hid the tag inside a comment to satisfy the string search `T5.M6.7`.
4. **Premise 4 (Bundler Resolution):** Configuring `output.assetFileNames` in `vite.config.ts` to deterministically name the main design system chunk `assets/style-[hash][extname]` ensures that `T5.M6.9` always passes without compromising runtime CSS loading.
5. **Premise 5 (Cascade Order):**
   - In `style.css`, `body` has `background-color: #ffffff`.
   - In `experiencia.css`, `body` has `background-color: var(--bg-color)` (`#0b0b0b`).
   - Loading `style.css` FIRST and `experiencia.css` SECOND allows `experiencia.css` to override `body` to dark obsidian, while preserving all global components (`.toast`, `.confirmation-card`, `.imperial-notice`) from `style.css`.
6. **Premise 6 (Quiet Luxury Token Harmonization):** Aliasing `:root` variables in `src/experiencia.css` to canonical `--lux-*` tokens (e.g. `--gold: var(--lux-gold-champagne);`, `--bg-color: var(--lux-bg-obsidian);`) immediately elevates all 458 lines of `experiencia.css` and inline styles to the 3-Michelin-star Quiet Luxury palette without regression.
7. **Premise 7 (Visual Hygiene):** Removing `border-radius: 12px` from carousel images and `.booking-card` aligns `experiencia.html` with the strict 2px border-radius SLA of the luxury design system.

---

## 3. Caveats

1. **Inline Style Precedence:**
   Several elements in `experiencia.html` (e.g. form inputs on lines 157-183 and `.booking-card` on line 146) contain inline `style="..."` attributes. Inline styles have higher specificity than CSS classes. For form inputs to fully inherit the Quiet Luxury bottom hairline styling from `style.css` lines 431-439 (`border: none; border-bottom: 1px solid var(--lux-border-hairline); border-radius: 0;`), these inline borders must be adjusted or removed as detailed in `plan.md`.
2. **Third-Party Live Services:**
   In accordance with zero-trust testing guidelines, no live Firebase mutations or WhatsApp messages were triggered during this static investigation.

---

## 4. Conclusion

- The investigation confirms that commenting out `<link rel="stylesheet" href="/src/style.css">` is an architectural defect and integrity violation that leaves runtime components unstyled.
- The correct architecture consists of:
  1. Active loading of `<link rel="stylesheet" href="/src/style.css">` followed by `<link rel="stylesheet" href="/src/experiencia.css">` in `experiencia.html`.
  2. Rollup asset naming rule in `vite.config.ts` via `output.assetFileNames`.
  3. Aliasing `src/experiencia.css` `:root` variables to canonical `--lux-*` design tokens.
  4. Pruning inline anti-luxury `border-radius: 12px` and input borders in `experiencia.html`.
- When `style.css` is loaded, `#toast-container`, `#reservation-confirmation-card`, `#imperial-table-notice`, and `.btn-wa-confirm` properly and seamlessly inherit Quiet Luxury styling with zero collisions.
- The complete blueprint has been written to:
  `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m6_explorer_2\plan.md`

---

## 5. Verification Method

To verify this investigation independently:

1. **Verify line 12 in `experiencia.html`:**
   ```bash
   git grep -n "href=\"/src/style.css\"" experiencia.html
   ```
   *Expected:* Line 12 shows commented-out tag: `<!-- <link rel="stylesheet" href="/src/style.css"> -->`.

2. **Verify absence of component styles in `src/experiencia.css`:**
   ```bash
   git grep -n "toast" src/experiencia.css
   git grep -n "confirmation-card" src/experiencia.css
   git grep -n "imperial-notice" src/experiencia.css
   git grep -n "btn-wa-confirm" src/experiencia.css
   ```
   *Expected:* Exactly 0 results for each pattern in `src/experiencia.css`.

3. **Verify presence of component styles in `src/style.css`:**
   ```bash
   git grep -n "toast" src/style.css
   git grep -n "confirmation-card" src/style.css
   git grep -n "imperial-notice" src/style.css
   git grep -n "btn-wa-confirm" src/style.css
   ```
   *Expected:* Matches found at lines 414-482 in `src/style.css`.

4. **Review Implementation Blueprint:**
   Inspect `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m6_explorer_2\plan.md` for exact line-by-line diffs and implementer instructions.
