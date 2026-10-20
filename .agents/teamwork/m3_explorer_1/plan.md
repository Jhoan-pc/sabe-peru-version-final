# Blueprint & Especificación Técnica Formal: Milestone 3 (Carta y Alérgenos)

**Módulo:** Fase 3: Lógica TypeScript de Carta y Alérgenos  
**SSOT Autorizados:** `specs/openapi.yaml`, `specs/SDD_MASTER.md`, `specs/design-system-spec.md`, `PROJECT.md`  
**Autor:** `m3_explorer_1` (Specification Miner)  
**Estado:** Blueprint Aprobado para Implementación  

---

## 1. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Allergen Contract | `AllergenTag` Enum Canónico | Contrato formal de 16 valores discretos de alérgenos autorizados por la SSOT OpenAPI 3.1 | String identificador del alérgeno | Tipo formal enum `AllergenTag` | Rechazo estricto si el string no coincide con los 16 valores | `specs/openapi.yaml` L423-441, `tests/contracts/allergens.mjs` |
| 2 | Allergen Contract | Validación y Sanitización de Alérgenos | Función pura `validateDishAllergenTags` para desduplicar y certificar validez de tags | Array de strings `tags: string[]` | `{ valid: boolean, sanitized: string[], errors: string[] }` | Si `tags` no es array retorna error; tags inválidos se reportan en `errors` | `tests/contracts/allergens.mjs`, `specs/openapi.yaml` |
| 3 | DOM Presentation | Micro-Pills de Alérgenos (`.allergen-pill`) | Representación HTML sobria en micro-tipografía 9px uppercase Sans `--lux-text-muted` | Tag individual válido | `<span class="allergen-pill" data-allergen="[tag]">[LABEL]</span>` | Si tag es inválido retorna string vacío `""` | `specs/design-system-spec.md` §3.A, `src/style.css` L648 |
| 4 | DOM Presentation | Contenedor de Alérgenos (`.menu-item-allergens`) | Contenedor flex con micro-gap para agrupar las píldoras de alérgenos | Array de tags válidos | `<div class="menu-item-allergens">...pills...</div>` | Si el plato no tiene tags válidos o `tags` está vacío, el contenedor se omite | `tests/tier3-dom-transitions.test.mjs` T3.2.4 |
| 5 | DOM Presentation | Micro-Pill Hover State | Micro-interacción con hairline border sutil (`--lux-border-gold-subtle`) y color `--lux-text-secondary` | Puntero `:hover` sobre `.allergen-pill` | Transición suave (0.3s) de borde y texto | Degradación limpia sin saltos de layout ni sombras invasivas | `specs/design-system-spec.md` §1 & §4 |
| 6 | Interaction | Trigger Editorial de Fotografía (`.dish-photo-trigger`) | Enlace minimalista editorial con texto `FOTOGRAFÍA` y hairline animada en hover | `item.image_url`, `item.name`, `item.description` | `<button class="dish-photo-trigger" data-img="..." ...><span>FOTOGRAFÍA</span><span class="trigger-line"></span></button>` | Si `item.image_url` es null/vacío, el botón se omite del DOM | `specs/design-system-spec.md` §3.A, `src/style.css` L1400 |
| 7 | Interaction | Ciclo de Vida del Modal de Foto (`#menu-photo-modal`) | Apertura limpia del modal con bloqueo de scroll y normalización Cloudinary de imagen | Evento `click` en `.dish-photo-trigger` | Modal visible con clase `.active`, `document.body.style.overflow = 'hidden'`, imagen normalizada cargada | Si la URL es inválida o fallback, carga con graceful display | `src/main.ts` L361-404, `specs/admin-spec.md` |
| 8 | Business Logic | Resiliencia de Precios Duales (`formatMenuItemPrice`) | Formateo estricto: precio > 0 muestra `XX.XX€`; precio = 0 delega descripción como precio de mercado en `.menu-item-price.dual` | `price: number\|string`, `description?: string` | `{ isMarketPrice: boolean, priceClass: string, displayPrice: string }` | Si `price` es NaN, <= 0 o null, conmuta a `isMarketPrice: true` con fallback `"Precio según mercado"` | `specs/SDD_MASTER.md` §3.2 (4), `tests/contracts/pricing.mjs` |
| 9 | Content Hygiene | Erradicación Total de Emojis (`sanitizeDishName`) | Limpieza de pictogramas Unicode en nombres de platos y títulos de subcategorías, preservando acentos y eñes | String sucio con emojis (e.g. `🐟 Ceviche 🌶️`) | String limpio en Serif editorial (e.g. `Ceviche`) | Mantiene diacríticos españoles (`á, é, í, ó, ú, ñ, Á, É, Í, Ó, Ú, Ñ`) | `specs/SDD_MASTER.md` [DT-03], `tests/tier3-dom-transitions.test.mjs` T3.1.1 |
| 10 | Query & Navigation | Filtrado por Categoría y Alérgeno | Filtro interactivo de la carta por `category` (`comida`, `coctel`, `bebida`) y parámetro opcional `tag` | Botones `.filter-btn` y parámetros URL `?cat=...&tag=...` | Re-renderizado de `.menu-grid` ordenado por `sort_order` ascendente | Mensaje elegante de estado vacío si ningún plato coincide | `src/main.ts` L268-326, `specs/openapi.yaml` L68-98 |
| 11 | Media Pipeline | Normalización Cloudinary en Triggers | Transformación determinista `f_auto,q_auto,w_800,c_limit` sin query strings duplicados al abrir fotografías | URL de imagen en Firestore | URL normalizada inyectada en `.menu-modal-img.src` | URLs no-Cloudinary se transfieren sin mutación | `tests/contracts/cloudinary.mjs`, `specs/admin-spec.md` §2 |

