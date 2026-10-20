# Milestone 2 Implementation Blueprint: Design Tokens & Visual Deprecations

**Author:** `m2_explorer_1` (M2 Explorer - Design Tokens & Visual Deprecations)  
**Parent Conversation ID:** `ed44eb6a-a075-4b06-a258-caefe2915195`  
**Target File:** `src/style.css`  
**Formal Specifications:** `specs/design-system-spec.md`, `specs/SDD_MASTER.md` ([DT-05], [DT-06], [DT-07]), `specs/performance-spec.md`  
**Reference Skill:** `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\luxury-web-design\SKILL.md`

---

## 1. Executive Summary & Problem Boundary

Milestone 2 (Fase 2: Sistema de Diseño Quiet Luxury) addresses three core technical and aesthetic requirements in `src/style.css`:
1. **[DT-05] Official CSS Design Tokens:** Integration of the 12 canonical Quiet Luxury tokens (Obsidian, Charcoal, Surface, Alabaster, Parchment, Champagne Gold, Burnished Gold, Mineral Crimson, Ivory/Warm Primary Text, Warm Secondary Text, Muted Text, Hairline Border, Subtle Gold Border) into `:root`, while keeping backward-compatible aliases for legacy properties (`--color-gold`, etc.) to prevent regressions in un-refactored sections.
2. **[DT-05] Stone Frame & Nazca Decorative SVG Repeal:** Total elimination of the anti-luxury 80px brown stone border (`border-width: 80px 80px; border-color: #2e2620;`) in `.page-carta .section-container` and eradication of inline SVG vector pseudo-elements (`::before` and `::after` containing hummingbird, spider, spiral, monkey, hands, tree, and side zigzag glyphs in lines 466–595 of `src/style.css`). Replacement with an architecturally pure 1px hairline border (`rgba(197, 168, 128, 0.18)`), generous breathing room (`padding: clamp(3rem, 6vw, 6rem)`), and subtle obsidian radial glow.
3. **[DT-06] Shiny Button Animation Repeal & Photo Trigger Styling:** Permanent elimination of the continuous reflective loop (`animation: shiny-button 3s infinite;` and `@keyframes shiny-button`) and bulbous pill border-radius (`border-radius: 20px;`) in `.item-photo-btn::after` (lines 1427–1474 in `src/style.css`). Provision of the formal Quiet Luxury editorial contract styling for `.dish-photo-trigger` (10px uppercase, `--lux-gold-champagne`, animated hairline on hover) alongside a subdued legacy bridge for `.item-photo-btn` to ensure 100% visual stability until Milestone 3 refactors `src/main.ts`.
4. **Allergen Pill UI Foundation:** Inclusion of the Quiet Luxury styling for `.menu-item-allergens` and `.allergen-pill` (9px uppercase, `--lux-text-muted`, 1px hairline border, zero saturation) as required by `specs/design-system-spec.md` §3.A.

---

## 2. Baseline Code Audit (Observed Locations in `src/style.css`)

| Target | Current Lines | Current Implementation | Issues Identified |
|---|---|---|---|
| `:root` Variables | 1–10 | Only 8 rudimentary variables (`--color-gold`, `--color-primary`, etc.) | Lacks official `--lux-*` Quiet Luxury token architecture specified in `specs/design-system-spec.md` §1. |
| `.page-carta .section-container` | 449–471 | `border-width: 80px 80px; border-style: solid; border-color: #2e2620; padding: 60px; margin: 100px auto;` | Anti-luxury heavy stone border violates 3-Michelin-star negative space guidelines. |
| Nazca Top Artwork (`::before`) | 474–498 | 4 inline SVG data URIs (Hummingbird, Spiral, Spider, ZigZag) in `background-image` | Unused heavy vector graphics bloating CSS bundle; yellow `#ffd700` stroke conflicts with desaturated gold. |
| Nazca Bottom Artwork (`::after`) | 501–523 | 3 inline SVG data URIs (Monkey, Hands, Tree) in `background-image` | Anti-luxury folkloric figures conflict with Quiet Luxury aesthetic. |
| Menu Grid Nazca Side Glyphs | 526–560 | `.menu-grid::before`, `.menu-grid::after` repeating zigzag data URIs | Clutters layout boundaries, violates negative space. |
| Mobile Frame Overrides | 563–595 | `@media (max-width: 768px)` with `border-width: 50px 30px;` and scaled SVG pseudo-elements | Severe mobile layout compression and horizontal scroll hazard. |
| Photo Button & Shiny Animation | 1413–1474 | `.item-photo-btn` has `border-radius: 20px;`, `.item-photo-btn::after` has `animation: shiny-button 3s infinite;` + `@keyframes shiny-button` | Distracting reflective loop explicitly forbidden by `specs/design-system-spec.md` §4 and acceptance criteria R2. |

