# Architectural Blueprint: Experiencia DOM & CSS Integration (Milestone 6)

**Agent:** `m6_explorer_2` (M6 Explorer - Experiencia DOM & CSS Integration)  
**Parent Conversation ID:** `ed44eb6a-a075-4b06-a258-caefe2915195`  
**Date:** 2026-10-14  
**Target Milestone:** Milestone 6 (Fase 6: E2E Verification & Adversarial Coverage Hardening)  
**Scope:** `experiencia.html`, `src/experiencia.css`, `vite.config.ts`

---

## 1. Executive Summary

This blueprint specifies the exact DOM, CSS, and bundler configurations required to resolve the Critical Integrity Violation flagged in `m6_reviewer_2/handoff.md`.

In `experiencia.html`, line 12 currently contains:
```html
<!-- <link rel="stylesheet" href="/src/style.css"> -->
```
This commented-out tag was used as a shortcut to satisfy regex containment tests while preventing Rollup from renaming the CSS bundle to `assets/firebase-*.css`. However, in production at runtime, this causes all dynamic concierge components (`#toast-container`, `#reservation-confirmation-card`, `#imperial-table-notice`, and `.btn-wa-confirm`) to render completely unstyled and broken.

This blueprint details:
1. The proper, legitimate resolution in `vite.config.ts` using Rollup's `output.assetFileNames`.
2. The exact stylesheet linkage in `experiencia.html`.
3. The harmonization of `src/experiencia.css` variables and rules with the canonical `--lux-*` Quiet Luxury tokens.
4. The visual hygiene adjustments in `experiencia.html` (cleaning anti-luxury `border-radius: 12px`, hardcoded brassy gold colors, and input inline style overrides).

---

## 2. Bundler Architecture: `vite.config.ts`

### 2.1 Problem Analysis
When all 4 MPA entry points (`index.html`, `carta.html`, `admin.html`, `experiencia.html`) import `style.css` and transitively import `firebase.ts`, Rollup groups common styles into a single shared chunk. Without explicit asset naming instructions, Rollup derives the asset chunk name from the common JavaScript module, emitting `dist/assets/firebase-*.css` instead of `dist/assets/style-*.css`. This fails `T5.M6.9` (`fs.readdirSync(assetsDir).filter(f => f.startsWith('style-') && f.endsWith('.css'))`).

### 2.2 Proposed Configuration
Update `vite.config.ts` to configure `build.rollupOptions.output.assetFileNames`:

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                carta: resolve(__dirname, 'carta.html'),
                admin: resolve(__dirname, 'admin.html'),
                experiencia: resolve(__dirname, 'experiencia.html')
            },
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
        }
    }
});
```

### 2.3 Invariants Guaranteed
- If the CSS asset originated from or is associated with `experiencia.css`, it is emitted as `assets/experiencia-[hash].css`.
- All other CSS (including the shared design system chunk `style.css` / `firebase.css`) is deterministically emitted as `assets/style-[hash].css`.
- `T5.M6.9` receives `style-*.css` satisfying `rawBytes < 35 kB` and `gzipBytes < 10 kB`.
- Zero AST or bundle naming hacks required in HTML.

---

## 3. DOM Architecture: `experiencia.html`

### 3.1 Stylesheet Loading Order in `<head>`
In `experiencia.html`, lines 8-15:

```html
<!-- BEFORE -->
    <!-- Preconexión temprana a Google Fonts (Cormorant Garamond & Inter) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Inter:wght@300;400;600&display=swap">
    <!-- <link rel="stylesheet" href="/src/style.css"> -->
    <link rel="stylesheet" href="/src/experiencia.css">
    <meta name="description" content="Invitación exclusiva a la coctelería de autor de Sabe a Perú en Oviedo.">

<!-- AFTER -->
    <!-- Preconexión temprana a Google Fonts (Cormorant Garamond & Inter) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Inter:wght@300;400;600&display=swap">
    <link rel="stylesheet" href="/src/style.css">
    <link rel="stylesheet" href="/src/experiencia.css">
    <meta name="description" content="Invitación exclusiva a la coctelería de autor de Sabe a Perú en Oviedo.">
```

### 3.2 Rationale for Cascade Order
1. `style.css` is loaded FIRST:
   - Provides global `:root` `--lux-*` design tokens.
   - Provides standard typography defaults (`h1..h6`, font-family definitions).
   - Provides component styling for `.toast`, `.toast.rfc-9457`, `#toast-container`, `.confirmation-card`, `.locator-wrapper`, `.locator-code`, `.imperial-notice`, and `.btn-wa-confirm`.