---

## 2. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | `AllergenTag` Enum | Tag no oficial (ej: `'nuez'`, `'vegano'`, `'cerdo'`, `'gluten_free'`) | `isValidAllergenTag` evalúa a `false`. No se renderiza ninguna píldora en el frontend; en backend/admin se emite error de validación. |
| 2 | `AllergenTag` Enum | Tags duplicados en el array del plato: `['pescado', 'marisco', 'pescado']` | `validateDishAllergenTags` genera set único `['pescado', 'marisco']` sin duplicar elementos DOM. |
| 3 | `AllergenTag` Rendering | Array de tags vacío: `tags: []` o `tags: null` | El contenedor `<div class="menu-item-allergens">` se omite por completo del HTML generado (cero wrappers residuales vacíos). |
| 4 | Micro-Pill Typography | Tag `'gluten-free'` | Etiqueta renderiza estrictamente en mayúsculas: `GLUTEN-FREE` (o `SIN GLUTEN`). El atributo `data-allergen` preserva el kebab-case `"gluten-free"`. |
| 5 | Dual Pricing | `price = 0` o `price = 0.00` con `description = "Precio según lonja diaria"` | Renderiza `<span class="menu-item-price dual">Precio según lonja diaria</span>`. La descripción no se duplica en el párrafo inferior. |
| 6 | Dual Pricing | `price = 0` con `description = ""` o `undefined` | Renderiza `<span class="menu-item-price dual">Precio según mercado</span>` (fallback corporativo inmutable). |
| 7 | Dual Pricing Boundary | `price = 0.01` (límite positivo inferior) | `isMarketPrice: false`, renderiza `<span class="menu-item-price">0.01€</span>`. |
| 8 | Dual Pricing Boundary | `price = -15` (precio negativo anómalo) | Resiliencia defensiva: tratado como `price <= 0`, conmuta a `isMarketPrice: true` sin romper la interfaz. |
| 9 | Dual Pricing Input | String numérico `'24.50'` o `'18'` | Se parsea de forma segura a float numérico y renderiza `'24.50€'` o `'18.00€'`. |
| 10 | Dual Pricing Input | String inválido `'gratis'` o `'s/m'` | `isNaN()` conmuta limpiamente a `isMarketPrice: true` usando la descripción o fallback. |
| 11 | Photo Trigger | Plato con `image_url = null` o `image_url = ""` | El botón `.dish-photo-trigger` no se inyecta en el DOM (los platos sin fotografía mantienen balance editorial). |
| 12 | Photo Trigger | Plato con `image_url` que contiene query parameters `?v=123` | Se normaliza a `f_auto,q_auto,w_800,c_limit` eliminando query strings antes de asignar a `.menu-modal-img.src`. |
| 13 | Emoji Sanitizer | Nombre con emojis complejos: `🐟 Ceviche Clásico de Corvina con Ají Limo 🌶️ y Maíz Chulpe 🌾` | Sanitizado a `Ceviche Clásico de Corvina con Ají Limo y Maíz Chulpe` preservando tildes y mayúsculas. |
| 14 | Emoji Sanitizer | Título de subcategoría con emojis: `🍋 CEVICHES Y TIRADITOS 🐟` | Sanitizado a `CEVICHES Y TIRADITOS`. |
| 15 | Modal Accessibility | Usuario pulsa tecla `Escape` o hace clic en el backdrop oscuro | Cierre inmediato del modal, restablecimiento de `document.body.style.overflow = ''`. |

