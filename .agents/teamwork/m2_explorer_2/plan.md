# Technical Implementation Blueprint: Milestone 2 — Typography & Build Safety
**Subagent**: `m2_explorer_2` (M2 Explorer - Typography & Safety)  
**Milestone**: Milestone 2 (Fase 2: Sistema de Diseño Quiet Luxury)  
**Target Files**: `admin.html`, `src/style.css`, `src/main.ts`, `src/experiencia.css`, `experiencia.html`  
**Reference Specs**: `specs/design-system-spec.md` §2, `specs/SDD_MASTER.md` [DT-07], `PROJECT.md` Feature #10, `luxury-web-design` SKILL.md  

---

## 1. Executive Summary

This blueprint defines the exact code modifications for the typography standardization and build safety requirements of Milestone 2:
1. **Strict 2-Family Typography Standardization**:
   - **Editorial Serif** (*Cormorant Garamond* / *Playfair Display*) for all monumental headings (`h1`, `h2`, `h3`, `.serif-title*`, `.menu-subcategory-title`, dish headers).
   - **Geometric Sans-Serif** (*Inter* / *Montserrat*) with wide tracking (`letter-spacing: 0.15em` to `0.22em`) for navigation, buttons, prices, and micro-copy (allergen pills, badges, labels, footers).
2. **Backoffice Font Selectors Purge (`admin.html` lines 363–378)**:
   - Restrict `select[data-key="font_title"]` exclusively to `Cormorant Garamond` (default) and `Playfair Display`.
   - Restrict `select[data-key="font_text"]` exclusively to `Inter` (default) and `Montserrat`.
   - Permanently eradicate non-compliant options (*Cinzel*, *DM Serif Display*, *Lato*, *Open Sans*).
3. **Runtime Defensive Sanitization (`src/main.ts`)**:
   - Sanitize dynamic font keys read from Firestore so obsolete or invalid database strings cannot override the 2-family contract.
4. **Build Safety Verification**:
   - Guarantee `npm run pipeline` (`tsc --noEmit && vite build`) and `npm test` (119 automated tests across Tiers 1–5) execute with **Exit Code 0** and zero regressions.

---

## 2. Evidence Chain & Architectural Audit

### 2.1. Current Typography State
1. **`src/style.css` (lines 7–8)**:
   - Declares `--font-serif: 'Cormorant Garamond', 'Playfair Display', serif;` and `--font-sans: 'Inter', sans-serif;`.
   - Lacks global heading normalization for `h1, h2, h3, h4, h5, h6`, meaning unstyled headings fall back to `body { font-family: var(--font-sans); }`.
   - Inconsistent tracking: `.nav-links a` uses `0.25em`, `.label-white` uses `0.6em`, `.menu-subcategory-title` uses `0.3em`, `.btn-gold-fill` uses `0.3em`, `.footer-bottom` uses `0.3em`, while prices have `0.0em`.
2. **`admin.html` (lines 367–382)**:
   - Contains 4 title choices including *Cinzel* and *DM Serif Display*.
   - Contains 4 body choices including *Lato* and *Open Sans*.
   - Saving these options pollutes Firestore collection `site_content`.
3. **`src/main.ts` (lines 88–92)**:
   - Injects whatever string is stored in `site_content` directly into `document.documentElement.style.setProperty('--font-serif', item.content)`.
   - Lacks validation against the approved 2-family whitelist.
4. **`src/experiencia.css` and `experiencia.html`**:
   - `src/experiencia.css` declares `--font-title: 'Playfair Display', serif;` and `--font-body: 'Montserrat', sans-serif;`.
   - `experiencia.html` hardcodes inline `'Playfair Display'` on navigation links (`lines 55–58`) and footer (`line 203`), violating the Geometric Sans rule for navigation.

---

## 3. Exact Implementation Blueprints & File Diffs

### Target File 1: `admin.html`
**Location**: lines 365–383  
**Action**: Restrict font selectors to the two official families.

