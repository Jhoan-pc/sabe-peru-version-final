# Handoff Report: TypeScript Carta Logic & Emoji Eradication (Milestone 3)

**Agent:** `m3_explorer_2` (TypeScript Carta Logic & Emoji Eradication Explorer)  
**Parent Conversation ID:** `ed44eb6a-a075-4b06-a258-caefe2915195`  
**Working Directory:** `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m3_explorer_2`  
**Date:** 2026-10-13  
**Handoff Type:** Hard (Investigation & Specification Complete)

---

## 1. Observation

### Obs 1.1: `tagIcons` Dictionary & Hardcoded Emojis in `src/main.ts`
In `src/main.ts` lines 303–320:
```typescript
        const tagIcons: { [key: string]: string } = {
          'pescado': '<span class="menu-tag" tabindex="0" data-tooltip="Pescado">🐟</span>',
          'marisco': '<span class="menu-tag" tabindex="0" data-tooltip="Marisco">🦐</span>',
          'carne': '<span class="menu-tag" tabindex="0" data-tooltip="Carne">🥩</span>',
          'pollo': '<span class="menu-tag" tabindex="0" data-tooltip="Pollo">🍗</span>',
          'picante': '<span class="menu-tag" tabindex="0" data-tooltip="Picante">🌶️</span>',
          'gluten-free': '<span class="menu-tag" tabindex="0" data-tooltip="Sin Gluten">🌾</span>',
          'gluten': '<span class="menu-tag" tabindex="0" data-tooltip="Contiene Gluten">🌾</span>',
          'huevos': '<span class="menu-tag" tabindex="0" data-tooltip="Contiene Huevos">🥚</span>',
          'lacteos': '<span class="menu-tag" tabindex="0" data-tooltip="Contiene Lácteos">🥛</span>',
          'soja': '<span class="menu-tag" tabindex="0" data-tooltip="Contiene Soja">🫘</span>',
          'cacahuetes': '<span class="menu-tag" tabindex="0" data-tooltip="Contiene Cacahuetes">🥜</span>',
          'mostaza': '<span class="menu-tag" tabindex="0" data-tooltip="Contiene Mostaza">🟡</span>',
          'crustaceos': '<span class="menu-tag" tabindex="0" data-tooltip="Contiene Crustáceos">🦐</span>',
          'apio': '<span class="menu-tag" tabindex="0" data-tooltip="Contiene Apio">🥬</span>',
          'moluscos': '<span class="menu-tag" tabindex="0" data-tooltip="Contiene Moluscos">🦪</span>',
          'sesamo': '<span class="menu-tag" tabindex="0" data-tooltip="Contiene Sésamo">🥯</span>'
        };
```
These emojis are concatenated and injected into the dish `<h3>` header at line 337 and line 348:
- Line 337: `const icons = (item.tags || []).map((tag: string) => tagIcons[tag] || '').join('');`
- Line 348: `<h3>${item.name}${icons}${photoBtn}</h3>`

### Obs 1.2: Legacy Photo Button with Camera Emoji in `src/main.ts`
In `src/main.ts` lines 339–343:
```typescript
            const photoBtn = item.image_url ? `
              <button class="item-photo-btn" data-img="${item.image_url}" data-name="${item.name}" data-desc="${item.description || ''}" title="Ver foto del plato">
                <span style="font-size: 1.1em; margin-right: 3px; pointer-events: none;">📸</span> Ver
              </button>
            ` : '';
```
At line 362, the click listener targets only `.item-photo-btn`:
```typescript
        const photoBtns = document.querySelectorAll('.item-photo-btn');
```

### Obs 1.3: Explicit `: any` Type Annotations in Carta Functions in `src/main.ts`
- Line 282: `data = data.filter((d: any) => (d.tags || []).includes(tagFilter));`
- Line 285: `data.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));`
- Line 296: `const groups: { [key: string]: any[] } = {};`
- Line 297: `data.forEach((item: any) => {`
- Line 329: `html += groups[sub].map((item: any) => {`

### Obs 1.4: Dual Pricing Logic in `src/main.ts`
Lines 330–336:
```typescript
            const hasNumericPrice = item.price > 0;
            let priceDisplay = hasNumericPrice ? `${parseFloat(item.price).toFixed(2)}€` : item.description;
            let descriptionDisplay = hasNumericPrice ? (item.description || '') : '';

            // Handle very long dual prices (optional styling class)
            const priceClass = !hasNumericPrice ? 'menu-item-price dual' : 'menu-item-price';
```
If `item.price === 0` and `item.description` is undefined or blank, `priceDisplay` defaults to undefined rather than the fallback `'Precio según mercado'` defined in `specs/SDD_MASTER.md` §3.2 (4) and `tests/contracts/pricing.mjs`.

### Obs 1.5: `carta.html` Synchronization & Emoji Absence
Grep search across all 159 lines of `carta.html` for regex `[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]` yielded **0 matches**. The DOM markup contains `#menu-grid`, `.menu-filters`, and `#menu-photo-modal`, perfectly matching the selectors in `src/main.ts`.

### Obs 1.6: CSS Tokens & Classes in `src/style.css`
- Lines 648–662: `.allergen-pill` is already styled with `font-size: 9px; text-transform: uppercase; letter-spacing: 0.18em; font-weight: 600; color: var(--lux-text-muted); border: 1px solid var(--lux-border-hairline); border-radius: 2px;`
- Lines 1400–1434: `.dish-photo-trigger` is already styled with `font-size: 10px; font-weight: 500; letter-spacing: 0.22em; text-transform: uppercase; color: var(--lux-gold-champagne);` and animated underline `.trigger-line`.
- Lines 631–638: `.menu-item-price.dual` is styled with `font-size: 0.85rem; font-style: italic; letter-spacing: 0.15em; color: #a8a095;`.

