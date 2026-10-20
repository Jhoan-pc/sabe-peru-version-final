# Technical Implementation Blueprint: Milestone 1 (Assets & HTML)
**Subagent**: `m1_explorer_1`  
**Milestone**: Milestone 1 (Fase 1: Rendimiento Web y Saneamiento de Assets)  
**Target Files**: `index.html`, `carta.html`, `admin.html`, `experiencia.html`, `src/style.css`  
**Reference Specs**: `specs/SDD_MASTER.md` [DT-01, DT-03, DT-08, DT-10], `specs/performance-spec.md`, `specs/design-system-spec.md`  

---

## 1. Executive Summary & Problem Scope

This blueprint defines the exact code modifications required for Milestone 1 regarding HTML documents and asset delivery:
1. **[DT-10 / Ghost Loading]**: Eliminating the 10 static `<img>` tags pointing to Supabase in `#main-gallery-grid` inside `index.html`. Replacing them with a layout-preserving skeleton structure (`height: 55vh; min-height: 400px;`) that eliminates double rendering and guarantees `CLS = 0.00`.
2. **[DT-08 / Render-Blocking Fonts]**: Removing the synchronous, blocking `@import` statement of 8 font families from `src/style.css`. Replacing it with asynchronous, preconnected `<link>` tags in the `<head>` of all 4 HTML files (`index.html`, `carta.html`, `admin.html`, `experiencia.html`), restricted exclusively to the 2 official Quiet Luxury typography families (*Cormorant Garamond* and *Inter*) with `display=swap`.
3. **[DT-03 / LCP Image Priority]**: Configuring `#img-hero-1` in `index.html` with `fetchpriority="high"`, `loading="eager"`, and `decoding="async"`, while setting `loading="lazy"` and `decoding="async"` on slides 2..4 and all below-the-fold content images.
4. **[Supabase Asset Purge in Metadata]**: Eradicating the dead Supabase URL in `<meta property="og:image">` in `index.html` and providing clean canonical fallback. Documenting and resolving residual Supabase images in `experiencia.html`.

---

## 2. Detailed Technical Plan & Exact File Diffs

### Item 1: Eradication of 10 Residual Supabase `<img>` in `#main-gallery-grid` (`index.html`)

#### Problem Analysis
In `index.html` (lines 216-261), 10 `div.gallery-item` elements contain hardcoded `<img>` tags requesting images from `https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/`.
When the page loads, the browser immediately requests these 10 remote assets. Then, JavaScript (`src/main.ts`) runs `loadGallery()`, clears the container (`galleryGrid.innerHTML = ''`), and mounts Firestore or fallback assets.
This causes:
- 10 unnecessary HTTP requests (wasted bandwidth & mobile network latency).
- Forced reflow and DOM destruction.
- Cumulative Layout Shift (CLS) if dimensions mismatch.

#### Implementation Target: `index.html`
**Location**: lines 216–261

**BEFORE**:
```html
        <div class="gallery-grid" id="main-gallery-grid">
          <div class="gallery-item tall">
            <img src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/Galeria1.png"
              alt="Ambiente Sabe a Perú">
          </div>

          <div class="gallery-item">
            <img src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/galeria3.png"
              alt="Cóctel">
          </div>
          <div class="gallery-item wide">
            <img src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/galeria4.png"
              alt="Preparación">
          </div>
          <div class="gallery-item">
            <img src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/galeria5.png"
              alt="Postre">
          </div>
          <div class="gallery-item">
            <img src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/galeria6.png"
              alt="Galería 6">
          </div>
          <div class="gallery-item">
            <img src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/galeria7.png"
              alt="Galería 7">
          </div>
          <div class="gallery-item">
            <img src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/galeria8.png"
              alt="Galería 8">
          </div>
          <div class="gallery-item">
            <img
              src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/galeria10.png"
              alt="Galería 10">
          </div>
          <div class="gallery-item">
            <img
              src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/galeria11.png"
              alt="Galería 11">
          </div>
          <div class="gallery-item">
            <img
              src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/galeria12.png"
              alt="Galería 12">
          </div>
        </div>
```