```diff
--- a/admin.html
+++ b/admin.html
@@ -365,19 +365,15 @@
                     <div class="content-group">
-                        <h3>Tipografía Base</h3>
-                        <label>Fuente de Títulos (Elegante)
+                        <h3>Tipografía Base (Sistema Oficial Quiet Luxury)</h3>
+                        <label>Fuente Editorial para Títulos (Serif)
                             <select data-key="font_title" style="width:100%; padding:10px; margin: 10px 0;">
-                                <option value="'Playfair Display', serif">Playfair Display (Por defecto)</option>
-                                <option value="'Cormorant Garamond', serif">Cormorant Garamond</option>
-                                <option value="'Cinzel', serif">Cinzel</option>
-                                <option value="'DM Serif Display', serif">DM Serif Display</option>
+                                <option value="'Cormorant Garamond', serif">Cormorant Garamond (Por defecto)</option>
+                                <option value="'Playfair Display', serif">Playfair Display</option>
                             </select>
                         </label>
-                        <label>Fuente de Textos (Legible)
+                        <label>Fuente Geométrica para Textos & Micro-copy (Sans-Serif)
                             <select data-key="font_text" style="width:100%; padding:10px; margin: 10px 0;">
                                 <option value="'Inter', sans-serif">Inter (Por defecto)</option>
-                                <option value="'Lato', sans-serif">Lato</option>
                                 <option value="'Montserrat', sans-serif">Montserrat</option>
-                                <option value="'Open Sans', sans-serif">Open Sans</option>
                             </select>
                         </label>
                     </div>
```

---

### Target File 2: `src/style.css`
**Actions**:
1. Harmonize `:root` font variables and token aliases.
2. Insert base heading rules (`h1, h2, h3, h4, h5, h6`).
3. Standardize wide tracking (`0.15em` to `0.22em`) on navigation, buttons, prices, and micro-copy.
4. Establish `.allergen-pill` and dual pricing typography rules.

#### Diff Chunk 1: Tokens and Base Headings (lines 1–32)
```diff
--- a/src/style.css
+++ b/src/style.css
@@ -7,4 +7,6 @@
-  --font-serif: 'Cormorant Garamond', 'Playfair Display', serif;
-  --font-sans: 'Inter', sans-serif;
+  --font-serif: 'Cormorant Garamond', 'Playfair Display', serif;
+  --font-sans: 'Inter', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
+  --font-title: var(--font-serif);
+  --font-body: var(--font-sans);
   --transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
 }
@@ -30,2 +32,11 @@
 }
 
+/* Base Headings - Editorial Serif (Michelin 3-Star Architecture) */
+h1, h2, h3, h4, h5, h6 {
+  font-family: var(--font-serif);
+  font-weight: 400;
+  line-height: 1.1;
+  letter-spacing: 0.02em;
+  text-rendering: optimizeLegibility;
+}
+
```

#### Diff Chunk 2: Navigation & Hero Labels Tracking (lines 218–236, 293–311)
```diff
--- a/src/style.css
+++ b/src/style.css
@@ -223,7 +223,8 @@
 .nav-links a {
   text-decoration: none;
   color: white;
+  font-family: var(--font-sans);
   text-transform: uppercase;
-  font-size: 0.7rem;
+  font-size: 0.75rem;
   font-weight: 600;
-  letter-spacing: 0.25em;
+  letter-spacing: 0.22em;
   transition: color 0.3s;
 }
@@ -294,6 +295,7 @@
 .serif-title-xl {
   font-family: var(--font-serif);
   font-size: clamp(3rem, 10vw, 7rem);
-  line-height: 0.9;
+  line-height: 1.05;
   margin: 20px 0 40px;
+  font-weight: 300;
 }
@@ -306,4 +308,6 @@
 .label-white {
+  font-family: var(--font-sans);
   text-transform: uppercase;
-  letter-spacing: 0.6em;
-  font-size: 0.8rem;
+  letter-spacing: 0.22em;
+  font-size: 0.75rem;
+  font-weight: 600;
   opacity: 0.8;
 }
```

#### Diff Chunk 3: Subcategory Title, Dish Headers & Prices (lines 613–622, 675–690)
```diff
--- a/src/style.css
+++ b/src/style.css
@@ -620,3 +620,3 @@
   text-transform: uppercase;
-  letter-spacing: 0.3em;
+  letter-spacing: 0.22em;
   position: relative;
@@ -675,5 +675,6 @@
-.menu-item-header h3 {
+.menu-item-header h3,
+.menu-item-name {
   font-family: var(--font-serif);
-  font-size: 1.4rem;
+  font-size: 1.35rem;
   color: #f5e6d3;
-  font-weight: 500;
+  font-weight: 400;
   letter-spacing: 0.03em;
+  line-height: 1.2;
 }
 
 .menu-item-price {
   font-family: var(--font-sans);
   color: #cca43b;
   /* Gold Price */
-  font-weight: 700;
+  font-weight: 600;
   font-size: 1.1rem;
+  letter-spacing: 0.15em;
+  text-transform: uppercase;
 }
+
+.menu-item-price.dual {
+  font-family: var(--font-sans);
+  font-size: 0.85rem;
+  font-weight: 400;
+  letter-spacing: 0.15em;
+  font-style: italic;
+  color: #a8a095;
+}
+
+/* Allergen Micro-Pill Typography */
+.allergen-pill {
+  display: inline-block;
+  font-family: var(--font-sans);
+  font-size: 9px;
+  text-transform: uppercase;
+  letter-spacing: 0.18em;
+  font-weight: 600;
+  color: #858076;
+  background: transparent;
+  border: 1px solid rgba(245, 242, 235, 0.12);
+  padding: 2px 7px;
+  margin: 2px 4px 2px 0;
+  border-radius: 2px;
+}
```