---

## 3. Concrete Implementation Plan & Exact Diffs

### Chunk 1: Quiet Luxury `:root` Tokens (Lines 1–10 of `src/style.css`)

#### Intent
Insert all canonical `--lux-*` color and border tokens while retaining existing `--color-*` and font aliases for backwards compatibility.

#### Target Location
`src/style.css`, lines 1–10

#### Diff
```diff
--- a/src/style.css
+++ b/src/style.css
@@ -1,10 +1,33 @@
 :root {
+  /* ==========================================================================
+     Quiet Luxury Design System Tokens (3-Michelin-Star Aesthetic)
+     Formal Spec: specs/design-system-spec.md §1
+     ========================================================================== */
+  /* Fondos Primarios y Secundarios */
+  --lux-bg-obsidian: #0b0b0b;        /* Fondo principal de inmersión */
+  --lux-bg-charcoal: #141414;        /* Contenedores de sección y tarjetas */
+  --lux-bg-surface: #1c1b1a;         /* Superficies elevadas, dropdowns y modales */
+
+  /* Alternativas Claras (Alabastro / Pergamino) */
+  --lux-bg-alabaster: #fbf9f5;       /* Fondo claro para secciones de lectura */
+  --lux-bg-parchment: #f4efe8;       /* Fondos secundarios claros */
+
+  /* Acentos Metálicos y Minerales (Desaturados y Nobles) */
+  --lux-gold-champagne: #c5a880;     /* Acento principal en oro champán */
+  --lux-gold-burnished: #a88d65;     /* Oro envejecido para hover y bordes activos */
+  --lux-crimson-mineral: #8b1e22;    /* Carmín profundo andino */
+
+  /* Tipografía y Textos */
+  --lux-text-primary: #f5f2eb;       /* Marfil cálido (alto contraste sin deslumbrar) */
+  --lux-text-secondary: #c0bab0;     /* Gris cálido para descripciones de platos */
+  --lux-text-muted: #858076;         /* Alérgenos, subtítulos pequeños y metadatos */
+  --lux-text-dark: #1a1918;          /* Texto sobre fondos de alabastro */
+
+  /* Hairlines y Bordes Arquitectónicos */
+  --lux-border-hairline: rgba(245, 242, 235, 0.08);
+  --lux-border-gold-subtle: rgba(197, 168, 128, 0.20);
+
+  /* Legacy Compatibility Variables */
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

---

### Chunk 2: Repeal of 80px Stone Border & Nazca SVGs (Lines 447–595 of `src/style.css`)

#### Intent
Replace the 80px brown stone border (`#2e2620`) and all pseudo-element SVGs (`::before`, `::after` on `.section-container` and `.menu-grid`) with a 1px hairline border (`rgba(197, 168, 128, 0.18)`), pure obsidian background with radial sheen, and clean responsive padding.

#### Target Location
`src/style.css`, lines 447–595

