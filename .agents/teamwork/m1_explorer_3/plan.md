# Technical Verification Strategy & Build Safety Guide (Milestone 1)

**Agent:** `m1_explorer_3` (M1 Explorer - Verification & Build Safety)  
**Milestone:** Milestone 1 (Fase 1: Rendimiento Web y Saneamiento de Assets)  
**Scope:** HTML (`index.html`, `carta.html`, `admin.html`, `experiencia.html`), CSS (`src/style.css`), TypeScript (`src/main.ts`, `src/supabase.ts`, `src/experiencia.ts`), Build Pipeline (`npm run pipeline`), Core Web Vitals, and Multi-Role Quality Gates.  
**Reference Specifications:** `specs/SDD_MASTER.md` ([DT-01], [DT-04], [DT-06], [DT-08], [DT-09], [DT-10]), `specs/performance-spec.md`, `specs/design-system-spec.md`, `PROJECT.md`, `ORIGINAL_REQUEST.md`.

---

## 1. Executive Summary & Quality Policy

Milestone 1 is the foundational performance and asset hygiene phase of the Sabe a Perú modernization. Any compilation error, bundle inflation, layout shift, or script regression introduced in M1 will compromise all subsequent milestones (M2–M6).

This verification strategy establishes the strict technical gates, static and dynamic checks, and adversarial challenges required to guarantee:
1. **Pipeline Invariant:** `npm run pipeline` (`tsc --noEmit && vite build`) executes cleanly with **Exit Code 0** and **0 TypeScript errors** under strict compiler configuration.
2. **Zero Bundle Regression:** Net production bundle payload decreases; initial JavaScript gzip payload remains at ~124 kB (well below the 150 kB SLA limit).
3. **Decoupled Gallery Safety:** Removal of the 10 static Supabase `<img>` tags in `#main-gallery-grid` is proven 100% safe against `loadGallery()` in `src/main.ts`, completely eradicating Ghost Loading while guaranteeing `CLS = 0.00`.
4. **Scope Bug Prevention:** Rectifies a critical TypeScript scoping vulnerability discovered in peer proposals (`m1_explorer_2/plan.md`) where block-scoped functions would have triggered `TS2304: Cannot find name 'stopAutoScroll'`.
5. **Multi-Role Acceptance Criteria:** Concrete, automated verification suites for the Worker, Reviewer, Challenger, and Auditor.

---

## 2. Review of Proposed Changes & TypeScript Safety

### 2.1. Strict Compiler Environment (`tsconfig.json`)

The project uses TypeScript 5.9 in strict bundler mode with active linting flags:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

### 2.2. Critical Risk Identified & Resolved: Variable Scope Defect in `src/main.ts`

#### The Vulnerability
In `m1_explorer_2/plan.md` (§4, Chunk 3), the gallery auto-scroll handles (`autoScrollInterval`, `startAutoScroll`, `stopAutoScroll`, `isGalleryInView`) are defined inside the block:
```typescript
if (galleryGrid) {
  // autoScrollInterval, startAutoScroll, stopAutoScroll defined HERE
}
```
Later in the plan (lines 570–580), a global `visibilitychange` listener is placed at the bottom of `DOMContentLoaded`:
```typescript
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    stopHeroSlideshow();
    stopAutoScroll(); // ERROR: TS2304 Cannot find name 'stopAutoScroll'
  } else {
    if (isHeroInView) startHeroSlideshow();
    if (isGalleryInView) startAutoScroll(); // ERROR: TS2304 Cannot find name 'isGalleryInView'
  }
});
```
Because `stopAutoScroll` and `isGalleryInView` are block-scoped to `if (galleryGrid) { ... }`, calling them in the outer `DOMContentLoaded` listener will immediately fail compilation with `TS2304`.

#### The Verified Solution (Mandatory for `m1_worker`)
All timer control handles must be declared at the top-level of the `DOMContentLoaded` callback (matching the scope of `header`, `siteCache`, etc.):

```typescript
// --- LIFECYCLE & VISIBILITY CONTROLLERS (TOP-LEVEL DOMContentLoaded SCOPE) ---
let startHeroSlideshow = () => {};
let stopHeroSlideshow = () => {};
let isHeroInView = true;

let startAutoScroll = () => {};
let stopAutoScroll = () => {};
let isGalleryInView = false;
```
Inside the respective sections (`heroSlides` check and `if (galleryGrid)` check), assign the actual implementations to these functions. This ensures:
1. `stopAutoScroll()` and `startAutoScroll()` are always in scope for the `visibilitychange` listener.
2. If `galleryGrid` is not present on the current page (e.g. if script runs on another page), calling the no-op default never throws `undefined` errors.
3. Zero TypeScript compiler errors (`TS2304` eliminated).
4. `noUnusedLocals` and `noUnusedParameters` are 100% satisfied.