---

## 3. Especificación Formal de los 16 Alérgenos (`AllergenTag`)

### 3.1. Definición Canónica (SSOT OpenAPI 3.1)
Ruta en especificación: `specs/openapi.yaml` (líneas 423-441):

```yaml
AllergenTag:
  type: string
  enum:
    - pescado
    - marisco
    - carne
    - pollo
    - picante
    - gluten-free
    - gluten
    - huevos
    - lacteos
    - soja
    - cacahuetes
    - mostaza
    - crustaceos
    - apio
    - moluscos
    - sesamo
```

### 3.2. Contrato TypeScript Estricto
Para su incorporación en `src/main.ts` o módulo de tipos:

```typescript
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

export function isValidAllergenTag(tag: unknown): tag is AllergenTag {
  return typeof tag === 'string' && (OFFICIAL_ALLERGEN_TAGS as readonly string[]).includes(tag);
}
```

### 3.3. Tabla de Mapeo de Etiquetas Tipográficas
| Enum `AllergenTag` | Etiqueta Tipográfica (`data-allergen`) | Texto Renderizado |
| :--- | :--- | :--- |
| `pescado` | `pescado` | `PESCADO` |
| `marisco` | `marisco` | `MARISCO` |
| `carne` | `carne` | `CARNE` |
| `pollo` | `pollo` | `POLLO` |
| `picante` | `picante` | `PICANTE` |
| `gluten-free` | `gluten-free` | `GLUTEN-FREE` |
| `gluten` | `gluten` | `GLUTEN` |
| `huevos` | `huevos` | `HUEVOS` |
| `lacteos` | `lacteos` | `LÁCTEOS` |
| `soja` | `soja` | `SOJA` |
| `cacahuetes` | `cacahuetes` | `CACAHUETES` |
| `mostaza` | `mostaza` | `MOSTAZA` |
| `crustaceos` | `crustaceos` | `CRUSTÁCEOS` |
| `apio` | `apio` | `APIO` |
| `moluscos` | `moluscos` | `MOLUSCOS` |
| `sesamo` | `sesamo` | `SÉSAMO` |

*Nota:* Para máxima compatibilidad con las pruebas existentes (`tests/tier2-domain-invariants.test.mjs` y `tests/tier3-dom-transitions.test.mjs`), `renderAllergenPill(tag)` utiliza:
`const label = (tag === 'gluten-free' ? 'GLUTEN-FREE' : tag).toUpperCase();`
produciendo `PESCADO`, `MARISCO`, `CRUSTACEOS`, etc.

---

## 4. Estructura DOM y Reglas CSS de Alérgenos (`.allergen-pill`)

### 4.1. Estructura HTML Exacta
```html
<div class="menu-item-allergens">
  <span class="allergen-pill" data-allergen="pescado">PESCADO</span>
  <span class="allergen-pill" data-allergen="picante">PICANTE</span>
</div>
```