**AFTER**:
```html
        <div class="gallery-grid" id="main-gallery-grid" aria-label="Galería gastronómica" role="region">
          <!-- Contenedor con dimensiones reservadas para erradicar CLS y descargas fantasma -->
          <div class="gallery-item tall gallery-skeleton" aria-hidden="true"></div>
          <div class="gallery-item gallery-skeleton" aria-hidden="true"></div>
          <div class="gallery-item wide gallery-skeleton" aria-hidden="true"></div>
          <div class="gallery-item gallery-skeleton" aria-hidden="true"></div>
        </div>
```

#### CSS Alignment: `src/style.css`
In `src/style.css`, `.gallery-grid` already defines:
```css
.gallery-grid {
  height: 55vh;
  min-height: 400px;
  max-height: 600px;
  ...
}
```
Add `.gallery-skeleton` support to provide a Quiet Luxury dark shimmer effect:
```css
/* Skeleton Loader para Galería (Zero CLS) */
.gallery-item.gallery-skeleton {
  background: linear-gradient(90deg, #141414 25%, #1a1a1a 50%, #141414 75%);
  background-size: 200% 100%;
  animation: gallery-skeleton-pulse 2s ease-in-out infinite;
}

@keyframes gallery-skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

### Item 2: Eradication of Synchronous `@import` & Font Preconnect in `<head>`

#### Problem Analysis
`src/style.css` line 1 contains:
```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@300;400;600&family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Serif+Display:ital@0;1&family=Lato:ital,wght@0,300;0,400;0,700;1,400&family=Montserrat:ital,wght@0,300;0,400;0,600;1,400&family=Open+Sans:ital,wght@0,300;0,400;0,600;1,400&display=swap');
```
This causes:
1. Critical Rendering Path blockage: Browser cannot fetch fonts until `style.css` is parsed.
2. 8 font families loaded simultaneously, adding over 200 kB of font data.
3. Violation of SDD constraint: Only 2 official typography families allowed (*Cormorant Garamond* and *Inter*).

#### A. Modification in `src/style.css`
**Location**: Line 1
**Change**: Delete line 1 completely.
**Ensure CSS variables in `:root`** match the loaded families with graceful fallback:
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

#### B. Modification in `index.html`
**Location**: `<head>` (insert before `<link rel="stylesheet" href="/src/style.css">`)
```html
  <!-- Preconexión temprana a Google Fonts (Cormorant Garamond & Inter) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;600&display=swap">
```

#### C. Modification in `carta.html`
**Location**: `<head>` (insert before `<link rel="stylesheet" href="/src/style.css">`, lines 12–13)
```html
  <!-- Preconexión temprana a Google Fonts (Cormorant Garamond & Inter) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;600&display=swap">
  <link rel="stylesheet" href="/src/style.css">
```

#### D. Modification in `admin.html`
**Location**: `<head>` (insert before `<link rel="stylesheet" href="/src/style.css">`, lines 7–8)
```html
  <!-- Preconexión temprana a Google Fonts (Cormorant Garamond & Inter) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;600&display=swap">
  <link rel="stylesheet" href="/src/style.css">
```

#### E. Modification in `experiencia.html`
**Location**: `<head>` lines 8–14
**BEFORE**:
```html
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="/src/experiencia.css">
```
**AFTER**:
```html
    <!-- Google Fonts: Preconexión temprana y familias oficiales (Quiet Luxury) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;600&display=swap">
    <link rel="stylesheet" href="/src/experiencia.css">
```

---

### Item 3: Configuration of Hero LCP and Lazy Images (`index.html`)

#### Problem Analysis
In `index.html` (lines 108–120), `#img-hero-1` lacks `fetchpriority="high"`, `loading="eager"`, and `decoding="async"`. Furthermore, subsequent hero slides (`#img-hero-2`, `#img-hero-3`, `#img-hero-4`) and below-the-fold content images (`#img-philosophy`, `#img-spec-1`, `#img-spec-2`, `#img-spec-3`) lack explicit `loading="lazy"` and `decoding="async"`.