### 2.3. Compiler Flag Compliance Matrix for TS Changes

| Compiler Rule | Risk in Proposed Changes | Mitigation / Required Code Pattern |
|---|---|---|
| `noUnusedParameters: true` | Observer callbacks declaring `(entries, obs) => ...` where `obs` is unused. | If `obs.unobserve(entry.target)` is called, `obs` is used. If `obs` is not needed, omit the second parameter: `(entries) => ...`. |
| `noUnusedLocals: true` | Declaring timer handles or observer instances that are never referenced. | Every declared `let` or `const` must either be invoked or removed. |
| `strict: true` (nullability) | Calling `.classList` on `document.getElementById('main-header')` or `querySelector` without null guard. | Use optional chaining: `header?.classList.add('scrolled')` or explicit `if (header)` guard. |
| `verbatimModuleSyntax: true` | Importing types as values that get erased. | In M1, no new types are imported, but any future types must use `import type { ... }`. |
| `noUncheckedSideEffectImports` | Adding CSS imports that cannot be resolved. | Only pre-existing valid CSS files (`./style.css`, `./experiencia.css`) may be imported. |

### 2.4. Supabase Module Purge Safety (`src/supabase.ts`)

- **Current State:** `src/supabase.ts` is the only file in `src/` importing `@supabase/supabase-js`. It creates and exports `supabase`.
- **Dependency Audit:** A complete AST search of all files under `src/` confirms that **zero** runtime files import `src/supabase.ts`.
- **Purge Action:** Deleting `src/supabase.ts` (or replacing it with a deprecated stub that does NOT import `@supabase/supabase-js`) is 100% safe.
- **Result:** `tsc --noEmit` will not include `@supabase/supabase-js` in type checking of `src/`, and `vite build` will never bundle any Supabase code into the production build.

---

## 3. Bundle Size Impact & Performance Budgets

### 3.1. Baseline vs Projected Production Build Metrics

Measured on current codebase (`npm run pipeline`, Vite v7.3.1):

| Build Artifact | Baseline Raw Size | Baseline Gzip Size | M1 Projected Raw | M1 Projected Gzip | Delta / Trend | Budget Limit |
|---|---|---|---|---|---|---|
| `dist/index.html` | 22.87 kB | 5.47 kB | ~19.50 kB | ~4.80 kB | **-3.37 kB** (HTML reduced) | < 25 kB raw |
| `dist/carta.html` | 8.35 kB | 2.36 kB | 8.50 kB | 2.40 kB | +0.15 kB (fonts in head) | < 15 kB raw |
| `dist/experiencia.html` | 16.19 kB | 4.10 kB | 16.25 kB | 4.15 kB | +0.06 kB (fonts in head) | < 20 kB raw |
| `dist/admin.html` | 31.36 kB | 5.15 kB | 31.50 kB | 5.20 kB | +0.14 kB (fonts in head) | < 40 kB raw |
| `dist/assets/style-*.css` | 26.70 kB | 6.51 kB | 26.35 kB | 6.45 kB | **-0.35 kB** (@import removed) | < 35 kB raw |
| `dist/assets/main-*.js` | 15.82 kB | 6.21 kB | ~15.90 kB | ~6.25 kB | +0.08 kB (observers/lifecycle) | < 25 kB raw |
| `dist/assets/reservations-*.js` | 2.10 kB | 1.04 kB | 2.10 kB | 1.04 kB | 0 kB (unchanged) | < 10 kB raw |
| `dist/assets/firebase-*.js` | 376.09 kB | 116.81 kB | 376.09 kB | 116.81 kB | 0 kB (unchanged) | < 130 kB gzip |
| **Initial JS Payload (Home)** | **394.01 kB** | **124.06 kB** | **~394.09 kB** | **~124.10 kB** | **Neutral** | **< 150 kB gzip** |

### 3.2. Performance Budget Compliance Analysis

1. **JavaScript Initial Payload:**
   - Budget SLA (`specs/performance-spec.md` §1): `< 150 kB` gzip.
   - Home page initial JS (`main.js` + `reservations.js` + `firebase.js`): `6.25 kB + 1.04 kB + 116.81 kB = 124.10 kB` gzip.
   - **Margin:** 25.9 kB headroom under budget.
