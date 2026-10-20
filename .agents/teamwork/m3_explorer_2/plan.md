# Implementation Blueprint: TypeScript Carta Logic & Emoji Eradication (Milestone 3)

**Author:** `m3_explorer_2` (TypeScript Carta Logic & Emoji Eradication Explorer)  
**Target File:** `src/main.ts`  
**Related Files Audited:** `carta.html`, `src/style.css`, `specs/openapi.yaml`, `specs/design-system-spec.md`, `specs/SDD_MASTER.md`  
**Date:** 2026-10-13  
**Status:** Approved Architectural Blueprint (Ready for Implementation)

---

## 1. Executive Summary & Problem Scope

Under Milestone 3 (Fase 3: Lógica TypeScript de Carta y Alérgenos), the digital menu logic in `src/main.ts` requires complete refactoring to eliminate technical debt ([DT-02], [DT-03], [DT-07], [DT-09]) and conform to the 3-Michelin-Star Quiet Luxury specification:

1. **Emoji Eradication**: Complete elimination of hardcoded emojis (`🐟`, `🦐`, `🥩`, `🍗`, `🌶️`, `🌾`, `🥚`, `🥛`, `🫘`, `🥜`, `🟡`, `🥬`, `🦪`, `🥯`, `📸`) across the menu rendering pipeline.
2. **Allergen Pills (`.allergen-pill`)**: Clean transformation of dish tags into semantic, uppercase pills (`9px`, `letter-spacing: 0.18em`) conforming strictly to the 16 canonical `AllergenTag` enum values defined in `specs/openapi.yaml`.
3. **Photo Trigger Refactoring (`.dish-photo-trigger`)**: Deprecation of the old pill button (`.item-photo-btn` with `📸 Ver`) in favor of the Quiet Luxury editorial link (`<span>FOTOGRAFÍA</span><span class="trigger-line"></span>`), preserving dual backwards-compatibility in event listeners.
4. **Dual Pricing Invariant**: Deterministic handling of numeric prices (`XX.XX€`) versus market price dishes (`price === 0` or `<=` 0), showing the market description or `"Precio según mercado"` styled with `.menu-item-price.dual`.
5. **Strict TypeScript Typing**: Eradication of all `: any` declarations in carta functions, introducing canonical interfaces `MenuItem`, `MenuCategory`, and `AllergenTag`.
6. **Data Defense & Sanitization**: Runtime protection via `sanitizeDishName` to strip pictographs and flags from dirty Firestore or seed strings while preserving Spanish accents.

---

## 2. Forensic Audit of Current Implementation (`src/main.ts`)

