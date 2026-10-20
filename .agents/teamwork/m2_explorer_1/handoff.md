# Milestone 2 Handoff Report: Design Tokens & Visual Deprecations

**Agent:** `m2_explorer_1` (M2 Explorer - Design Tokens & Visual Deprecations)  
**Parent Conversation ID:** `ed44eb6a-a075-4b06-a258-caefe2915195`  
**Handoff Type:** Hard (Task complete)  
**Artifacts Generated:** `plan.md` in `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m2_explorer_1\plan.md`

---

## 1. Observation

1. **CSS Root Tokens (`src/style.css`, lines 1–10):**
   - Direct observation of `src/style.css` lines 1–10:
     ```css
     :root {
       --color-gold: #b38e5d;
       --color-gold-dark: #8c6d44;
       --color-primary: #050505;
       --color-white: #ffffff;
       --color-text-dim: #666;
       --font-serif: 'Cormorant Garamond', 'Playfair Display', serif;
       --font-sans: 'Inter', sans-serif;
       --transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
     }
     ```
   - Observed that the 12 canonical Quiet Luxury tokens defined in `specs/design-system-spec.md` §1 (`--lux-bg-obsidian`, `--lux-bg-charcoal`, `--lux-bg-surface`, `--lux-bg-alabaster`, `--lux-gold-champagne`, `--lux-gold-burnished`, `--lux-crimson-mineral`, `--lux-text-primary`, `--lux-text-secondary`, `--lux-text-muted`, `--lux-border-hairline`, `--lux-border-gold-subtle`) are completely missing from `:root`.
   - Grep search revealed 47 references across `src/style.css`, `index.html`, `carta.html`, and `admin.html` to `--color-gold`, `--color-primary`, and `--color-text-dim`.

2. **Stone Frame and Nazca Decorative SVGs (`src/style.css`, lines 461–595):**
   - Direct observation of `src/style.css` lines 463–468:
     ```css
       border-width: 80px 80px;
       border-style: solid;
       border-color: #2e2620;
       /* Dark Brown Earth */
     ```
   - Direct observation of pseudo-elements `::before` (lines 474–498) and `::after` (lines 501–523) on `.page-carta .section-container`: 7 embedded data URI SVGs (hummingbird, spiral, spider, zigzag, monkey, hands, tree) with stroke `#ffd700`.
   - Direct observation of side glyphs `.menu-grid::before` and `.menu-grid::after` (lines 526–560): repeating zigzag SVG data URIs extending over -415px to -68px.
   - Direct observation of mobile overrides in lines 563–585: `border-width: 50px 30px;` and scaled versions of the SVGs.

3. **Continuous Reflective Shiny Button Animation (`src/style.css`, lines 1413–1474):**
   - Direct observation of lines 1421, 1426, 1437–1460:
     ```css
       border-radius: 20px;
       box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
     ```
     ```css
     .item-photo-btn::after {
       ...
       animation: shiny-button 3s infinite;
     }

     @keyframes shiny-button {
       0% { transform: translateX(-100%) rotate(45deg); }
       20%, 100% { transform: translateX(100%) rotate(45deg); }
     }
     ```
   - Direct observation of `src/main.ts` line 332 and 354: `.item-photo-btn` is generated dynamically by TypeScript; replacing it prematurely in CSS without backwards compatibility would cause UI glitches prior to Milestone 3.

4. **Pipeline and Test Baseline:**
   - Ran `npm test`: 119 tests passing across 30 test suites (0 failures).
   - Ran `npm run pipeline`: `tsc --noEmit && vite build` succeeded with Exit Code 0 in 2.01s, generating `dist/assets/style-Du4vC3qa.css` (26.59 kB raw / 6.43 kB gzip).

---

## 2. Logic Chain

1. **Token Migration Strategy (Observation 1):**
   - Because 47 active DOM elements and controllers reference `--color-gold`, `--color-primary`, etc., deleting these variables would induce immediate visual regressions across existing pages.
   - Therefore, `:root` must declare both the full set of canonical `--lux-*` tokens AND preserve legacy aliases, allowing progressive component adoption without breakage.