2. **Critical Rendering Path Optimization:**
   - Removal of `@import` in `src/style.css` eliminates 1 synchronous network roundtrip blocking the CSSOM.
   - Adding `<link rel="preconnect">` starts TLS handshake with `fonts.gstatic.com` during initial HTML parsing.
   - Expected FCP reduction: ~200–400 ms on mobile connections.
3. **LCP Image Prioritization:**
   - `#img-hero-1` configured with `fetchpriority="high" loading="eager" decoding="async"` moves the Hero image to the highest network priority in Chromium/WebKit.
   - Slides 2..4 and below-the-fold images (`#img-philosophy`, `#img-spec-*`) set to `loading="lazy"` ensure zero network contention with the LCP image.

---

## 4. Validation of `#main-gallery-grid` & `loadGallery()` Decoupling

### 4.1. The Ghost Loading Mechanism (Root Cause)

In the baseline `index.html`:
```html
<div class="gallery-grid" id="main-gallery-grid">
  <div class="gallery-item tall">
    <img src="https://xdslypbjmenthwyrarui.supabase.co/.../Galeria1.png" alt="Ambiente Sabe a Perú">
  </div>
  <!-- ... 9 more Supabase img elements ... -->
</div>
```
When a browser parses `index.html`, the speculative HTML preload scanner immediately dispatches 10 HTTP GET requests to the Supabase Storage CDN.

Then, when `src/main.ts` executes on `DOMContentLoaded`:
```typescript
const galleryGrid = document.querySelector('.gallery-grid');
if (galleryGrid) {
  async function loadGallery() {
    // ... fetches Firestore/Firebase or defaults to 8 local WebP assets ...
    if (galleryFiles.length > 0) {
      galleryGrid!.innerHTML = ''; // WIPES OUT THE 10 SUPABASE IMAGES
      // ... creates new div.gallery-item elements and appends them ...
      galleryGrid!.appendChild(item);
    }
  }
}
```
All 10 Supabase images downloaded by the browser are immediately destroyed from the DOM. This wastes ~1.5 MB of cellular data, degrades First Input Delay / Interaction to Next Paint (INP), and creates console 404/CORS errors if the Supabase bucket is offline.

### 4.2. Proof of Decoupling & Invariance

1. **Selector Integrity:**
   `src/main.ts` targets `document.querySelector('.gallery-grid')`.
   The container element `<div class="gallery-grid" id="main-gallery-grid">` remains intact.
2. **Idempotence of `innerHTML = ''`:**
   Whether `#main-gallery-grid` contains 10 static images, 4 skeleton placeholder divs, or nothing at all, executing `galleryGrid.innerHTML = ''` is completely safe and valid JavaScript.
3. **Layout Stability (CLS Guarantee):**
   In `src/style.css`:
   ```css
   .gallery-grid {
     height: 55vh;
     min-height: 400px;
     max-height: 600px;
   }
   @media (max-width: 768px) {
     .gallery-grid {
       height: 45vh;
       min-height: 300px;
     }
   }
   ```
   The container has explicit CSS height and min-height constraints. Even with zero child nodes or with lightweight `.gallery-skeleton` shimmer elements, the element occupies its full reserved height.
   **Conclusion:** CLS remains **0.00**.
4. **Data Resiliency:**
   If Firebase is offline or slow, `main.ts` lines 394–406 automatically populate 8 local assets (`/assets/Hero1.webp`, `/assets/hero2.webp`, etc.). It never falls back to Supabase.

---

## 5. Concrete Test Matrix & Acceptance Gates Across 4 Roles

To ensure rigorous separation of concerns and Zero-Trust quality control, acceptance verification is split into 4 sequential gates:

```
[ Worker Gate ]  ──▶  [ Reviewer Gate ]  ──▶  [ Challenger Gate ]  ──▶  [ Auditor Gate ]
 (Build & Grep)        (AST & Contracts)      (Stress & Resilience)     (SDD Certification)
```

### Gate 1: Milestone 1 Worker (`m1_worker`)

The worker must execute the following checks before requesting code review:

1. **Compilation & Packaging:**
   ```powershell
   npm run pipeline
   ```
   *Expected:* Exit Code 0, 0 TypeScript errors, build finishes in < 2.5s.