### 2.1. Hardcoded Emojis in `tagIcons` Dictionary (Lines 303–320)
```typescript
// VERBATIM in src/main.ts: lines 303-320
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
- **Violation**: Injects noisy Unicode pictographs directly into the customer-facing UI, violating `specs/design-system-spec.md` §3.A and [DT-03].
- **Line 337**: `const icons = (item.tags || []).map((tag: string) => tagIcons[tag] || '').join('');`
- **Line 348**: `<h3>${item.name}${icons}${photoBtn}</h3>` (Inlines emojis directly into the `<h3>` heading).

### 2.2. Legacy Photo Button with Camera Emoji (Lines 339–343)
```typescript
// VERBATIM in src/main.ts: lines 339-343
const photoBtn = item.image_url ? `
  <button class="item-photo-btn" data-img="${item.image_url}" data-name="${item.name}" data-desc="${item.description || ''}" title="Ver foto del plato">
    <span style="font-size: 1.1em; margin-right: 3px; pointer-events: none;">📸</span> Ver
  </button>
` : '';
```
- **Violation**: Uses camera emoji `📸` and obsolete pill button `.item-photo-btn`. Must be replaced by `.dish-photo-trigger`.

### 2.3. Explicit `: any` Type Annotations in Carta Logic
- **Line 282**: `data = data.filter((d: any) => (d.tags || []).includes(tagFilter));`
- **Line 285**: `data.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));`
- **Line 296**: `const groups: { [key: string]: any[] } = {};`
- **Line 297**: `data.forEach((item: any) => {`
- **Line 329**: `html += groups[sub].map((item: any) => {`
- **Violation**: Violates TypeScript strict typing standards, loses IDE autocomplete, and prevents compile-time contract validation against OpenAPI schema.

### 2.4. Secondary Emojis in `src/main.ts` (Outside Menu Grid)
- **Line 511**: `'galeria3': { title: 'Mixología 🍸', ... }` (Glass emoji in gallery caption)
- **Line 513**: `'galeria5': { title: 'El Dulce Final 🍰', ... }` (Cake emoji in gallery caption)
- **Lines 688–692**: WhatsApp message template (`📅 Fecha:`, `⏰ Hora:`, `👤 Personas:`, `📝 Nombre:`, `🎉 Ocasión:`). Note: WhatsApp reservation message is governed under Milestone 5.

---

## 3. Contract & Interface Definitions (Single Source of Truth)

Conforming to `specs/openapi.yaml` (schemas `MenuItemOutput`, `AllergenTag` lines 384–442) and `PROJECT.md` Interface Contract #2:

```typescript
// ============================================================================
// CANONICAL CARTA CONTRACTS & INTERFACES (SSOT: specs/openapi.yaml)
// ============================================================================

export const OFFICIAL_ALLERGEN_TAGS = [
  'pescado',
  'marisco',
  'carne',
  'pollo',
  'picante',
  'gluten-free',
  'gluten',
  'huevos',
  'lacteos',
  'soja',
  'cacahuetes',
  'mostaza',
  'crustaceos',
  'apio',
  'moluscos',
  'sesamo'
] as const;

export type AllergenTag = typeof OFFICIAL_ALLERGEN_TAGS[number];

export type MenuCategory = 'comida' | 'coctel' | 'bebida';

export interface MenuItem {
  id?: string;
  name: string;
  description?: string;
  price: number;
  category: MenuCategory | string;
  subcategory?: string;
  sort_order?: number;
  tags?: AllergenTag[];
  is_available?: boolean;
  image_url?: string | null;
}

export interface FormattedPrice {
  isMarketPrice: boolean;
  priceClass: string;
  displayPrice: string;
}
```

*Note on `erasableSyntaxOnly`*: The tuple `as const` and `type` alias approach generates 100% erasable JavaScript, strictly complying with `"erasableSyntaxOnly": true` in `tsconfig.json`.

---

## 4. Pure Functional Architecture (Tested Domain Helpers)

### 4.1. `sanitizeDishName(name: string): string`
Pure emoji stripper that strips pictographs, variation selectors, and flags while preserving Spanish accents:
```typescript
export function sanitizeDishName(name: string): string {
  return name
    .replace(/\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}
```

### 4.2. `isValidAllergenTag(tag: string): tag is AllergenTag`
Type guard verifying exact membership in the 16 canonical OpenAPI tags:
```typescript
export function isValidAllergenTag(tag: string): tag is AllergenTag {
  return (OFFICIAL_ALLERGEN_TAGS as readonly string[]).includes(tag);
}
```

### 4.3. `renderAllergenPill(tag: string): string`
Outputs accessible, Quiet Luxury micro-pills with uppercase text and semantic `data-allergen` attribute:
```typescript
export function renderAllergenPill(tag: string): string {
  if (!isValidAllergenTag(tag)) return '';
  const label = (tag === 'gluten-free' ? 'GLUTEN-FREE' : tag).toUpperCase();
  return `<span class="allergen-pill" data-allergen="${tag}">${label}</span>`;
}
```

### 4.4. `formatMenuItemPrice(price: number | string, description: string = ''): FormattedPrice`
Implements the dual pricing invariant from `specs/SDD_MASTER.md` §3.2 (4) and `tests/contracts/pricing.mjs`:
```typescript
export function formatMenuItemPrice(price: number | string, description: string = ''): FormattedPrice {
  const numericPrice = typeof price === 'number' ? price : parseFloat(String(price));

  if (isNaN(numericPrice) || numericPrice <= 0) {
    return {
      isMarketPrice: true,
      priceClass: 'menu-item-price dual',
      displayPrice: (description && description.trim().length > 0)
        ? description.trim()
        : 'Precio según mercado'
    };
  }

  return {
    isMarketPrice: false,
    priceClass: 'menu-item-price',
    displayPrice: `${numericPrice.toFixed(2)}€`
  };
}
```

### 4.5. `renderMenuItemHtml(item: MenuItem): string`
Pure card renderer ensuring clean typography, zero emoji tags, correct containerization, and the new photo trigger:
```typescript
export function renderMenuItemHtml(item: MenuItem): string {
  const cleanName = sanitizeDishName(item.name || '');
  const pricing = formatMenuItemPrice(item.price, item.description);

  const pillsHtml = (item.tags || [])
    .filter(isValidAllergenTag)
    .map(renderAllergenPill)
    .join('');

  const photoTrigger = item.image_url
    ? `<button class="dish-photo-trigger" data-img="${item.image_url}" data-name="${cleanName}" data-desc="${item.description || ''}" aria-label="Ver fotografía del plato">
        <span>FOTOGRAFÍA</span>
        <span class="trigger-line"></span>
      </button>`
    : '';

  const descriptionDisplay = !pricing.isMarketPrice && item.description
    ? item.description.trim()
    : '';

  return `<article class="menu-item menu-item-card reveal active" data-category="${item.category || 'comida'}">
    <div class="menu-item-header">
      <h3 class="menu-item-name serif-title">${cleanName}</h3>
      <span class="${pricing.priceClass}">${pricing.displayPrice}</span>
    </div>
    ${descriptionDisplay ? `
    <div class="menu-item-info">
      <p class="menu-item-description">${descriptionDisplay}</p>
    </div>` : ''}
    <div class="menu-item-footer">
      ${pillsHtml ? `<div class="menu-item-allergens">${pillsHtml}</div>` : ''}
      ${photoTrigger}
    </div>
  </article>`;
}
```

---

## 5. Exact TypeScript Refactoring for `src/main.ts`

### 5.1. Refactored `loadMenu` Implementation
```typescript
    async function loadMenu(category: string, tagFilter: string | null = null) {
      menuGrid!.innerHTML = '<div class="loading-state">Actualizando selección...</div>';

      try {
        const q = query(
          collection(db, 'menu_items'),
          where('is_available', '==', true),
          where('category', '==', category)
        );

        const qs = await getDocs(q);
        let data: MenuItem[] = qs.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<MenuItem, 'id'>)
        }));

        if (tagFilter) {
          data = data.filter((d: MenuItem) => (d.tags || []).includes(tagFilter as AllergenTag));
        }

        data.sort((a: MenuItem, b: MenuItem) => (a.sort_order || 0) - (b.sort_order || 0));

        if (!data || data.length === 0) {
          const msg = tagFilter
            ? `No encontramos platos con la etiqueta "${tagFilter}" en este momento.`
            : `Próximamente novedades en ${category}s.`;
          menuGrid!.innerHTML = `<div class="loading-state">${msg}</div>`;
          return;
        }

        // Group by subcategory with emoji sanitization
        const groups: Record<string, MenuItem[]> = {};
        data.forEach((item: MenuItem) => {
          const sub = sanitizeDishName(item.subcategory || 'OTROS');
          if (!groups[sub]) groups[sub] = [];
          groups[sub].push(item);
        });

        let html = '';
        if (tagFilter) {
          html += `<div class="filter-notice">Filtrando por: <strong>${tagFilter.toUpperCase()}</strong> <a href="#" onclick="window.location.search=''; return false;" style="color:var(--lux-gold-champagne, #c5a880); margin-left:10px; font-size:0.8em;">(Ver Todo)</a></div>`;
        }

        for (const sub in groups) {
          html += `<div class="menu-subcategory-title">${sub}</div>`;
          html += groups[sub].map(renderMenuItemHtml).join('');
        }
        menuGrid!.innerHTML = html;

        // --- PHOTO MODAL LOGIC (Supports .dish-photo-trigger and legacy .item-photo-btn) ---
        const photoBtns = document.querySelectorAll('.dish-photo-trigger, .item-photo-btn');
        const photoModal = document.getElementById('menu-photo-modal');
        const modalImg = photoModal?.querySelector('.menu-modal-img') as HTMLImageElement | null;
        const modalName = photoModal?.querySelector('.modal-item-name');
        const modalDesc = photoModal?.querySelector('.modal-item-desc');
        const closeModalBtn = photoModal?.querySelector('.close-menu-modal');

        photoBtns.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const target = e.currentTarget as HTMLElement;
            const imgUrl = target.getAttribute('data-img');
            const name = target.getAttribute('data-name');
            const desc = target.getAttribute('data-desc');

            if (photoModal && modalImg && imgUrl) {
              let finalUrl = imgUrl;
              if (finalUrl.includes('cloudinary')) {
                if (finalUrl.includes('f_auto,q_auto') && !finalUrl.includes('w_')) {
                  finalUrl = finalUrl.replace('f_auto,q_auto', 'f_auto,q_auto,w_800,c_limit');
                } else if (!finalUrl.includes('f_auto')) {
                  finalUrl = finalUrl.replace('/upload/', '/upload/f_auto,q_auto,w_800,c_limit/');
                }
              }
              modalImg.src = finalUrl;
              if (modalName) modalName.textContent = name || '';
              if (modalDesc) modalDesc.textContent = desc || '';
              photoModal.classList.add('active');
              document.body.style.overflow = 'hidden'; // Lock scroll
            }
          });
        });

        const closeFunc = () => {
          photoModal?.classList.remove('active');
          if (modalImg) modalImg.src = '';
          document.body.style.overflow = '';
        };

        closeModalBtn?.addEventListener('click', closeFunc);
        photoModal?.addEventListener('click', (e) => {
          if (e.target === photoModal) closeFunc();
        });

      } catch (err) {
        console.error('Error loading menu:', err);
        menuGrid!.innerHTML = '<div class="loading-state">Estamos ordenando los sabores. Por favor, refresca en un momento.</div>';
      }
    }