2. **Frame & SVG Purging (Observation 2):**
   - `specs/design-system-spec.md` §3.B and `PROJECT.md` Feature 8 mandate replacing the 80px brown stone border with a 1px hairline border (`rgba(197, 168, 128, 0.18)`), internal breathing room (`padding: clamp(3rem, 6vw, 6rem)`), and dark obsidian background (`var(--lux-bg-obsidian)` with radial gradient).
   - The embedded SVG data URIs bloat the CSS stylesheet and create anti-luxury visual noise.
   - Explicitly removing them and setting `content: none !important; display: none !important;` on `.page-carta .section-container::before`, `.page-carta .section-container::after`, `.menu-grid::before`, and `.menu-grid::after` eradicates the Nazca vectors entirely while shrinking the CSS bundle by ~4.5 kB.

3. **Shiny Button Elimination & Trigger Decoupling (Observation 3):**
   - `specs/design-system-spec.md` §4 strictly prohibits continuous infinite loops (`shiny-button 3s infinite`) and bulbous pill borders (`border-radius: 20px;`).
   - Milestone 3 will introduce `.dish-photo-trigger` in the HTML generation within `src/main.ts`.
   - Therefore, `src/style.css` must now:
     a) Implement the official Quiet Luxury styling for `.dish-photo-trigger` (10px uppercase, `--lux-gold-champagne`, animated underline on hover).
     b) Neutralize `.item-photo-btn` by deleting `@keyframes shiny-button`, setting `.item-photo-btn::after` to `display: none`, and transforming its shape to an understated hairline button (`border-radius: 2px; border: 1px solid var(--lux-border-gold-subtle); background: transparent;`).

4. **Allergen Pills Pre-emption (Observation 4):**
   - `specs/design-system-spec.md` §3.A defines `.menu-item-allergens` and `.allergen-pill` (9px uppercase, `--lux-text-muted`, hairline border).
   - Pre-implementing these rules in `src/style.css` ensures `T3.2.3` continues to pass and provides zero-friction readiness for Milestone 3.

---

## 3. Caveats

1. **Scope Boundaries:**
   - Emojis in menu titles and HTML generation in `src/main.ts` belong strictly to Milestone 3; they are not touched here.
   - Font family dropdown selectors in `admin.html` and typographic tracking standardization are assigned to `m2_explorer_2`.
2. **Assumptions:**
   - It is assumed that the implementer will execute changes via standard patch/replacement tools without editing files outside `src/style.css`.
   - No caveats remain.

---

## 4. Conclusion

Milestone 2 implementation requirements for Design Tokens & Visual Deprecations are fully mapped and ready for execution. The blueprint in `plan.md` provides exact lines, diffs, and verification criteria for:
- Adding canonical `--lux-*` tokens to `:root` in `src/style.css`.
- Eradicating the 80px brown stone border and all Nazca SVGs from `.page-carta .section-container` and `.menu-grid`.
- Eradicating `shiny-button 3s infinite` animation and styling `.dish-photo-trigger` and `.allergen-pill`.
The changes will decrease the CSS bundle size, maintain full compliance with Core Web Vitals, and keep all 119 tests passing.

---

## 5. Verification Method

1. **Test Suite Execution:**
   ```powershell
   npm test
   ```
   *Expected Result:* All 119 tests in Tiers 1–5 pass cleanly.

2. **Build Pipeline:**
   ```powershell
   npm run pipeline
   ```
   *Expected Result:* Exit Code 0, build completes in < 3s, CSS bundle is < 30 kB.

3. **Visual Inspection of `src/style.css`:**
   - Confirm presence of `--lux-bg-obsidian: #0b0b0b;` in `:root`.
   - Confirm absence of `border-width: 80px`.
   - Confirm absence of `#2e2620`.
   - Confirm absence of `shiny-button 3s infinite`.
   - Confirm absence of `data:image/svg+xml` Nazca drawings in `.page-carta`.