#### Diff
```diff
--- a/src/style.css
+++ b/src/style.css
@@ -447,150 +447,40 @@
-/* --- NAZCA ARCHAEOLOGICAL FRAME (Guaranteed Visibility) --- */
-/* SIDE BORDERS (Specific Implementation to Ensure Visibility) */
+/* --- QUIET LUXURY MENU CONTAINER ARCHITECTURE --- */
 .page-carta .section-container {
   /* Inner content spacing */
-  padding: 60px;
-  /* Push down to make room for top frame border */
-  margin: 100px auto 100px;
+  padding: clamp(3rem, 6vw, 6rem);
+  margin: 60px auto;
   max-width: 1000px;
 
-  /* The Content Box Background (Dark) */
-  background-color: #1a1a1a;
+  /* Content Box Background: Pure Obsidian with subtle radial warmth */
+  background-color: var(--lux-bg-obsidian);
+  background-image: radial-gradient(circle at 50% 0%, rgba(197, 168, 128, 0.04) 0%, transparent 70%);
 
-  box-shadow: 0 0 50px rgba(0, 0, 0, 0.8);
+  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
 
-  /* The FRAME via Borders */
+  /* Architecture: 1px hairline subtle gold border replacing 80px stone frame */
   position: relative;
-  /* Thick solid borders acting as the "Stone Frame" */
-  border-width: 80px 80px;
-  border-style: solid;
-  border-color: #2e2620;
-  /* Dark Brown Earth */
-
-  /* Ensure artwork on borders is visible */
-  overflow: visible;
+  border: 1px solid rgba(197, 168, 128, 0.18);
+  border-radius: 2px;
+  overflow: hidden;
 }
 
-/* TOP FRAME ARTWORK (Horizontal) */
-.page-carta .section-container::before {
-  content: '';
-  position: absolute;
-  /* Cover the top border area */
-  top: -80px;
-  left: -80px;
-  right: -80px;
-  height: 80px;
-  pointer-events: none;
-  z-index: 20;
-
-  background-image:
-    /* 1. Hummingbird (Center) */
-    url("data:image/svg+xml,..."),
-    /* 2. Spiral (Left Corner) */
-    url("data:image/svg+xml,..."),
-    /* 3. Spider (Right Corner) */
-    url("data:image/svg+xml,..."),
-    /* 4. ZigZag Line (Bottom Edge) */
-    url("data:image/svg+xml,...");
-
-  background-position: center center, 20px center, right 20px center, bottom left;
-  background-size: 80px 80px, 50px 50px, 50px 50px, 100% 10px;
-  background-repeat: no-repeat;
-}
-
-/* BOTTOM FRAME ARTWORK (Horizontal) */
-.page-carta .section-container::after {
-  content: '';
-  position: absolute;
-  /* Cover the bottom border area */
-  bottom: -80px;
-  left: -80px;
-  right: -80px;
-  height: 80px;
-  pointer-events: none;
-  z-index: 20;
-
-  background-image:
-    /* 1. Monkey (Center) */
-    url("data:image/svg+xml,..."),
-    /* 2. Hands (Left) */
-    url("data:image/svg+xml,..."),
-    /* 3. Tree (Right) */
-    url("data:image/svg+xml,...");
-
-  background-position: center center, 20px center, right 20px center;
-  background-size: 70px 70px, 50px 50px, 40px 60px;
-  background-repeat: no-repeat;
-}
-
-/* SIDE LINES DECORATION (Re-Enabled via pseudo-elements on .menu-grid) */
-.menu-grid {
-  position: relative;
-}
-
-.menu-grid::before,
-.menu-grid::after {
-  content: '';
-  position: absolute;
-  top: -415px;
-  bottom: -68px;
-  width: 40px;
-  pointer-events: none;
-  z-index: 25;
-  background-repeat: repeat-y;
-  background-size: 100% 40px;
-  opacity: 0.8;
-  display: block !important;
-}
-
-.menu-grid::before {
-  left: -95px;
-  background-image: url("data:image/svg+xml,...");
-}
-
-.menu-grid::after {
-  right: -95px;
-  background-image: url("data:image/svg+xml,...");
-}
+/* Derogación formal de figuras vectoriales Nazca en pseudoelementos */
+.page-carta .section-container::before,
+.page-carta .section-container::after,
+.menu-grid::before,
+.menu-grid::after {
+  content: none !important;
+  display: none !important;
+}
 
 /* Mobile Adjustments */
 @media (max-width: 768px) {
   .page-carta .section-container {
-    border-width: 50px 30px;
-    margin: 20px 0;
-    width: auto;
-    padding: 20px;
-  }
-
-  .page-carta .section-container::before {
-    top: -50px;
-    left: -30px;
-    right: -30px;
-    height: 50px;
-    background-size: 50px 50px, 30px 30px, 30px 30px, 100% 5px;
-  }
-
-  .page-carta .section-container::after {
-    bottom: -50px;
-    left: -30px;
-    right: -30px;
-    height: 50px;
-    background-size: 40px 40px, 30px 30px, 20px 30px;
-  }
-
-  /* Hide side lines on mobile */
-  .menu-grid::before,
-  .menu-grid::after {
-    display: none !important;
+    padding: clamp(1.5rem, 4vw, 2.5rem);
+    margin: 20px auto;
+    border: 1px solid rgba(197, 168, 128, 0.18);
   }
 
   .page-carta .serif-title::before {
     display: none;
   }
 }
```

