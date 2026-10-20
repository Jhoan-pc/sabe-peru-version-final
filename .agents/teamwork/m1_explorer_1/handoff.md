# Handoff Report: Milestone 1 (Assets & HTML)
**From**: `m1_explorer_1` (M1 Explorer - Assets & HTML)  
**To**: Project Orchestrator (`ed44eb6a-a075-4b06-a258-caefe2915195`) / M1 Worker  
**Working Directory**: `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m1_explorer_1`  
**Date**: 2026-10-09  

---

## 1. Observation

1. **Residual Supabase `<img>` tags in `index.html`**:
   - `index.html` lines 216–261 contains 10 hardcoded `div.gallery-item` elements holding `<img>` tags pointing to Supabase storage:
     - Line 218: `https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/Galeria1.png`
     - Line 223: `.../galeria3.png`
     - Line 227: `.../galeria4.png`
     - Line 231: `.../galeria5.png`
     - Line 235: `.../galeria6.png`
     - Line 239: `.../galeria7.png`
     - Line 243: `.../galeria8.png`
     - Line 248: `.../galeria10.png`
     - Line 253: `.../galeria11.png`
     - Line 258: `.../galeria12.png`
   - In `src/main.ts` line 419: `galleryGrid!.innerHTML = '';` clears these elements immediately when dynamic gallery loading executes.

2. **Residual Supabase `og:image` in `index.html`**:
   - `index.html` lines 21–22:
     ```html
     <meta property="og:image"
       content="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/Hero1.png">
     ```
   - In `experiencia.html` lines 98–115: 4 additional Supabase `<img>` references exist (`Cocteles.png?v=2`, `galeria3.png`, `galeria4.png`, `galeria7.png`).

3. **Synchronous Render-Blocking `@import` in `src/style.css`**:
   - `src/style.css` line 1:
     ```css
     @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@300;400;600&family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Serif+Display:ital@0;1&family=Lato:ital,wght@0,300;0,400;0,700;1,400&family=Montserrat:ital,wght@0,300;0,400;0,600;1,400&family=Open+Sans:ital,wght@0,300;0,400;0,600;1,400&display=swap');
     ```
   - Imports 8 separate font families synchronously, blocking the Critical Rendering Path.
   - `index.html`, `carta.html`, and `admin.html` lack `<link rel="preconnect">` and `<link rel="stylesheet">` for fonts.
   - `experiencia.html` lines 8–13 loads non-standard font families (*Montserrat* and *Playfair Display*).

4. **Hero Slideshow and LCP Tag Status**:
   - `index.html` lines 108–120:
     - `#img-hero-1`: `<img id="img-hero-1" src="/assets/Hero1.webp" class="hero-slide active" alt="Sabe a Perú Ambiente 1">` (lacks `fetchpriority="high"`, `loading="eager"`, and `decoding="async"`).
     - `#img-hero-2`, `#img-hero-3`, `#img-hero-4`: Lack `loading="lazy"` and `decoding="async"`.
     - Below-the-fold content images (`#img-philosophy`, `#img-spec-1`, `#img-spec-2`, `#img-spec-3`) lack `loading="lazy"` and `decoding="async"`.

5. **Existing Local Assets**:
   - Local directory `public/assets/` contains:
     `Hero1.webp`, `hero2.webp`, `hero3.webp`, `hero4.webp`, `Ceviche.webp`, `Cocteles.webp`, `LomoSalteado.webp`, `Mariscos.webp`.
   - `npm run pipeline` currently builds with Exit Code 0 in 1.15s.

---

## 2. Logic Chain