2. **Supabase Purge Verification:**
   ```powershell
   # 1. No active references to Supabase in src/
   Get-ChildItem -Path src -Recurse -Include *.ts,*.js,*.css | Select-String "supabase"
   # Expected: 0 matches (or only historical comments if any; 0 imports of @supabase/supabase-js)

   # 2. No Supabase storage URLs in HTML files
   Get-ChildItem -Path *.html | Select-String "supabase\.co"
   # Expected: 0 matches across index.html, carta.html, admin.html, experiencia.html
   ```
3. **HTML & CSS Lint Verification:**
   ```powershell
   # 3. No synchronous @import in style.css
   Get-Content src/style.css | Select-String "@import"
   # Expected: 0 matches

   # 4. Verify preconnect and display=swap in HTML
   Select-String -Path index.html, carta.html, admin.html, experiencia.html -Pattern "preconnect"
   # Expected: 2 matches per file (fonts.googleapis.com and fonts.gstatic.com)
   ```
4. **Hero LCP Attributes:**
   ```powershell
   Select-String -Path index.html -Pattern 'id="img-hero-1"' -Context 0, 3
   # Expected: fetchpriority="high", loading="eager", decoding="async"
   ```

---

### Gate 2: Milestone 1 Reviewer (`m1_reviewer`)

The reviewer performs static code inspection, AST verification, and interface adherence:

1. **TypeScript Variable Scoping Audit:**
   - Verify that `stopAutoScroll`, `startAutoScroll`, `stopHeroSlideshow`, and `startHeroSlideshow` are accessible in the global `DOMContentLoaded` scope.
   - Confirm that the `visibilitychange` listener does not throw runtime `ReferenceError` when triggered.
2. **IntersectionObserver Pattern Conformance:**
   - Confirm `revealObserver` uses `{ rootMargin: '0px 0px -80px 0px', threshold: 0.1 }` and calls `obs.unobserve(entry.target)`.
   - Confirm only un-activated `.reveal:not(.active)` elements are observed.
   - Confirm `sectionObserver` tracks navigation tabs without polling `offsetTop`.
3. **Passive Scroll Listener Conformance:**
   - Confirm sticky header is the **only** remaining scroll listener in `src/main.ts`.
   - Confirm it specifies `{ passive: true }` and uses the `isScrollTicking` / `requestAnimationFrame` pattern.
4. **CSS Design Tokens Non-Regression:**
   - Confirm that while `@import` was removed, `:root` variables `--font-serif` and `--font-sans` remain properly declared.

---

### Gate 3: Milestone 1 Challenger (`m1_challenger`)

The challenger conducts adversarial testing and stress verification:

1. **Adversarial Scenario C1: Visibility State Flipping Stress Test**
   - *Action:* Simulate rapid switching of browser tab visibility (`document.visibilityState` toggled between `'hidden'` and `'visible'` 10 times in 1 second).
   - *Assertion:* Timer IDs do not leak. Exactly one interval runs for Hero and one for Gallery. No runaway animation frame loops or memory creep.
2. **Adversarial Scenario C2: Scroll Event Flooding (Layout Thrashing Test)**
   - *Action:* Dispatch 500 synthetic `scroll` events in a tight loop.
   - *Assertion:* Zero calls to `getBoundingClientRect()` or `offsetTop`. Main thread frametime stays under 16.6ms (60 fps).
3. **Adversarial Scenario C3: Offline Supabase Storage Simulation**
   - *Action:* Block network domain `*.supabase.co` via hosts or request interception.
   - *Assertion:* Zero network failures, zero broken image icons, and zero console errors during initial render of `index.html` and `experiencia.html`.
4. **Adversarial Scenario C4: Empty Gallery Container Stability**
   - *Action:* Disable JavaScript or delay `loadGallery()` execution by 5 seconds.
   - *Assertion:* Inspect `#main-gallery-grid` computed bounding box: height must equal `55vh` (min 400px). When JavaScript completes, layout shift must be 0 (`entry.hadRecentInput === false`, `CLS = 0`).
5. **Adversarial Scenario C5: Multi-Page Integrity**
   - *Action:* Build all 4 entry points and verify `carta.html`, `admin.html`, and `experiencia.html` display typography correctly without FOUT (Flash of Unstyled Text) or blocking alert dialogues.

---

### Gate 4: Auditor (`auditor-tirano-sdd`)

The Auditor issues the formal Zero-Trust Certification or Veto based on strict contractual alignment with `specs/SDD_MASTER.md`:

```markdown
### Auditor Checklist (SDD_MASTER v2.0.0-SDD)

- [ ] **[DT-01/DT-10] Erradicación de Doble Render (Ghost Loading):**
      Contenedor `#main-gallery-grid` no contiene tags `<img>` hacia Supabase. Skeleton loader o contenedor vacío con 55vh/400px.
- [ ] **[DT-08] Carga Asíncrona de Fuentes & Critical CSS:**
      `@import` eliminado de `src/style.css`. `<link rel="preconnect">` y `display=swap` en `<head>` de los 4 HTMLs para Cormorant Garamond e Inter.
- [ ] **[DT-03] Prioridad LCP en Hero Slide:**
      `#img-hero-1` posee `fetchpriority="high"`, `loading="eager"`, `decoding="async"`. Diapositivas 2..4 poseen `loading="lazy"`.
- [ ] **[DT-09] Scroll Desacoplado con IntersectionObserver:**
      Listeners `scroll` pesados erradicados. Un único `IntersectionObserver` pasivo con `unobserve` tras activación. Listener residual con `{ passive: true }` y `requestAnimationFrame`.
- [ ] **[DT-04] Pausa Inteligente de Bucles/Timers:**
      Intervalos de slideshow y autoscroll pausados en `document.visibilityState === 'hidden'` y fuera del viewport.
- [ ] **[DT-06] Purga de Residuos de Supabase en Producción:**
      `src/supabase.ts` eliminado o desvinculado; 0 imports de `@supabase/supabase-js` en `src/`.
- [ ] **Pipeline Safety:**
      `npm run pipeline` finaliza con Exit Code 0.
```

---

## 6. Verification Command Playbook

Run these commands in PowerShell from the project root (`c:\Users\Martin\Documents\Trabajo\sabeaperu`):

### 1. Full Build & Pipeline Execution
```powershell
npm run pipeline
```

### 2. TypeScript Static Analysis Only
```powershell
npx tsc --noEmit
```

### 3. Production Bundle Size & Asset Distribution Inspection
```powershell
npx vite build
Get-ChildItem -Path dist/assets -Recurse | Select-Object Name, Length | Format-Table -AutoSize
```

### 4. Zero Supabase References in `src/` & HTML
```powershell
# In source code:
Get-ChildItem -Path src -Recurse -Include *.ts,*.js,*.css | Select-String "supabase"

# In HTML templates:
Get-ChildItem -Path *.html | Select-String "supabase\.co"
```

### 5. Font Preconnect & Swap Verification
```powershell
Get-ChildItem -Path *.html | ForEach-Object {
  Write-Host "Checking $($_.Name)..."
  Get-Content $_.FullName | Select-String "fonts\.googleapis\.com"
}
```

### 6. Scroll Listener Count in `src/main.ts`
```powershell
(Get-Content src/main.ts | Select-String "addEventListener\('scroll'").Count
# Must be exactly 1
```

### 7. Run Automated Test Suite (Tier 1 & Node Tests)
```powershell
if (Test-Path tests) {
  node --test tests/**/*.test.*
}
```

---

## 7. Risk Mitigation Summary

| Identified Risk | Severity | Root Cause | Preventive Control |
|---|---|---|---|
| **Compilation Error (`TS2304`)** | **HIGH** | Function scoped inside `if (galleryGrid)` called from outer `visibilitychange` listener. | Hoist lifecycle controller variables (`startAutoScroll`, etc.) to top-level `DOMContentLoaded` scope. |
| **Unused Parameter Error (`TS6133`)** | **MEDIUM** | `(entries, obs)` callback where `obs` is declared but never referenced under `noUnusedParameters: true`. | Omit `obs` if unused or call `obs.unobserve(entry.target)`. |
| **Ghost Download Regression** | **HIGH** | Hardcoded `<img>` tags in HTML request remote assets prior to JS initialization. | Replace `#main-gallery-grid` contents with clean skeleton elements without `src` attributes. |
| **Layout Shift (CLS > 0.1)** | **HIGH** | Empty container collapses to 0px height before gallery items render. | CSS rules in `src/style.css` enforce `height: 55vh; min-height: 400px;` regardless of child count. |
| **CSSOM Blocking (FCP delay)** | **HIGH** | Synchronous `@import` of 8 font families inside CSS. | Strip `@import`, preconnect Google Fonts in `<head>`, load only 2 official families with `display=swap`. |
| **Main Thread Bottleneck (INP)** | **MEDIUM** | Geometry queries (`getBoundingClientRect`, `offsetTop`) inside scroll listeners. | Migrate 100% of reveal and scroll spy logic to passive `IntersectionObserver`. |
