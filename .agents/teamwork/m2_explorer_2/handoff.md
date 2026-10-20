# Handoff Report: Milestone 2 — Typography & Build Safety

**Subagent**: `m2_explorer_2` (M2 Explorer - Typography & Safety)  
**Milestone**: Milestone 2 (Fase 2: Sistema de Diseño Quiet Luxury)  
**Type**: Hard Handoff (Investigation & Blueprint Complete)  
**Date**: 2026-10-09  
**Recipient**: `ed44eb6a-a075-4b06-a258-caefe2915195` (Parent Orchestrator)  

---

## 1. Observation

1. **`admin.html` Font Selectors (Lines 367–382)**:
   Direct observation via `view_file`:
   ```html
   <label>Fuente de Títulos (Elegante)
       <select data-key="font_title" style="width:100%; padding:10px; margin: 10px 0;">
           <option value="'Playfair Display', serif">Playfair Display (Por defecto)</option>
           <option value="'Cormorant Garamond', serif">Cormorant Garamond</option>
           <option value="'Cinzel', serif">Cinzel</option>
           <option value="'DM Serif Display', serif">DM Serif Display</option>
       </select>
   </label>
   <label>Fuente de Textos (Legible)
       <select data-key="font_text" style="width:100%; padding:10px; margin: 10px 0;">
           <option value="'Inter', sans-serif">Inter (Por defecto)</option>
           <option value="'Lato', sans-serif">Lato</option>
           <option value="'Montserrat', sans-serif">Montserrat</option>
           <option value="'Open Sans', sans-serif">Open Sans</option>
       </select>
   </label>
   ```
   Observed: Four non-compliant font options (*Cinzel*, *DM Serif Display*, *Lato*, *Open Sans*) exist in the UI that contradict the 2-family requirement of `specs/design-system-spec.md` §2 and [DT-07].

2. **Heading Base Rules Absence in `src/style.css`**:
   Direct observation via `grep_search`: No base selector rule exists for `h1, h2, h3, h4, h5, h6`. Headings without specific classes fall back to `body { font-family: var(--font-sans); }`.

3. **Inconsistent Letter-Spacing & Tracking**:
   Direct observation via `grep_search` across `src/style.css`:
   - Line 229 (`.nav-links a`): `letter-spacing: 0.25em;`
   - Line 307 (`.label-white`): `letter-spacing: 0.6em;`
   - Line 621 (`.menu-subcategory-title`): `letter-spacing: 0.3em;`
   - Line 684 (`.menu-item-price`): No `letter-spacing` defined.
   - Line 948 (`.btn-gold-fill`): `letter-spacing: 0.3em;`
   - Line 993 (`.footer-hours h4`): `letter-spacing: 0.3em;`
   - Line 1010 (`.footer-bottom`): `letter-spacing: 0.3em;`
   - `src/experiencia.css` Line 263 (`.btn-primary`): `letter-spacing: 1px;` (~0.06em, failing the 0.15em–0.22em specification).

4. **Dynamic Font Setter Vulnerability in `src/main.ts` (Lines 88–92)**:
   ```typescript
   if (item.key === 'font_title') {
      document.documentElement.style.setProperty('--font-serif', item.content);
   } else if (item.key === 'font_text') {
      document.documentElement.style.setProperty('--font-sans', item.content);
   }
   ```
   Observed: `item.content` is applied directly without whitelisting against the 2 approved families.

5. **Test Suite & Pipeline Status**:
   Execution of `npm test`: 119 tests passing across 30 suites (Exit code 0).
   Execution of `npm run pipeline`: `tsc --noEmit && vite build` built in 1.90s (Exit code 0).

---

## 2. Logic Chain

1. **Premise**: `specs/design-system-spec.md` §2 and `specs/SDD_MASTER.md` [DT-07] require strict restriction to exactly two font families:
   - Editorial Serif (*Cormorant Garamond* / *Playfair Display*) for headings `h1, h2, h3`.
   - Geometric Sans-Serif (*Inter* / *Montserrat*) with wide tracking (`letter-spacing: 0.15em` to `0.22em`) for navigation, buttons, prices, and micro-copy.