```

---

## 6. Exact Unified Diff Proposal for `src/main.ts`

```diff
--- a/src/main.ts
+++ b/src/main.ts
@@ -6,6 +6,70 @@
+
+// --- DOMAIN CONTRACTS & INTERFACES (SSOT: specs/openapi.yaml) ---
+export const OFFICIAL_ALLERGEN_TAGS = [
+  'pescado',
+  'marisco',
+  'carne',
+  'pollo',
+  'picante',
+  'gluten-free',
+  'gluten',
+  'huevos',
+  'lacteos',
+  'soja',
+  'cacahuetes',
+  'mostaza',
+  'crustaceos',
+  'apio',
+  'moluscos',
+  'sesamo'
+] as const;
+
+export type AllergenTag = typeof OFFICIAL_ALLERGEN_TAGS[number];
+export type MenuCategory = 'comida' | 'coctel' | 'bebida';
+
+export interface MenuItem {
+  id?: string;
+  name: string;
+  description?: string;
+  price: number;
+  category: MenuCategory | string;
+  subcategory?: string;
+  sort_order?: number;
+  tags?: AllergenTag[];
+  is_available?: boolean;
+  image_url?: string | null;
+}
+
+export function sanitizeDishName(name: string): string {
+  return name
+    .replace(/\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|[\u{FE00}-\u{FE0F}]/gu, '')
+    .replace(/\s+/g, ' ')
+    .trim();
+}
+
+export function isValidAllergenTag(tag: string): tag is AllergenTag {
+  return (OFFICIAL_ALLERGEN_TAGS as readonly string[]).includes(tag);
+}
+
+export function renderAllergenPill(tag: string): string {
+  if (!isValidAllergenTag(tag)) return '';
+  const label = (tag === 'gluten-free' ? 'GLUTEN-FREE' : tag).toUpperCase();
+  return `<span class="allergen-pill" data-allergen="${tag}">${label}</span>`;
+}
+
+export function formatMenuItemPrice(price: number | string, description: string = ''): {
+  isMarketPrice: boolean;
+  priceClass: string;
+  displayPrice: string;
+} {
+  const numericPrice = typeof price === 'number' ? price : parseFloat(String(price));
+  if (isNaN(numericPrice) || numericPrice <= 0) {
+    return {
+      isMarketPrice: true,
+      priceClass: 'menu-item-price dual',
+      displayPrice: (description && description.trim().length > 0)
+        ? description.trim()
+        : 'Precio según mercado'
+    };
+  }
+  return {
+    isMarketPrice: false,
+    priceClass: 'menu-item-price',
+    displayPrice: `${numericPrice.toFixed(2)}€`
+  };
+}
+
+export function renderMenuItemHtml(item: MenuItem): string {
+  const cleanName = sanitizeDishName(item.name || '');
+  const pricing = formatMenuItemPrice(item.price, item.description);
+  const pillsHtml = (item.tags || [])
+    .filter(isValidAllergenTag)
+    .map(renderAllergenPill)
+    .join('');
+
+  const photoTrigger = item.image_url
+    ? `<button class="dish-photo-trigger" data-img="${item.image_url}" data-name="${cleanName}" data-desc="${item.description || ''}" aria-label="Ver fotografía del plato">
+        <span>FOTOGRAFÍA</span>
+        <span class="trigger-line"></span>
+      </button>`
+    : '';
+
+  const descriptionDisplay = !pricing.isMarketPrice && item.description
+    ? item.description.trim()
+    : '';
+
+  return `<article class="menu-item menu-item-card reveal active" data-category="${item.category || 'comida'}">
+    <div class="menu-item-header">
+      <h3 class="menu-item-name serif-title">${cleanName}</h3>
+      <span class="${pricing.priceClass}">${pricing.displayPrice}</span>
+    </div>
+    ${descriptionDisplay ? `
+    <div class="menu-item-info">
+      <p class="menu-item-description">${descriptionDisplay}</p>
+    </div>` : ''}
+    <div class="menu-item-footer">
+      ${pillsHtml ? `<div class="menu-item-allergens">${pillsHtml}</div>` : ''}
+      ${photoTrigger}
+    </div>
+  </article>`;
+}
 