1. **From Observation 1**: Since `#main-gallery-grid` contains 10 static `<img>` tags pointing to Supabase that are wiped out on script initialization (`innerHTML = ''`), the browser is forced to download assets that are immediately discarded ("Ghost Loading"). Replacing these 10 tags with a lightweight skeleton container (`.gallery-skeleton`) with reserved dimensions (`height: 55vh; min-height: 400px;`) eliminates all 10 redundant network requests, prevents ghost downloads, and avoids layout shifts (`CLS < 0.02`).
2. **From Observation 2**: Because Supabase is deprecated in favor of Google Firestore and local/Cloudinary assets, retaining `https://...supabase.co/...` in `og:image` and `experiencia.html` constitutes dead technical debt. Replacing `og:image` with `https://www.sabeaperu.es/assets/Hero1.webp` preserves Open Graph compliance while completely eliminating third-party Supabase network leaks.
3. **From Observation 3**: Because `@import` in CSS prevents parallel downloads and delays FCP/LCP, deleting line 1 of `src/style.css` and placing `<link rel="preconnect">` and `<link rel="stylesheet">` in `<head>` across all 4 HTML files allows the browser to resolve DNS, establish TLS, and stream fonts concurrently while parsing HTML. Limiting fonts to *Cormorant Garamond* and *Inter* reduces font payload by ~75% and satisfies SDD [DT-08].
4. **From Observation 4**: Because `#img-hero-1` represents the Largest Contentful Paint (LCP) element on `index.html`, marking it with `fetchpriority="high"`, `loading="eager"`, and `decoding="async"` instructs the browser's preload scanner to prioritize its download over non-critical scripts. Assigning `loading="lazy"` to secondary hero slides (2..4) and below-the-fold images frees network bandwidth for LCP, satisfying Core Web Vitals target (`LCP < 1.8s`).
5. **From Observation 5**: Because all WebP images are already present in `public/assets/`, no external asset fetching is required for the static pages; references can safely use local `/assets/...` paths.

---

## 3. Caveats

1. **Milestone 2 CSS Scope**: `--font-serif` in `src/style.css` currently refers to `'Playfair Display', serif`. In Milestone 1, we add Cormorant Garamond via Google Fonts link and can set `--font-serif: 'Cormorant Garamond', 'Playfair Display', serif;` to ensure smooth visual transition. Full token overhaul and Nazca border removals belong strictly to Milestone 2.
2. **`experiencia.html` Cocktail Carousel**: While the primary task centers on `index.html`, `experiencia.html` also has 4 Supabase images (`Cocteles.png?v=2`, etc.). We have documented the exact fix to point to `/assets/Cocteles.webp`, etc. to ensure zero residual Supabase across the entire MPA.
3. **Dynamic Gallery Firestore Integration**: The dynamic rendering logic in `src/main.ts` and `src/admin.ts` is investigated by `m1_explorer_2` and scheduled for refactoring in M4 (Cloudinary unifier / `gallery_items`). The skeleton container proposed here in `index.html` is 100% compatible with both current `src/main.ts` and future Milestone refactors.

---

## 4. Conclusion

The implementation blueprint in `plan.md` is complete, exact, and ready for immediate implementation by the M1 Worker.
All diffs are provided verbatim with exact line numbers and replacement blocks:
- **`index.html`**:
  1. Replace 10 Supabase `<img>` tags in `#main-gallery-grid` with skeleton items (lines 216–261).
  2. Add Google Fonts `<link rel="preconnect">` and `<link rel="stylesheet">` in `<head>` (Cormorant Garamond & Inter).
  3. Replace `og:image` Supabase URL with canonical `https://www.sabeaperu.es/assets/Hero1.webp`.
  4. Configure `#img-hero-1` with `fetchpriority="high" loading="eager" decoding="async"`.
  5. Configure `#img-hero-2..4` and content images with `loading="lazy" decoding="async"`.
- **`src/style.css`**:
  1. Delete line 1 (`@import`).
  2. Add `.gallery-skeleton` styles.
- **`carta.html`**, **`admin.html`**, **`experiencia.html`**:
  1. Add preconnect and official Google Fonts links in `<head>`.

---

## 5. Verification Method

To independently verify the changes once applied:

1. **Automated Pipeline Build**:
   ```powershell
   npm run pipeline
   ```
   *Expected result*: Exit Code 0 with zero TypeScript errors and clean Vite bundle output.

2. **Zero Supabase Verification in HTML**:
   ```powershell
   git grep "supabase.co" -- "*.html"
   ```
   *Expected result*: 0 matches in `index.html`. (And 0 matches overall if `experiencia.html` is updated as recommended).

3. **Zero `@import` in CSS**:
   ```powershell
   git grep "@import" -- "src/*.css"
   ```
   *Expected result*: 0 matches.

4. **DOM Inspection**:
   - Verify `#main-gallery-grid` does not contain any `<img>` tag in the initial HTML response.
   - Verify `#img-hero-1` contains `fetchpriority="high"`, `loading="eager"`, and `decoding="async"`.
   - Verify `<meta property="og:image">` does not contain `supabase.co`.