---

### Chunk 3: Repeal of Shiny Button Animation & Integration of Editorial Photo Trigger Contract (Lines 1412–1475 of `src/style.css`)

#### Intent
Eliminate continuous infinite reflective sweep (`shiny-button 3s infinite`), eradicate `@keyframes shiny-button`, style the new `.dish-photo-trigger` (editorial contract for Milestone 3), and provide a subdued, non-bulbous bridge for `.item-photo-btn`.

#### Target Location
`src/style.css`, lines 1412–1475

#### Diff
```diff
--- a/src/style.css
+++ b/src/style.css
@@ -1412,63 +1412,65 @@
-/* --- MENU PHOTO BUTTON (SHINY) --- */
-.item-photo-btn {
-  background: var(--color-gold);
-  border: none;
-  color: white;
+/* ==========================================================================
+   EDITORIAL PHOTO TRIGGER & LEGACY BUTTON (Quiet Luxury Contract)
+   Formal Spec: specs/design-system-spec.md §3.A & §4
+   ========================================================================== */
+
+/* Official Quiet Luxury Editorial Trigger */
+.dish-photo-trigger {
+  background: transparent;
+  border: none;
+  color: var(--lux-gold-champagne);
+  font-family: var(--font-sans);
+  font-size: 10px;
+  font-weight: 500;
+  letter-spacing: 0.22em;
+  text-transform: uppercase;
   cursor: pointer;
-  font-size: 0.9rem;
-  margin-left: 15px;
-  padding: 6px 10px;
-  border-radius: 20px;
-  vertical-align: middle;
+  padding: 4px 0;
   display: inline-flex;
-  align-items: center;
-  gap: 5px;
-  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
-  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
+  flex-direction: column;
+  align-items: flex-start;
+  transition: color 0.4s ease;
   position: relative;
-  overflow: hidden;
+  text-decoration: none;
+}
+
+.dish-photo-trigger:hover {
+  color: var(--lux-text-primary);
+}
+
+.dish-photo-trigger .trigger-line {
+  display: block;
+  width: 0%;
+  height: 1px;
+  background-color: var(--lux-gold-champagne);
+  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
+  margin-top: 3px;
+}
+
+.dish-photo-trigger:hover .trigger-line {
+  width: 100%;
+}
+
+/* Legacy Bridge for .item-photo-btn (Neutralized, 0 Shiny Loop) */
+.item-photo-btn {
+  background: transparent;
+  border: 1px solid var(--lux-border-gold-subtle);
+  color: var(--lux-gold-champagne);
+  cursor: pointer;
+  font-size: 0.75rem;
+  margin-left: 12px;
+  padding: 4px 10px;
+  border-radius: 2px;
+  vertical-align: middle;
+  display: inline-flex;
+  align-items: center;
+  gap: 5px;
+  box-shadow: none;
+  transition: all 0.4s ease;
   font-family: var(--font-sans);
-  font-weight: 700;
+  font-weight: 500;
   text-transform: uppercase;
-  letter-spacing: 0.1em;
+  letter-spacing: 0.15em;
 }
 
-/* Shiny effect animation */
-.item-photo-btn::after {
-  content: '';
-  position: absolute;
-  top: -50%;
-  left: -50%;
-  width: 200%;
-  height: 200%;
-  background: linear-gradient(
-    to bottom right,
-    rgba(255, 255, 255, 0) 0%,
-    rgba(255, 255, 255, 0.1) 40%,
-    rgba(255, 255, 255, 0.4) 50%,
-    rgba(255, 255, 255, 0.1) 60%,
-    rgba(255, 255, 255, 0) 100%
-  );
-  transform: rotate(45deg);
-  animation: shiny-button 3s infinite;
-  pointer-events: none;
-}
-
-@keyframes shiny-button {
-  0% { transform: translateX(-100%) rotate(45deg); }
-  20%, 100% { transform: translateX(100%) rotate(45deg); }
-}
+.item-photo-btn::after {
+  content: none !important;
+  display: none !important;
+}
 
 @media (hover: hover) {
   .item-photo-btn:hover {
-    transform: scale(1.1) translateY(-2px);
-    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.5);
-    background: white;
-    color: var(--color-gold);
+    border-color: var(--lux-gold-champagne);
+    color: var(--lux-text-primary);
+    background: rgba(197, 168, 128, 0.08);
+    transform: none;
+    box-shadow: none;
   }
 }
 
 .item-photo-btn:active {
-  transform: scale(0.95);
+  transform: scale(0.98);
 }
```