@@ -279,10 +343,10 @@
-        let data = qs.docs.map(d => d.data());
+        let data: MenuItem[] = qs.docs.map(d => ({ id: d.id, ...(d.data() as Omit<MenuItem, 'id'>) }));
 
         if (tagFilter) {
-          data = data.filter((d: any) => (d.tags || []).includes(tagFilter));
+          data = data.filter((d: MenuItem) => (d.tags || []).includes(tagFilter as AllergenTag));
         }
         
-        data.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
+        data.sort((a: MenuItem, b: MenuItem) => (a.sort_order || 0) - (b.sort_order || 0));
 
@@ -296,25 +360,7 @@
-        // Group by subcategory
-        const groups: { [key: string]: any[] } = {};
-        data.forEach((item: any) => {
-          const sub = item.subcategory || 'OTROS';
+        // Group by subcategory with emoji sanitization
+        const groups: Record<string, MenuItem[]> = {};
+        data.forEach((item: MenuItem) => {
+          const sub = sanitizeDishName(item.subcategory || 'OTROS');
           if (!groups[sub]) groups[sub] = [];
           groups[sub].push(item);
         });
-
-        const tagIcons: { [key: string]: string } = {
-          'pescado': '<span class="menu-tag" tabindex="0" data-tooltip="Pescado">🐟</span>',
-          'marisco': '<span class="menu-tag" tabindex="0" data-tooltip="Marisco">🦐</span>',
-          'carne': '<span class="menu-tag" tabindex="0" data-tooltip="Carne">🥩</span>',
-          'pollo': '<span class="menu-tag" tabindex="0" data-tooltip="Pollo">🍗</span>',
-          'picante': '<span class="menu-tag" tabindex="0" data-tooltip="Picante">🌶️</span>',
-          'gluten-free': '<span class="menu-tag" tabindex="0" data-tooltip="Sin Gluten">🌾</span>',
-          'gluten': '<span class="menu-tag" tabindex="0" data-tooltip="Contiene Gluten">🌾</span>',
-          'huevos': '<span class="menu-tag" tabindex="0" data-tooltip="Contiene Huevos">🥚</span>',
-          'lacteos': '<span class="menu-tag" tabindex="0" data-tooltip="Contiene Lácteos">🥛</span>',
-          'soja': '<span class="menu-tag" tabindex="0" data-tooltip="Contiene Soja">🫘</span>',
-          'cacahuetes': '<span class="menu-tag" tabindex="0" data-tooltip="Contiene Cacahuetes">🥜</span>',
-          'mostaza': '<span class="menu-tag" tabindex="0" data-tooltip="Contiene Mostaza">🟡</span>',
-          'crustaceos': '<span class="menu-tag" tabindex="0" data-tooltip="Contiene Crustáceos">🦐</span>',
-          'apio': '<span class="menu-tag" tabindex="0" data-tooltip="Contiene Apio">🥬</span>',
-          'moluscos': '<span class="menu-tag" tabindex="0" data-tooltip="Contiene Moluscos">🦪</span>',
-          'sesamo': '<span class="menu-tag" tabindex="0" data-tooltip="Contiene Sésamo">🥯</span>'
-        };
 
         let html = '';
         if (tagFilter) {
-          html += `<div class="filter-notice">Filtrando por: <strong>${tagFilter.toUpperCase()}</strong> <a href="#" onclick="window.location.search=''; return false;" style="color:var(--color-gold); margin-left:10px; font-size:0.8em;">(Ver Todo)</a></div>`;
+          html += `<div class="filter-notice">Filtrando por: <strong>${tagFilter.toUpperCase()}</strong> <a href="#" onclick="window.location.search=''; return false;" style="color:var(--lux-gold-champagne, #c5a880); margin-left:10px; font-size:0.8em;">(Ver Todo)</a></div>`;
         }
 
         for (const sub in groups) {
           html += `<div class="menu-subcategory-title">${sub}</div>`;
-          html += groups[sub].map((item: any) => {
-            const hasNumericPrice = item.price > 0;
-            let priceDisplay = hasNumericPrice ? `${parseFloat(item.price).toFixed(2)}€` : item.description;
-            let descriptionDisplay = hasNumericPrice ? (item.description || '') : '';
-
-            // Handle very long dual prices (optional styling class)
-            const priceClass = !hasNumericPrice ? 'menu-item-price dual' : 'menu-item-price';
-
-            const icons = (item.tags || []).map((tag: string) => tagIcons[tag] || '').join('');
-
-            const photoBtn = item.image_url ? `
-              <button class="item-photo-btn" data-img="${item.image_url}" data-name="${item.name}" data-desc="${item.description || ''}" title="Ver foto del plato">
-                <span style="font-size: 1.1em; margin-right: 3px; pointer-events: none;">📸</span> Ver
-              </button>
-            ` : '';
-
-            return `
-              <div class="menu-item reveal active">
-                <div class="menu-item-header">
-                  <h3>${item.name}${icons}${photoBtn}</h3>
-                  <span class="${priceClass}">${priceDisplay}</span>
-                </div>
-                ${descriptionDisplay ? `
-                <div class="menu-item-info">
-                  <p>${descriptionDisplay}</p>
-                </div>` : ''}
-              </div>
-            `;
-          }).join('');
+          html += groups[sub].map(renderMenuItemHtml).join('');
         }
         menuGrid!.innerHTML = html;
 
-        // --- PHOTO MODAL LOGIC ---
-        const photoBtns = document.querySelectorAll('.item-photo-btn');
+        // --- PHOTO MODAL LOGIC ---
+        const photoBtns = document.querySelectorAll('.dish-photo-trigger, .item-photo-btn');
         const photoModal = document.getElementById('menu-photo-modal');
-        const modalImg = photoModal?.querySelector('.menu-modal-img') as HTMLImageElement;
+        const modalImg = photoModal?.querySelector('.menu-modal-img') as HTMLImageElement | null;
         const modalName = photoModal?.querySelector('.modal-item-name');
         const modalDesc = photoModal?.querySelector('.modal-item-desc');
         const closeModalBtn = photoModal?.querySelector('.close-menu-modal');
@@ -396,6 +416,7 @@
         const closeFunc = () => {
           photoModal?.classList.remove('active');
+          if (modalImg) modalImg.src = '';
           document.body.style.overflow = '';
         };
```

---

## 7. `carta.html` Synchronization Assessment

- **File Inspection**: All 159 lines of `carta.html` were audited.
- **Emoji Audit**: Zero hardcoded emojis exist in `carta.html` (verified with regex search for `\p{Extended_Pictographic}`).
- **Structure Synchronization**:
  - Container `#menu-grid.menu-grid.dynamic` strictly matches `src/main.ts`.
  - Filter buttons `.filter-btn[data-category]` (`comida`, `bebida`, `coctel`) match `loadMenu` event listeners.
  - Photo Modal `#menu-photo-modal` contains:
    - `.menu-modal-content`
    - `.close-menu-modal`
    - `.menu-modal-img`
    - `.modal-item-name`
    - `.modal-item-desc`
  - **Verdict**: `carta.html` markup is 100% synchronized and requires NO destructive modifications.

---

## 8. CSS Integration & Layout Harmony (`src/style.css`)

In `src/style.css`:
- `.allergen-pill` (lines 648–662): 9px uppercase font, `0.18em` tracking, `--lux-text-muted`, hairline border.
- `.dish-photo-trigger` (lines 1400–1434): 10px uppercase, `0.22em` tracking, `--lux-gold-champagne`, animated underline.
- `.menu-item-price.dual` (lines 631–638): 0.85rem italic font, `0.15em` tracking, subdued tone `#a8a095`.

**Recommended CSS enhancement for `src/style.css`**:
To guarantee optimal alignment between allergen pills and the photo trigger, define:
```css
.menu-item-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 10px;
  flex-wrap: wrap;
  gap: 8px;
}
```

---

## 9. Independent Verification & Validation Plan

1. **TypeScript Static Analysis**:
   ```powershell
   npx tsc --noEmit
   ```
   *Expected outcome*: Exit Code 0, zero compilation errors, zero `any` leaks.
2. **Full E2E Testing Suite**:
   ```powershell
   npm run test:all
   ```
   *Expected outcome*: 87/87 tests pass across Tiers 1–4.
3. **Adversarial Typography & Whitelist Suite**:
   ```powershell
   node --test tests/tier5-m2-typography-adversarial.test.mjs
   ```
   *Expected outcome*: 28/28 tests pass.
4. **Master Pipeline Build**:
   ```powershell
   npm run pipeline
   ```
   *Expected outcome*: `tsc --noEmit && vite build` succeeds with Exit Code 0 and build duration under 2 seconds.