### Obs 1.7: Existing Test Suite State
- `node tests/test-runner.mjs`: Ran all 4 test tiers (Hygiene, Invariants, DOM Transitions, Customer Journeys), **87/87 tests passed** in 5.00s.
- `node --test tests/tier5-m2-typography-adversarial.test.mjs`: **28/28 tests passed** in 108ms.
- `npm run pipeline`: `tsc --noEmit && vite build` completed with Exit Code 0 in 1.31s.

---

## 2. Logic Chain

1. **Premise (From Obs 1.1, Obs 1.2, SDD_MASTER [DT-03], ORIGINAL_REQUEST R3)**: The presence of food emojis in `tagIcons` (16 icons) and the camera emoji `📸` in `photoBtn` degrades the restaurant's visual presentation from Haute Cuisine to informal fast food, directly violating the 3-Michelin-Star Quiet Luxury specification.
2. **Inference 1**: Deleting `tagIcons` and removing `${icons}` from `<h3>${item.name}</h3>` removes the hardcoded emoji generation.
3. **Inference 2 (From Obs 1.1, Obs 1.5, Obs 1.6)**: To communicate ingredients safely without emojis, dish tags must be rendered as semantic micro-pills (`.allergen-pill`) conforming strictly to the 16 `AllergenTag` values in `specs/openapi.yaml`. When a dish has 0 tags, `<div class="menu-item-allergens">` must be omitted cleanly (verified by test T3.2.4).
4. **Inference 3 (From Obs 1.2, Obs 1.6)**: Replacing `.item-photo-btn` with `<button class="dish-photo-trigger"><span>FOTOGRAFÍA</span><span class="trigger-line"></span></button>` fulfills `specs/design-system-spec.md` §3.A. Updating the query selector to `.dish-photo-trigger, .item-photo-btn` preserves full backward-compatibility and event handling.
5. **Inference 4 (From Obs 1.4)**: Extracting `formatMenuItemPrice` ensures that dishes with `price <= 0` gracefully display their description or fallback to `'Precio según mercado'` with CSS class `.menu-item-price.dual`, fulfilling Feature #13 without `NaN` or `undefined` regressions.
6. **Inference 5 (From Obs 1.3)**: Explicit interfaces (`MenuItem`, `MenuCategory`, `AllergenTag`) replace all 5 instances of `: any` in the menu functions, ensuring compile-time safety under `tsc --noEmit` and `"strict": true`.
7. **Inference 6 (From Obs 1.1, helper in `tests/helpers/sanitize.mjs`)**: Wrapping names and subcategory headers in `sanitizeDishName` defensively strips any residual or adversarial emojis in Firestore or seed data while preserving Spanish accents.

---

## 3. Caveats

1. **Scope Limitation**: This investigation is strictly read-only. No edits were made directly to `src/main.ts`, `carta.html`, or `src/style.css`.
2. **Milestone 4/5 Boundaries**: Emojis in gallery captions (`🍸`, `🍰` at lines 511, 513) and reservation WhatsApp templates (lines 688–692) were documented for situational awareness, but are governed by Milestone 4 (Gallery/Admin) and Milestone 5 (Reservations).
3. **`tsconfig.json` Compiler Setting**: Because `"erasableSyntaxOnly": true` is enforced in `tsconfig.json`, TypeScript `enum AllergenTag` must NOT be used. Instead, `const tuple as const` with `type AllergenTag = typeof OFFICIAL_ALLERGEN_TAGS[number]` is the exact valid syntax.

---

## 4. Conclusion

The carta logic in `src/main.ts` is fully mapped and ready for immediate implementation:
- **Exact diff proposal**: Completed and validated in `plan.md`.
- **Typing**: Pure TypeScript interfaces and types ready to drop in (`MenuItem`, `MenuCategory`, `AllergenTag`).
- **Emoji Eradication**: 100% elimination of `tagIcons`, camera button `📸`, and runtime sanitization for dish and category names.
- **Markup synchronization**: `carta.html` is clean, has zero emojis, and is 100% synchronized with the proposed DOM structure.

---

## 5. Verification Method

To verify the refactoring after implementation:

1. **Verify TypeScript compilation**:
   ```powershell
   npx tsc --noEmit
   ```
   *Expected result*: Exit Code 0, 0 errors, no `: any` leakage in `src/main.ts`.

2. **Verify Full Test Suite**:
   ```powershell
   node tests/test-runner.mjs
   ```
   *Expected result*: 87/87 tests pass across all 4 tiers, specifically verifying:
   - T3.1.1: `sanitizeDishName` removes food/animal emojis while preserving Spanish accents.
   - T3.1.2: `renderMenuItemHtml` outputs pure serif title with zero emoji icons.
   - T3.1.4: Card markup contains zero `.menu-tag` emoji elements.
   - T3.1.5: Allergen pills render uppercase without emojis.
   - T3.2.1 & T3.2.4: Allergen pills are containerized in `.menu-item-allergens` and omitted when tags are empty.
   - T3.2.5 & T4.1.5: Dual pricing dishes render market text with `.menu-item-price.dual`.

3. **Verify Build Pipeline**:
   ```powershell
   npm run pipeline
   ```
   *Expected result*: Exit Code 0, production bundles generated in `dist/` in under 2 seconds.