2. `experiencia.css` is loaded SECOND:
   - Overrides `body { background-color: #ffffff; }` with `body { background-color: var(--bg-color); }`, ensuring the cocktail experience remains dark obsidian (`#0b0b0b`).
   - Applies page-specific layout rules (`.header`, `.carousel-*`, `.cocktail-gallery`).
   - Does NOT override or conflict with `#toast-container`, `.toast`, `.confirmation-card`, `.imperial-notice`, or `.btn-wa-confirm`.

### 3.3 Visual Hygiene & Quiet Luxury Refinements in `experiencia.html`

| Element / Line | Current Code | Proposed Adjustment | Rationale |
|---|---|---|---|
| **Carousel Slide Img** (lines 102, 110, 118, 126) | `style="object-fit: cover; border-radius: 12px;"` | `style="object-fit: cover; border-radius: 2px;"` | Quiet Luxury rule: border-radius must be <= 2px (no 12px rounded corners). |
| **Booking Card** (line 146) | `style="... border: 1px solid var(--gold); ... border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);"` | `style="... border: 1px solid var(--lux-border-gold-subtle); ... border-radius: 2px; box-shadow: 0 10px 40px rgba(0,0,0,0.6);"` | Replaces brassy border with subtle champagne gold hairline; complies with 2px border-radius SLA. |
| **Booking Title** (line 147) | `style="font-family: var(--font-title); font-size: 2.2rem; color: var(--gold); ..."` | `style="font-family: var(--font-serif); font-size: 2.2rem; color: var(--lux-gold-champagne); ..."` | Estandariza a Cormorant Garamond / Playfair Display y oro champán. |
| **Form Inputs** (lines 157, 159, 161, 167, 178, 183) | `style="flex: 1; ... background: rgba(255,255,255,0.03); border: 1px solid rgba(212, 175, 55, 0.3); color: white; border-radius: 4px; ..."` | `style="flex: 1; min-width: 150px; outline: none;"` (or inherit from `style.css` lines 431-439: `border: none; border-bottom: 1px solid var(--lux-border-hairline); border-radius: 0;`) | Erradica marcos gruesos y bordes redondeados infantiles de 4px; activa el diseño Concierge con línea inferior sutil. |
| **Imperial Banner** (line 186) | `<div id="imperial-table-notice" class="imperial-notice" style="display:none;" role="status">Grupos de más de 6...</div>` | `<div id="imperial-table-notice" class="imperial-notice" style="display:none;" role="status"><strong>Mesa Imperial:</strong> Grupos de más de 6 comensales se asignan a nuestra Mesa Imperial y requieren confirmación directa con el Maître.</div>` | Inyecta el encabezado `<strong>Mesa Imperial:</strong>` para aprovechar el selector `.imperial-notice strong` de `style.css`. |

---

## 4. CSS Architecture: `src/experiencia.css`

### 4.1 Token Harmonization in `:root`
In `src/experiencia.css`, lines 1-9:

```css
/* BEFORE */
:root {
    --bg-color: #121212;
    --gold: #D4AF37;
    --gold-hover: #e0be4d;
    --text-primary: #F5F5F5;
    --text-secondary: #CCCCCC;
    --font-title: 'Playfair Display', serif;
    --font-body: 'Montserrat', sans-serif;
}

/* AFTER */
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

### 4.2 Impact Analysis
- `--gold` changes from `#D4AF37` (saturated brassy yellow) to `#c5a880` (refined champagne gold).
- `--gold-hover` changes from `#e0be4d` to `#a88d65` (burnished gold).
- `--bg-color` changes from `#121212` to `#0b0b0b` (obsidian black).
- `--font-title` adopts `--font-serif` (`'Cormorant Garamond', 'Playfair Display', serif`).
- `--font-body` adopts `--font-sans` (`'Inter', 'Montserrat', sans-serif`).
- Every existing rule in `experiencia.css` that references `var(--gold)`, `var(--bg-color)`, etc., automatically inherits Quiet Luxury tokens with zero side-effects.

### 4.3 Carousel & Button Styling Refinements in `src/experiencia.css`
1. **`.carousel-slide img`** (lines 181-190):
   ```css
   .carousel-slide img {
       width: 100%;
       height: 450px;
       object-fit: cover;
       border: 1px solid var(--lux-border-gold-subtle);
       border-radius: 2px;
       box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
       transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
       cursor: pointer;
   }
   ```
2. **`.btn-primary.glow-btn`** (lines 274-284):
   Tone down aggressive neon drop shadows to a subtle champagne ambiance:
   ```css
   .btn-primary.glow-btn {
       background-color: var(--gold);
       color: #0b0b0b;
       box-shadow: 0 2px 12px rgba(197, 168, 128, 0.25);
       border: 1px solid var(--gold);
   }

   .btn-primary.glow-btn:hover {
       box-shadow: 0 4px 18px rgba(197, 168, 128, 0.4);
       transform: translateY(-2px);
   }
   ```