#### Implementation Target: Hero Slideshow (`index.html`)
**Location**: Lines 107–120
**BEFORE**:
```html
      <div class="hero-slideshow">
        <img id="img-hero-1"
          src="/assets/Hero1.webp"
          class="hero-slide active" alt="Sabe a Perú Ambiente 1">
        <img id="img-hero-2"
          src="/assets/hero2.webp"
          class="hero-slide" alt="Sabe a Perú Ambiente 2">
        <img id="img-hero-3"
          src="/assets/hero3.webp"
          class="hero-slide" alt="Sabe a Perú Platos">
        <img id="img-hero-4"
          src="/assets/hero4.webp"
          class="hero-slide" alt="Sabe a Perú Detalle">
      </div>
```

**AFTER**:
```html
      <div class="hero-slideshow">
        <img id="img-hero-1"
          src="/assets/Hero1.webp"
          class="hero-slide active"
          alt="Sabe a Perú Ambiente 1"
          fetchpriority="high"
          loading="eager"
          decoding="async">
        <img id="img-hero-2"
          src="/assets/hero2.webp"
          class="hero-slide"
          alt="Sabe a Perú Ambiente 2"
          loading="lazy"
          decoding="async">
        <img id="img-hero-3"
          src="/assets/hero3.webp"
          class="hero-slide"
          alt="Sabe a Perú Platos"
          loading="lazy"
          decoding="async">
        <img id="img-hero-4"
          src="/assets/hero4.webp"
          class="hero-slide"
          alt="Sabe a Perú Detalle"
          loading="lazy"
          decoding="async">
      </div>
```

#### Below-the-Fold Content Images in `index.html`:
1. **Philosophy Image** (Line 146):
```html
<img id="img-philosophy"
  src="/assets/Ceviche.webp"
  alt="Plato de autor Sabe a Perú"
  loading="lazy"
  decoding="async">
```
2. **Specialties Images** (Lines 169, 176, 196):
```html
<img id="img-spec-1"
  src="/assets/Mariscos.webp"
  alt="Pescados"
  loading="lazy"
  decoding="async">

<img id="img-spec-2"
  src="/assets/LomoSalteado.webp"
  alt="Carnes"
  loading="lazy"
  decoding="async">

<img id="img-spec-3"
  src="/assets/Cocteles.webp"
  alt="Cócteles"
  loading="lazy"
  decoding="async">
```

---

### Item 4: Removal of Supabase `og:image` & Residual Cleanup

#### A. Open Graph Image in `index.html`
**Location**: Lines 21–22
**BEFORE**:
```html
  <meta property="og:image"
    content="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/Hero1.png">
```
**AFTER**:
```html
  <meta property="og:image" content="https://www.sabeaperu.es/assets/Hero1.webp">
  <meta property="og:image:alt" content="Sabe a Perú - Restaurante de Alta Gastronomía Peruana en Oviedo">
```

#### B. Additional Hygiene Finding: Supabase Images in `experiencia.html`
**Location**: `experiencia.html` lines 97–116
Lines 98, 103, 108, 113 contain:
- `https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/Cocteles.png?v=2`
- `.../galeria3.png`
- `.../galeria4.png`
- `.../galeria7.png`
**Actionable Recommendation**:
Replace with local WebP assets present in `/assets/`:
- `id="exp-gallery-1"` -> `src="/assets/Cocteles.webp"`
- `id="exp-gallery-2"` -> `src="/assets/hero3.webp"`
- `id="exp-gallery-3"` -> `src="/assets/hero4.webp"`
- `id="exp-gallery-4"` -> `src="/assets/Hero1.webp"`
Each configured with `loading="lazy" decoding="async"`.

---

## 3. Verification & Safety Constraints

1. **Compilation Check**:
   Run `npm run pipeline` (`tsc --noEmit && vite build`).
   Must exit with code 0 without errors or missing asset warnings.
2. **Supabase Zero-Reference in HTML**:
   Execute grep search across `*.html` files for `supabase.co`.
   Expected count in `index.html`: **0**.
3. **Ghost Downloads Check**:
   Inspect Network tab during page load of `index.html`.
   No requests initiated to `restaurante-assets` or dead storage.
4. **LCP Priority Check**:
   First resource image requested must be `/assets/Hero1.webp` with Priority: High.
5. **Layout Shift (CLS)**:
   Verify `#main-gallery-grid` maintains height without jitter when JavaScript loads.