#### Diff Chunk 4: Buttons, Section Titles & Footer Micro-copy (lines 708–780, 940–955, 990–1012)
```diff
--- a/src/style.css
+++ b/src/style.css
@@ -711,5 +711,6 @@
   color: #aaa;
+  font-family: var(--font-sans);
   padding: 12px 24px;
   text-transform: uppercase;
   font-size: 0.75rem;
-  letter-spacing: 0.2em;
+  letter-spacing: 0.20em;
   transition: 0.3s;
@@ -733,5 +734,6 @@
   color: white;
   text-decoration: none;
-  font-weight: 700;
+  font-family: var(--font-sans);
+  font-weight: 600;
   text-transform: uppercase;
-  letter-spacing: 0.2em;
-  font-size: 0.8rem;
+  letter-spacing: 0.22em;
+  font-size: 0.75rem;
   transition: var(--transition);
 }
@@ -749,4 +751,5 @@
   color: white;
   text-decoration: none;
+  font-family: var(--font-sans);
   text-transform: uppercase;
-  letter-spacing: 0.2em;
-  font-size: 0.8rem;
+  letter-spacing: 0.22em;
+  font-size: 0.75rem;
   transition: var(--transition);
 }
@@ -774,7 +777,8 @@
 .label-gold {
   color: var(--color-gold);
+  font-family: var(--font-sans);
   text-transform: uppercase;
-  letter-spacing: 0.4em;
-  font-weight: 700;
-  font-size: 0.8rem;
+  letter-spacing: 0.22em;
+  font-weight: 600;
+  font-size: 0.75rem;
   display: block;
   margin-bottom: 20px;
 }
@@ -945,5 +949,6 @@
   border: none;
+  font-family: var(--font-sans);
   text-transform: uppercase;
-  letter-spacing: 0.3em;
-  font-weight: 700;
+  letter-spacing: 0.22em;
+  font-weight: 600;
+  font-size: 0.75rem;
   cursor: pointer;
@@ -992,3 +997,4 @@
 .footer-hours h4 {
-  letter-spacing: 0.3em;
+  font-family: var(--font-serif);
+  letter-spacing: 0.22em;
   margin-bottom: 20px;
@@ -1008,4 +1014,5 @@
   text-align: center;
   opacity: 0.3;
+  font-family: var(--font-sans);
   font-size: 0.7rem;
-  letter-spacing: 0.3em;
+  letter-spacing: 0.22em;
 }
```

---

### Target File 3: `src/main.ts`
**Location**: lines 87–93  
**Action**: Implement defensive runtime validation for font variables loaded from Firestore.

```diff
--- a/src/main.ts
+++ b/src/main.ts
@@ -87,6 +87,14 @@
           } else {
             if (item.key === 'font_title') {
-                document.documentElement.style.setProperty('--font-serif', item.content);
+                const allowedSerifs = ["'Cormorant Garamond', serif", "'Playfair Display', serif"];
+                const safeSerif = allowedSerifs.includes(item.content)
+                  ? item.content
+                  : "'Cormorant Garamond', 'Playfair Display', serif";
+                document.documentElement.style.setProperty('--font-serif', safeSerif);
             } else if (item.key === 'font_text') {
-                document.documentElement.style.setProperty('--font-sans', item.content);
+                const allowedSans = ["'Inter', sans-serif", "'Montserrat', sans-serif"];
+                const safeSans = allowedSans.includes(item.content)
+                  ? item.content
+                  : "'Inter', sans-serif";
+                document.documentElement.style.setProperty('--font-sans', safeSans);
             }
           }
```

---

### Target File 4: `src/experiencia.css`
**Location**: lines 7–8, 260–267  
**Action**: Harmonize font variables and standard tracking on primary CTA button.