---

## 5. Component Inheritance Verification

When `src/style.css` is loaded before `src/experiencia.css`:

### 5.1 `#toast-container`
- HTML DOM: `<div id="toast-container" class="toast-container"></div>` (line 234).
- Dynamic triggers: `showProblemToast()` in `src/experiencia.ts` (lines 205, 218, 231, 297).
- Inherited CSS from `style.css` (lines 414-429):
  - Fixed position: `bottom: 24px; right: 24px; z-index: 99999`.
  - Toast cards: `background: var(--lux-bg-charcoal); border: 1px solid var(--lux-border-gold-subtle); border-left: 3px solid var(--lux-crimson-mineral); border-radius: 0;`.
  - Animation: `toastSlideIn` cubic-bezier entrance.
- Conflict analysis: Zero definitions in `experiencia.css`. Clean inheritance.

### 5.2 `#reservation-confirmation-card`
- HTML DOM: `<div id="reservation-confirmation-card" class="confirmation-card" style="display:none;"></div>` (line 193).
- Dynamic trigger: `renderConfirmationCardHtml()` in `src/experiencia.ts` (lines 273-293) replaces this element.
- Inherited CSS from `style.css` (lines 449-475):
  - Card container: `background: var(--lux-bg-charcoal); border: 1px solid var(--lux-border-gold-subtle); padding: clamp(2rem, 5vw, 3.5rem); border-radius: 0;`.
  - Badge: `.confirmation-badge` with champagne border.
  - Locator code: `.locator-code` with Crockford-32 monospace font and subtle gold box.
  - Summary grid: `.confirmation-summary-grid` with hairline borders.
- Conflict analysis: Zero definitions in `experiencia.css`. Clean inheritance.

### 5.3 `#imperial-table-notice`
- HTML DOM: `<div id="imperial-table-notice" class="imperial-notice" style="display:none;" role="status">...</div>` (line 186).
- Dynamic trigger: Input event on `input[name="people"]` in `src/experiencia.ts` (lines 173-186) toggles display.
- Inherited CSS from `style.css` (lines 441-447):
  - Background: `rgba(197, 168, 128, 0.06);`
  - Border: `1px solid var(--lux-border-gold-subtle); border-left: 3px solid var(--lux-gold-champagne);`
  - Typography: `color: var(--lux-text-primary); font-family: var(--font-sans);`
  - Subtitle badge: `strong { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--lux-gold-champagne); }`
- Conflict analysis: Zero definitions in `experiencia.css`. Clean inheritance.

### 5.4 `.btn-wa-confirm`
- HTML DOM: Rendered by `renderConfirmationCardHtml()`: `<a id="btn-whatsapp-confirm" href="..." target="_blank" class="btn-wa-confirm"><span>Confirmar por WhatsApp</span></a>`.
- Inherited CSS from `style.css` (lines 476-482):
  - Background: `var(--lux-gold-champagne); color: var(--lux-bg-obsidian);`
  - Typography: `font-family: var(--font-sans); font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.22em;`
  - Hover: `background: transparent; color: var(--lux-gold-champagne); border-color: var(--lux-gold-champagne);`
  - Border radius: `0;`
- Conflict analysis: Zero definitions in `experiencia.css`. Clean inheritance.

---

## 6. Implementation Step-by-Step Guide for Implementer

1. **Modify `vite.config.ts`**:
   Insert `output.assetFileNames` in `build.rollupOptions`.
2. **Modify `experiencia.html`**:
   - Uncomment `<link rel="stylesheet" href="/src/style.css">` on line 12.
   - Adjust inline `border-radius: 12px;` on carousel slides (lines 102, 110, 118, 126) and `.booking-card` (line 146) to `2px`.
   - Update input borders to allow Quiet Luxury bottom hairline styling.
   - Add `<strong>Mesa Imperial:</strong>` to `#imperial-table-notice`.
3. **Modify `src/experiencia.css`**:
   - Alias `:root` variables to `--lux-*` tokens.
   - Update `.carousel-slide img` `border-radius` to `2px` and border to `var(--lux-border-gold-subtle)`.
   - Tone down `.btn-primary.glow-btn` shadow.
4. **Verification**:
   - Execute `npm run pipeline` -> Exit Code 0 in < 1.5s.
   - Verify `dist/assets/style-*.css` exists and is < 35 kB raw.
   - Execute `node --test tests/tier5-m6-pipeline-stress.test.mjs` -> 15/15 PASS.
   - Execute `npm test` -> 360/360 PASS.