2. **From Observation 1**: `admin.html` offers *Cinzel*, *DM Serif Display*, *Lato*, and *Open Sans*. An administrator selecting these injects invalid fonts into Firestore `site_content`. Removing these 4 options and leaving only *Cormorant Garamond*, *Playfair Display*, *Inter*, and *Montserrat* restricts CMS input directly at the administrative boundary.
3. **From Observation 4**: To guarantee defense-in-depth against legacy database values, `src/main.ts` must validate `item.content` against the allowed serif and sans-serif whitelist before setting `--font-serif` and `--font-sans`.
4. **From Observation 2**: Adding base rules for `h1, h2, h3, h4, h5, h6` in `src/style.css` using `font-family: var(--font-serif)` guarantees all headings adopt the Editorial Serif consistently.
5. **From Observation 3**: Adjusting `.nav-links a`, `.btn-*`, `.menu-item-price`, `.label-*`, and `.footer-*` to the canonical tracking range `0.15em`–`0.22em` brings all interactive and micro-copy typography into strict compliance with 3-Michelin-star Haute Cuisine standards.
6. **From Observation 5**: None of the 119 tests in Tiers 1–5 assert the presence of *Cinzel* or *Lato*, and none depend on outdated font values. The HTML size of `admin.html` decreases, which strengthens compliance with Tier 5 test C5.5 (HTML size < 35 kB).

---

## 3. Caveats

1. **Google Fonts `<head>` Links**: In Milestone 1, the `<link>` tag in all 4 HTML files was standardized to load `Cormorant Garamond` (weights 400, 600) and `Inter` (weights 300, 400, 600). These are the primary canonical representatives. *Playfair Display* and *Montserrat* serve as valid architectural alternatives in CSS fallback stacks and CMS selections.
2. **Division of Scope with `m2_explorer_1`**: Color tokens (`--lux-*`), border derogations (80px brown stone border, Nazca SVGs), and shiny button removal are addressed in `m2_explorer_1`. This blueprint specifically governs typography tokens, heading base rules, tracking standardization, `admin.html` font selectors, and build safety.
3. **No Breaking DOM Changes**: Class names (`serif-title`, `nav-links`, `menu-item-price`) and data attributes (`data-key="font_title"`, `data-key="font_text"`) are preserved exactly, preventing any regression in DOM queries or event handlers.

---

## 4. Conclusion

The blueprint in `plan.md` provides complete, deterministic, and safe diffs to achieve 100% compliance with [DT-07], `specs/design-system-spec.md` §2, and build safety constraints:
1. `admin.html` (lines 367–382) is pruned of all 4 unauthorized font options.
2. `src/style.css` is enhanced with base heading typography (`var(--font-serif)`) and normalized wide tracking (`0.15em` to `0.22em`) for navigation, buttons, prices, and micro-copy.
3. `src/main.ts` is hardened with defensive whitelist checks for font variables.
4. `src/experiencia.css` and `experiencia.html` are aligned with the official font variables and navigation tracking.
5. `npm run pipeline` and `npm test` remain completely green with 0 errors.

---

## 5. Verification Method

To independently verify the implementation:

1. **Typechecking and Build**:
   ```powershell
   npm run pipeline
   ```
   *Expected*: `tsc --noEmit` exits with 0 errors, `vite build` succeeds in < 2.5s with 0 errors.

2. **Automated Test Suite (119 Tests)**:
   ```powershell
   npm test
   ```
   *Expected*: 119 tests pass, 0 fail, exit code 0.

3. **Admin Selectors Verification**:
   Inspect `admin.html` lines 365–385:
   Confirm `select[data-key="font_title"]` has only 2 options (*Cormorant Garamond*, *Playfair Display*).
   Confirm `select[data-key="font_text"]` has only 2 options (*Inter*, *Montserrat*).
   Confirm zero occurrences of "Cinzel", "DM Serif Display", "Lato", or "Open Sans".

4. **Typography CSS Token & Tracking Inspection**:
   Inspect `src/style.css`:
   Confirm `h1, h2, h3` have `font-family: var(--font-serif);`.
   Confirm `.menu-item-price` has `letter-spacing: 0.15em;`.
   Confirm `.nav-links a`, `.btn-*`, and `.label-*` have `letter-spacing` between `0.15em` and `0.22em`.