### 4.2. Especificación de Estilo CSS (Tokens Quiet Luxury)
```css
/* Contenedor flexible de micro-píldoras */
.menu-item-allergens {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

/* Micro-píldora individual */
.allergen-pill {
  display: inline-block;
  font-family: var(--font-sans);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-weight: 600;
  color: var(--lux-text-muted);           /* #858076 */
  background: transparent;
  border: 1px solid var(--lux-border-hairline); /* rgba(245, 242, 235, 0.08) */
  padding: 2px 7px;
  margin: 2px 4px 2px 0;
  border-radius: 2px;
  line-height: 1.2;
  transition: border-color 0.3s ease, color 0.3s ease;
}

/* Micro-interacción hover sutil */
.allergen-pill:hover {
  border-color: var(--lux-border-gold-subtle); /* rgba(197, 168, 128, 0.20) */
  color: var(--lux-text-secondary);            /* #c0bab0 */
}
```

---

## 5. Estructura DOM e Interacción del Trigger Editorial (`.dish-photo-trigger`)

### 5.1. Estructura HTML Exacta
```html
<button 
  class="dish-photo-trigger" 
  data-img="https://res.cloudinary.com/dhvbqs2ba/image/upload/v1720000000/ceviche.jpg"
  data-name="Ceviche Clásico de Corvina"
  data-desc="Finos cortes de corvina fresca marinados en leche de tigre"
  aria-label="Ver fotografía del plato"
>
  <span>FOTOGRAFÍA</span>
  <span class="trigger-line"></span>
</button>
```

### 5.2. Especificación CSS (Consolidada en `src/style.css` L1400-1434)
```css
.dish-photo-trigger {
  background: transparent;
  border: none;
  color: var(--lux-gold-champagne);      /* #c5a880 */
  font-family: var(--font-sans);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  cursor: pointer;
  padding: 4px 0;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  transition: color 0.4s ease;
  position: relative;
  text-decoration: none;
}

.dish-photo-trigger:hover {
  color: var(--lux-text-primary);        /* #f5f2eb */
}

.dish-photo-trigger .trigger-line {
  display: block;
  width: 0%;
  height: 1px;
  background-color: var(--lux-gold-champagne);
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  margin-top: 3px;
}

.dish-photo-trigger:hover .trigger-line {
  width: 100%;
}
```

### 5.3. Contrato de Interacción JS en `src/main.ts`
1. **Binding:** Adjuntar listener a todos los elementos `.dish-photo-trigger`.
2. **Normalización de URL:** Si `data-img` contiene `cloudinary`, asegurar transformación `f_auto,q_auto,w_800,c_limit`.
3. **Poblado del Modal:**
   - Asignar `modalImg.src = normalizedUrl`.
   - Asignar `modalName.textContent = trigger.dataset.name || ''`.
   - Asignar `modalDesc.textContent = trigger.dataset.desc || ''`.
4. **Apertura:** Agregar clase `.active` a `#menu-photo-modal` y bloquear scroll mediante `document.body.style.overflow = 'hidden'`.
5. **Cierre:** Al pulsar `.close-menu-modal`, pulsar fuera del modal o pulsar la tecla `Escape`, remover `.active` y desbloquear scroll con `document.body.style.overflow = ''`.

---

## 6. Reglas Formales de Resiliencia de Precios Duales

### 6.1. Invariante de Dominio
De acuerdo a `specs/SDD_MASTER.md` §3.2 (4) y `tests/contracts/pricing.mjs`:
- Si `price > 0`: Se formatea con dos decimales numéricos y el símbolo del euro: `24.50€`. La clase CSS asignada es `.menu-item-price`.
- Si `price === 0` o precio no numérico: Se considera "precio según mercado". Se renderiza la descripción suministrada como texto de precio (o `"Precio según mercado"` si no hay descripción) con la clase CSS `.menu-item-price.dual`.
- **Prevención de redundancia:** Cuando un plato activa precio dual, la descripción textual se aloja en el elemento del precio (`.menu-item-price.dual`), suprimiendo el bloque inferior `<div class="menu-item-info">` para evitar texto duplicado.