```diff
--- a/src/experiencia.css
+++ b/src/experiencia.css
@@ -7,2 +7,2 @@
-    --font-title: 'Playfair Display', serif;
-    --font-body: 'Montserrat', sans-serif;
+    --font-title: 'Playfair Display', 'Cormorant Garamond', serif;
+    --font-body: 'Montserrat', 'Inter', sans-serif;
@@ -262,3 +262,3 @@
     font-size: 1rem;
-    letter-spacing: 1px;
+    letter-spacing: 0.20em;
     text-transform: uppercase;
```

---

### Target File 5: `experiencia.html`
**Location**: lines 39–58, 203  
**Action**: Clean up hardcoded inline fonts and harmonize mobile nav links to Geometric Sans with wide tracking.

```diff
--- a/experiencia.html
+++ b/experiencia.html
@@ -39,7 +39,7 @@
-                style="font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; color: #d4af37; display: flex; align-items: center; gap: 6px; letter-spacing: 2px;">
+                style="font-family: var(--font-title); font-size: 1.5rem; font-weight: 700; color: #d4af37; display: flex; align-items: center; gap: 6px; letter-spacing: 2px;">
                 <span>SABE</span>
-                <span style="font-size: 0.8em; font-weight: 400; font-family: 'Montserrat', sans-serif;">A</span>
+                <span style="font-size: 0.8em; font-weight: 400; font-family: var(--font-body);">A</span>
                 <span>PERÚ</span>
             </div>
             <div
-                style="font-family: 'Montserrat', sans-serif; font-size: 0.7rem; color: #a9a9a9; letter-spacing: 3px; text-transform: uppercase; margin-top:2px;">
+                style="font-family: var(--font-body); font-size: 0.7rem; color: #a9a9a9; letter-spacing: 0.22em; text-transform: uppercase; margin-top:2px;">
                 bar & restaurant
             </div>
@@ -55,4 +55,4 @@
-                <a href="/#inicio" style="color: white; text-decoration: none; font-family: 'Playfair Display', serif; font-size: 2rem;">Inicio</a>
-                <a href="/#experiencia" style="color: white; text-decoration: none; font-family: 'Playfair Display', serif; font-size: 2rem;">Experiencia</a>
-                <a href="/carta.html" style="color: white; text-decoration: none; font-family: 'Playfair Display', serif; font-size: 2rem;">La Carta</a>
-                <a href="/#reserva" style="color: white; text-decoration: none; font-family: 'Playfair Display', serif; font-size: 2rem;">Reservas</a>
+                <a href="/#inicio" style="color: white; text-decoration: none; font-family: var(--font-body); font-size: 1.2rem; text-transform: uppercase; letter-spacing: 0.22em;">Inicio</a>
+                <a href="/#experiencia" style="color: white; text-decoration: none; font-family: var(--font-body); font-size: 1.2rem; text-transform: uppercase; letter-spacing: 0.22em;">Experiencia</a>
+                <a href="/carta.html" style="color: white; text-decoration: none; font-family: var(--font-body); font-size: 1.2rem; text-transform: uppercase; letter-spacing: 0.22em;">La Carta</a>
+                <a href="/#reserva" style="color: white; text-decoration: none; font-family: var(--font-body); font-size: 1.2rem; text-transform: uppercase; letter-spacing: 0.22em;">Reservas</a>
@@ -203,1 +203,1 @@
-                <h3 style="font-family: 'Playfair Display', serif; color: #d4af37; font-size: 1.5rem; margin-bottom: 15px;">Sabe a Perú</h3>
+                <h3 style="font-family: var(--font-title); color: #d4af37; font-size: 1.5rem; margin-bottom: 15px;">Sabe a Perú</h3>
```

---

## 4. Build Safety & Verification Matrix

| Verification Item | Command / Check | Expected Result |
| :--- | :--- | :--- |
| TypeScript compilation | `npx tsc --noEmit` | Exit code 0, 0 type errors |
| Vite production build | `npx vite build` | Exit code 0, all chunks under budget |
| Pipeline script | `npm run pipeline` | Exit code 0, ~1.9s completion |
| Unit & Integration Tests | `npm test` | 119/119 tests passing (0 failures) |
| HTML size budget | `tests/tier5-m1-adversarial.test.mjs` (C5.5) | `admin.html` < 35 kB (reduced from 31.7 kB) |
| CSS bundle budget | `tests/tier5-m1-adversarial.test.mjs` (C5.3) | `style-*.css` < 35 kB raw, < 10 kB gzip |
| Zero Supabase leaks | `tests/tier5-m1-adversarial.test.mjs` (C3) | 0 occurrences in `src/` and `dist/` |