---

### Chunk 4: Quiet Luxury Allergen Tags UI (Placed at Menu Grid Section)

#### Intent
Provide the formal Quiet Luxury styling for `.menu-item-allergens` and `.allergen-pill` per `specs/design-system-spec.md` §3.A.

#### Target Location
`src/style.css`, around line 660 (adjacent to `.menu-item`)

#### Content to Add
```css
/* ==========================================================================
   Quiet Luxury Allergen Tags & Micro-copy
   Formal Spec: specs/design-system-spec.md §3.A
   ========================================================================== */
.menu-item-allergens {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.allergen-pill {
  font-family: var(--font-sans);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--lux-text-muted);
  background: transparent;
  border: 1px solid var(--lux-border-hairline);
  padding: 2px 6px;
  border-radius: 2px;
  line-height: 1.2;
}
```

---

## 4. Architectural Safeguards & Risk Analysis

1. **CSS Bundle Size Optimization:**
   - Removal of inline SVG data URIs (hummingbird, monkey, spider, tree, zigzags) sheds ~4.5 kB of uncompressed coordinate data from `src/style.css`.
   - Production CSS bundle `dist/assets/style-*.css` remains well within the Tier 5 budget (< 35 kB raw, < 10 kB gzip).
2. **Zero Layout Shift (CLS):**
   - The `.page-carta .section-container` remains centered with standard margins and box-sizing.
   - The elimination of the 80px border prevents horizontal clipping on tablets and smartphones.
3. **TypeScript / Build Hygiene:**
   - Zero changes to JavaScript/TypeScript files in this milestone.
   - `npm run pipeline` (`tsc --noEmit && vite build`) will compile cleanly in ~2.0 seconds with Exit Code 0.
4. **Coordination with `m2_explorer_2`:**
   - `m2_explorer_2` handles font selector hygiene in `admin.html` and typographic tracking standardization.
   - These CSS token and visual deprecation changes are completely orthogonal and non-conflicting.

---

## 5. Verification Commands for Implementer

1. **Pipeline & Build Verification:**
   ```powershell
   npm run pipeline
   ```
   *Expected Outcome:* Exit code 0, 34 modules transformed, bundle sizes within budgets.
2. **Automated Test Suite:**
   ```powershell
   npm test
   ```
   *Expected Outcome:* 119/119 passing tests.
3. **CSS Rule Invariant Assertions:**
   - Confirm `border-width: 80px` is absent from `src/style.css`.
   - Confirm `#2e2620` is absent from `src/style.css`.
   - Confirm `shiny-button` is absent from `src/style.css`.
   - Confirm `--lux-bg-obsidian`, `--lux-gold-champagne`, etc., exist in `:root` of `src/style.css`.