### 6.2. Función Pura Canónica
```typescript
export interface FormattedPrice {
  isMarketPrice: boolean;
  priceClass: string;
  displayPrice: string;
}

export function formatMenuItemPrice(price: number | string, description = ''): FormattedPrice {
  const numericPrice = typeof price === 'number' ? price : parseFloat(price);

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

### 6.3. Clases CSS Asociadas (en `src/style.css` L621-639)
```css
.menu-item-price {
  font-family: var(--font-sans);
  color: #cca43b;
  font-weight: 600;
  font-size: 1.1rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.menu-item-price.dual {
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 400;
  letter-spacing: 0.15em;
  font-style: italic;
  color: #a8a095;
}
```

---

## 7. Sanitizador Canónico de Titulares (Erradicación de Emojis)

Para cumplir con [DT-03] y los tests T3.1.1, se define la función pura `sanitizeDishName`:

```typescript
export function sanitizeDishName(name: string): string {
  if (!name) return '';
  return name
    .replace(/\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}
```

---

## 8. Plantilla Completa de Renderizado de Plato (`MenuItem`)

Sustituyendo el código con emojis y botón píldora en `src/main.ts` L329-357:

```typescript
function renderMenuItemHtml(item: any): string {
  const cleanName = sanitizeDishName(item.name || '');
  const pricing = formatMenuItemPrice(item.price, item.description);
  const validTags = (item.tags || []).filter(isValidAllergenTag);
  
  const pillsHtml = validTags.length > 0
    ? `<div class="menu-item-allergens">${validTags.map((tag: AllergenTag) => renderAllergenPill(tag)).join('')}</div>`
    : '';

  const photoBtn = item.image_url ? `
    <button class="dish-photo-trigger" data-img="${item.image_url}" data-name="${cleanName}" data-desc="${item.description || ''}" aria-label="Ver fotografía del plato">
      <span>FOTOGRAFÍA</span>
      <span class="trigger-line"></span>
    </button>
  ` : '';

  const descriptionBlock = (!pricing.isMarketPrice && item.description)
    ? `<div class="menu-item-info"><p>${item.description}</p></div>`
    : '';

  return `
    <div class="menu-item reveal active">
      <div class="menu-item-header">
        <h3 class="menu-item-name serif-title">${cleanName}</h3>
        <span class="${pricing.priceClass}">${pricing.displayPrice}</span>
      </div>
      ${descriptionBlock}
      <div class="menu-item-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
        ${pillsHtml}
        ${photoBtn}
      </div>
    </div>
  `;
}
```

---

## 9. Plan de Implementación Secuencial para el Agente Desarrollador

1. **Paso 1: Módulo de Contratos y Tipos en TypeScript:**
   - Incorporar en `src/main.ts` (o `src/types.ts` si se modulariza) los tipos `AllergenTag`, `OFFICIAL_ALLERGEN_TAGS`, `isValidAllergenTag`, `renderAllergenPill`, `formatMenuItemPrice` y `sanitizeDishName`.
2. **Paso 2: Depuración de `src/main.ts`:**
   - Eliminar el diccionario antiguo `tagIcons` con emojis (`🐟`, `🥩`, `🌶️`, etc.).
   - Sustituir la concatenación de `<h3>${item.name}${icons}${photoBtn}</h3>` por el nuevo markup estructurado.
   - Reemplazar `.item-photo-btn` por `.dish-photo-trigger`.
   - Conectar los event listeners del modal a `.dish-photo-trigger`.
   - Sanitizar títulos de subcategorías con `sanitizeDishName(sub)`.
3. **Paso 3: Verificación de Estilos en `src/style.css`:**
   - Confirmar que `.allergen-pill`, `.allergen-pill:hover`, `.menu-item-allergens`, `.dish-photo-trigger` y `.menu-item-price.dual` coincidan exactamente con la especificación.
4. **Paso 4: Validación Automatizada:**
   - Ejecutar `npm run pipeline` (`tsc --noEmit && vite build`).
   - Ejecutar `npm run test:all` (verificar 87/87 tests pasando).
