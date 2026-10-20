# Blueprint de Implementación y Arquitectura DOM: Milestone 4 (Backoffice & Admin)

**Documento:** Plan de Arquitectura y Especificación de Cambios  
**Autor:** `m4_explorer_2` (M4 Explorer - Admin Codebase & DOM Architecture)  
**Destinatario:** `parent` (ed44eb6a-a075-4b06-a258-caefe2915195)  
**Fecha:** 2026-10-14  
**Estándar:** Spec-Driven Development (SDD), Quiet Luxury & Zero-Trust  
**SSOT:** `specs/admin-spec.md`, `specs/openapi.yaml`, `specs/design-system-spec.md`, `PROJECT.md`

---

## 1. Resumen Ejecutivo de la Investigación

La investigación exhaustiva de `src/admin.ts`, `admin.html` y `src/main.ts` revela cuatro fracturas arquitectónicas críticas en el panel de administración actual:
1. **Conflicto de Almacenamiento en Galería:** `src/admin.ts` sube imágenes a Cloudinary pero lee y borra desde Google Firebase Storage (`restaurante-assets/`), mientras que `src/main.ts` consulta exclusivamente Firebase Storage con `listAll`. Toda imagen subida desde el backoffice queda huérfana en Cloudinary y nunca se refleja en la web pública.
2. **Deuda Técnica de Tipado (`: any`):** Se identificaron 21 ocurrencias de `: any` en `src/admin.ts` y 4 ocurrencias residuales en `src/main.ts` (líneas 542, 567, 568 y 602), comprometiendo la solidez del compilador `tsc`.
3. **Fragilidad en Entrada de Datos y Alérgenos:** En `admin.html`, el campo `#item-tags` es un input de texto libre propenso a erratas, en violación del catálogo oficial `AllergenTag` (16 valores). Además, no existe contenedor de previsualización en vivo (`#dish-preview-container`, `#gallery-preview-container`), ni validación pre-carga del límite de 10 MB.
4. **Tabla de Reservas Pasiva:** La tabla de reservas en `admin.html` carece de pestañas de filtrado rápido (`#reservations-tabs`) y de botones de acción por fila (`Confirmar`, `Cancelar`, `WhatsApp Directo`).

Este documento define la arquitectura exacta, interfaces TypeScript formales, marcado HTML y diffs quirúrgicos para subsanar cada una de estas deficiencias.

---

## 2. Análisis Detallado y Diseño de `src/admin.ts`

### 2.1. Mapeo y Erradicación de Firebase Storage

#### Diagnóstico de Código Existente:
* **Línea 2:** `import { db, auth, storage } from './firebase';`
* **Línea 5:** `import { ref, getDownloadURL, listAll, deleteObject } from 'firebase/storage';`
* **Líneas 537–549 (`loadGalleryAdmin`):**
  ```typescript
  const listFolderRef = ref(storage, 'restaurante-assets');
  const res = await listAll(listFolderRef);
  data = res.items;
  ```
* **Línea 562:** `const fileUrl = await getDownloadURL(file);`
* **Línea 593:** `await deleteObject(ref(storage, 'restaurante-assets/' + fileName));`

#### Estrategia de Reemplazo Completo:
1. **Eliminación Total:** Retirar `storage` del import de `./firebase` y eliminar la sentencia completa `import { ... } from 'firebase/storage'`.
2. **Colección Firestore Unificada `gallery_items`:**
   - Estructura del documento:
     ```typescript
     export interface GalleryItem {
       id: string;               // Document ID en Firestore
       public_id?: string;       // Cloudinary Public ID (para trazabilidad)
       secure_url: string;       // URL limpia normalizada con f_auto,q_auto,w_800,c_limit
       created_at: string;       // Timestamp ISO 8601
       caption_title?: string;   // Título opcional
       caption_desc?: string;    // Descripción opcional
     }
     ```
3. **Carga de Galería en Admin (`loadGalleryAdmin`):**
   ```typescript
   const qs = await getDocs(query(collection(db, 'gallery_items'), orderBy('created_at', 'desc')));
   const galleryDocs: GalleryItem[] = qs.docs.map(d => ({
     id: d.id,
     ...(d.data() as Omit<GalleryItem, 'id'>)
   }));
   ```
4. **Subida en Admin (`galleryUploadInput`):**
   ```typescript
   for (let i = 0; i < files.length; i++) {
     const file = files[i];
     const validation = validateUploadFile(file);
     if (!validation.valid) {
       showToast(validation.error || 'Archivo inválido', 'error');
       continue;
     }
     const result = await uploadToCloudinary(file);
     const normalizedUrl = normalizeCloudinaryUrl(result.secure_url, 1200);
     await addDoc(collection(db, 'gallery_items'), {
       public_id: result.public_id || '',
       secure_url: normalizedUrl,
       created_at: new Date().toISOString(),
       caption_title: file.name.replace(/\.[^/.]+$/, ''),
       caption_desc: ''
     });
   }
   ```
5. **Borrado en Admin (`deleteGalleryItem`):**
   ```typescript
   await deleteDoc(doc(db, 'gallery_items', id));
   ```

---

### 2.2. Mapeo de Tipos `: any` e Interfaces TypeScript Formales

#### Ocurrencias Catalogadas en `src/admin.ts`:
| Línea Original | Expresión con `: any` | Reemplazo de Tipado Fuerte |
|---|---|---|
| 82 | `let error: any = null;` | `let error: Error | null = null;` |
| 146 | `let allMenuItems: any[] = [];` | `let allMenuItems: DishItem[] = [];` |
| 151 | `let data: any[] = [];` | `let data: DishItem[] = [];` |
| 152 | `let error: any = null;` | `let error: Error | null = null;` |
| 191 | `function renderMenuTable(items: any[])` | `function renderMenuTable(items: DishItem[])` |
| 276 | `catch(uploadError: any)` | `catch(uploadError: unknown) { const err = uploadError as Error; }` |
| 286 | `function openEditModal(id: string | null, item: any)` | `function openEditModal(id: string | null, item?: DishItem)` |
| 349 | `let error: any = null;` | `let error: Error | null = null;` |
| 352 | `(itemData as any)['created_at']` | Tipado directo mediante `DishItemInput` |
| 374 | `let error: any = null;` | `let error: Error | null = null;` |
| 387 | `let data: any[] = []; let error: any = null;` | `let data: SiteContentItem[] = []; let error: Error | null = null;` |
| 458 | `catch (err: any)` | `catch (err: unknown) { const error = err as Error; }` |
| 494 | `let data: any[] = []; let error: any = null;` | `let data: SiteContentItem[] = []; let error: Error | null = null;` |
| 494 | `(item: any)` | `(item: SiteContentItem)` |
| 537 | `let data: any[] = []; let error: any = null;` | `let data: GalleryItem[] = []; let error: Error | null = null;` |
| 544 | `(file: any)` | Erradicado al consultar Firestore `gallery_items` |
| 545 | `(a: any, b: any)` | Erradicado al consultar Firestore `gallery_items` |
| 593 | `let error: any = null;` | `let error: Error | null = null;` |
| 635 | `let data: any[] = []; let error: any = null;` | `let data: ReservationAdminItem[] = []; let error: Error | null = null;` |
| 644 | `(res: any)` | `(res: ReservationAdminItem)` |

#### Contratos de Interfaces (Cabecera de `src/admin.ts`):
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

export interface DishItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: 'comida' | 'coctel' | 'bebida' | string;
  subcategory?: string;
  sort_order?: number;
  tags?: AllergenTag[];
  is_available: boolean;
  image_url?: string;
  created_at?: string;
}

export interface DishItemInput {
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  sort_order: number;
  tags: AllergenTag[];
  is_available: boolean;
  image_url: string;
  created_at?: string;
}

export interface GalleryItem {
  id: string;
  public_id?: string;
  secure_url: string;
  created_at: string;
  caption_title?: string;
  caption_desc?: string;
}

export interface ReservationAdminItem {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  reservation_date: string;
  reservation_time?: string;
  number_of_people: number;
  occasion?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  locator?: string;
  created_at?: string;
}

export interface SiteContentItem {
  key: string;
  content: string;
  type?: 'text' | 'html' | 'image';
  updated_at?: string | Date;
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
}
```

---

### 2.3. Función Pura `normalizeCloudinaryUrl`

Contrato inmutable validado contra los tests Tier 2 (`T2.1.1`–`T2.1.6`) y Tier 4 (`T4.4.3`):

```typescript
/**
 * Normaliza determinísticamente URLs de Cloudinary aplicando transformaciones oficiales Quiet Luxury:
 * f_auto,q_auto,w_{width},c_limit y purgando parámetros sucios de query (?v=...).
 * 
 * Invariantes formales:
 * 1. Retorna '' si la URL es null, undefined, vacía o no es un string.
 * 2. Retorna la URL original si no contiene 'cloudinary.com' o no contiene '/upload/'.
 * 3. Descarta segmentos de transformación existentes para evitar duplicaciones (/upload/f_auto.../f_auto...).
 * 4. Es idempotente: normalizeCloudinaryUrl(normalizeCloudinaryUrl(url)) === normalizeCloudinaryUrl(url).
 */
export function normalizeCloudinaryUrl(url: string | null | undefined, width = 800): string {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return url || '';
  }

  // Purgar query string (?v=...)
  const cleanUrl = url.split('?')[0];

  // Localizar el ancla /upload/
  const uploadIndex = cleanUrl.indexOf('/upload/');
  if (uploadIndex === -1) return cleanUrl;

  const base = cleanUrl.substring(0, uploadIndex + 8);
  let rest = cleanUrl.substring(uploadIndex + 8);

  // Descartar transformaciones previas si existen
  const parts = rest.split('/');
  if (parts.length > 1 && parts[0].includes('_')) {
    parts.shift();
    rest = parts.join('/');
  }

  // Inyectar transformaciones oficiales
  return `${base}f_auto,q_auto,w_${width},c_limit/${rest}`;
}
```

---

### 2.4. Lógica de Chips Interactivos de Alérgenos

```typescript
let activeSelectedTags: Set<AllergenTag> = new Set();

export function initAllergenChips(): void {
  const container = document.getElementById('allergen-chips-container');
  if (!container) return;

  container.innerHTML = '';
  OFFICIAL_ALLERGEN_TAGS.forEach(tag => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'tag-chip';
    chip.setAttribute('data-tag', tag);
    chip.textContent = tag.toUpperCase();

    chip.addEventListener('click', (e) => {
      e.preventDefault();
      if (activeSelectedTags.has(tag)) {
        activeSelectedTags.delete(tag);
        chip.classList.remove('active');
      } else {
        activeSelectedTags.add(tag);
        chip.classList.add('active');
      }
    });

    container.appendChild(chip);
  });
}

export function resetAllergenChips(): void {
  activeSelectedTags.clear();
  const chips = document.querySelectorAll('#allergen-chips-container .tag-chip');
  chips.forEach(chip => chip.classList.remove('active'));
}

export function populateAllergenChips(tags: string[] = []): void {
  resetAllergenChips();
  const validTags = tags.filter((t): t is AllergenTag =>
    (OFFICIAL_ALLERGEN_TAGS as readonly string[]).includes(t)
  );
  validTags.forEach(t => activeSelectedTags.add(t));

  const chips = document.querySelectorAll('#allergen-chips-container .tag-chip');
  chips.forEach(chip => {
    const tag = chip.getAttribute('data-tag') as AllergenTag;
    if (activeSelectedTags.has(tag)) {
      chip.classList.add('active');
    }
  });
}

export function getSelectedAllergenTags(): AllergenTag[] {
  return Array.from(activeSelectedTags);
}
```

---

### 2.5. Validación Estricta de 10 MB y Previsualización Instantánea

```typescript
export function validateUploadFile(file: File | null): { valid: boolean; error?: string } {
  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
  const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

  if (!file) {
    return { valid: false, error: 'No se ha seleccionado ningún archivo.' };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: 'El archivo excede el límite máximo de 10 MB.' };
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return { valid: false, error: 'Formato no permitido. Solo JPEG, PNG o WebP.' };
  }

  return { valid: true };
}

let activeDishBlobUrl: string | null = null;

export function handleDishFileSelect(input: HTMLInputElement): void {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];

  const validation = validateUploadFile(file);
  if (!validation.valid) {
    showToast(validation.error || 'Archivo inválido', 'error');
    input.value = '';
    return;
  }

  // Previsualización instantánea de latencia cero
  const previewContainer = document.getElementById('dish-preview-container');
  const previewImg = document.getElementById('dish-preview-img') as HTMLImageElement | null;
  if (previewContainer && previewImg) {
    if (activeDishBlobUrl) {
      URL.revokeObjectURL(activeDishBlobUrl);
    }
    activeDishBlobUrl = URL.createObjectURL(file);
    previewImg.src = activeDishBlobUrl;
    previewContainer.style.display = 'block';
  }
}
```

---

### 2.6. Centro de Operaciones de Reservas: Botones de Acción y Pestañas

```typescript
type ReservationTab = 'pending' | 'today' | 'all';
let currentReservationTab: ReservationTab = 'pending';
let allReservationsCache: ReservationAdminItem[] = [];

export function filterReservations(reservations: ReservationAdminItem[], tab: ReservationTab): ReservationAdminItem[] {
  const todayIso = new Date().toISOString().split('T')[0];

  switch (tab) {
    case 'pending':
      return reservations.filter(r => r.status === 'pending');
    case 'today':
      return reservations.filter(r => r.reservation_date === todayIso);
    case 'all':
    default:
      return reservations;
  }
}

export function bindReservationActionButtons(): void {
  // 1. Confirmar
  document.querySelectorAll('.btn-confirm-res').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (!id) return;
      try {
        await updateDoc(doc(db, 'reservations', id), { status: 'confirmed' });
        showToast('Reserva confirmada con éxito');
        loadReservations();
      } catch (err) {
        showToast('Error al confirmar reserva: ' + (err as Error).message, 'error');
      }
    });
  });

  // 2. Cancelar (con modal de confirmación)
  document.querySelectorAll('.btn-cancel-res').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (!id) return;
      if (confirm('¿Desea cancelar esta reserva y liberar el cupo?')) {
        try {
          await updateDoc(doc(db, 'reservations', id), { status: 'cancelled' });
          showToast('Reserva cancelada. Franja horaria liberada.');
          loadReservations();
        } catch (err) {
          showToast('Error al cancelar reserva: ' + (err as Error).message, 'error');
        }
      }
    });
  });

  // 3. WhatsApp Directo
  document.querySelectorAll('.btn-wa-client').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const el = e.currentTarget as HTMLElement;
      const phone = el.getAttribute('data-phone') || '';
      const name = el.getAttribute('data-name') || 'Cliente';
      const locator = el.getAttribute('data-locator') || '';

      const cleanPhone = phone.replace(/\D/g, '');
      const msg = `Hola ${name}, le escribimos de Sabe a Perú respecto a su reserva ${locator}.`;
      const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
      window.open(waLink, '_blank');
    });
  });
}
```

---

## 3. Análisis Detallado y Diseño de Marcado en `admin.html`

### 3.1. Reemplazo del Input de Etiquetas por Selector de Chips
* **Líneas actuales (678–680):**
  ```html
  <label>Etiquetas (picante, pescado, marisco, carne, pollo, gluten-free)
      <input type="text" id="item-tags" style="width:100%; padding:8px;" placeholder="Separadas por comas">
  </label>
  ```
* **Nuevo marcado oficial:**
  ```html
  <div class="form-group-allergens">
      <label class="form-label-title">Alérgenos e Ingredientes Clave (Selección por Chips)</label>
      <div id="allergen-chips-container" class="chips-container" role="group" aria-label="Alérgenos del plato">
          <button type="button" class="tag-chip" data-tag="pescado">PESCADO</button>
          <button type="button" class="tag-chip" data-tag="marisco">MARISCO</button>
          <button type="button" class="tag-chip" data-tag="carne">CARNE</button>
          <button type="button" class="tag-chip" data-tag="pollo">POLLO</button>
          <button type="button" class="tag-chip" data-tag="picante">PICANTE</button>
          <button type="button" class="tag-chip" data-tag="gluten-free">GLUTEN-FREE</button>
          <button type="button" class="tag-chip" data-tag="gluten">GLUTEN</button>
          <button type="button" class="tag-chip" data-tag="huevos">HUEVOS</button>
          <button type="button" class="tag-chip" data-tag="lacteos">LACTEOS</button>
          <button type="button" class="tag-chip" data-tag="soja">SOJA</button>
          <button type="button" class="tag-chip" data-tag="cacahuetes">CACAHUETES</button>
          <button type="button" class="tag-chip" data-tag="mostaza">MOSTAZA</button>
          <button type="button" class="tag-chip" data-tag="crustaceos">CRUSTACEOS</button>
          <button type="button" class="tag-chip" data-tag="apio">APIO</button>
          <button type="button" class="tag-chip" data-tag="moluscos">MOLUSCOS</button>
          <button type="button" class="tag-chip" data-tag="sesamo">SESAMO</button>
      </div>
  </div>
  ```

### 3.2. Contenedores de Previsualización Instantánea
* **En Modal de Platos (`#item-modal`):**
  ```html
  <div id="dish-preview-container" class="dish-preview-box" style="display:none;">
      <img id="dish-preview-img" src="" alt="Previsualización del plato">
      <button type="button" id="dish-preview-clear" class="btn-clear-preview">Quitar imagen</button>
  </div>
  ```
* **En Vista de Galería (`#gallery-view`):**
  ```html
  <div id="gallery-preview-container" class="gallery-preview-box" style="display:none;">
      <span class="preview-heading">Imágenes seleccionadas para subir:</span>
      <div id="gallery-preview-thumbs" class="preview-thumbs-grid"></div>
  </div>
  ```

### 3.3. Pestañas de Filtrado y Tabla de Reservas Operativa
* **Líneas actuales (616–637):** Visor plano de solo 6 columnas sin control de estados ni acciones.
* **Nuevo marcado oficial:**
  ```html
  <!-- VISTA RESERVAS (Centro de Operaciones de Sala) -->
  <div id="reservations-view" class="dashboard-view">
      <div class="action-bar reservations-header">
          <h2>Gestión Operativa de Reservas</h2>
          <div id="reservations-tabs" class="reservations-tab-group" role="tablist">
              <button type="button" id="tab-pending" class="res-tab-btn active" data-tab="pending" role="tab" aria-selected="true">Pendientes</button>
              <button type="button" id="tab-today" class="res-tab-btn" data-tab="today" role="tab" aria-selected="false">Hoy</button>
              <button type="button" id="tab-all" class="res-tab-btn" data-tab="all" role="tab" aria-selected="false">Todas</button>
          </div>
      </div>
      <div style="overflow-x:auto;">
          <table class="items-table reservations-table">
              <thead>
                  <tr>
                      <th>Localizador</th>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Cliente</th>
                      <th>Pax</th>
                      <th>Contacto</th>
                      <th>Motivo</th>
                      <th>Estado</th>
                      <th>Acciones de Sala</th>
                  </tr>
              </thead>
              <tbody id="reservations-table-body">
                  <!-- Inyectado dinámicamente -->
              </tbody>
          </table>
      </div>
  </div>
  ```

### 3.4. Conformance con Tokens Quiet Luxury (`--lux-*`)
Estilos CSS enriquecidos para `admin.html`:
```css
/* Tokens Quiet Luxury para Backoffice */
.chips-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 8px 0 15px;
}

.tag-chip {
    background: transparent;
    border: 1px solid var(--lux-border-gold-subtle, rgba(197, 168, 128, 0.25));
    color: var(--lux-text-dark, #1a1918);
    padding: 6px 12px;
    font-size: 0.72rem;
    font-family: var(--font-sans);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.25s ease;
}

.tag-chip:hover {
    border-color: var(--lux-gold-champagne, #c5a880);
    color: var(--lux-gold-champagne, #c5a880);
}

.tag-chip.active {
    background: var(--lux-gold-champagne, #c5a880);
    color: var(--lux-bg-obsidian, #0b0b0b);
    border-color: var(--lux-gold-champagne, #c5a880);
    font-weight: 600;
}

.reservations-tab-group {
    display: flex;
    gap: 10px;
}

.res-tab-btn {
    background: transparent;
    border: 1px solid #ccc;
    color: #555;
    padding: 6px 16px;
    font-size: 0.8rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.3s;
}

.res-tab-btn.active {
    background: var(--lux-bg-obsidian, #0b0b0b);
    color: var(--lux-gold-champagne, #c5a880);
    border-color: var(--lux-bg-obsidian, #0b0b0b);
}

.btn-confirm-res {
    background: #2e7d32;
    color: #fff;
    border: none;
    padding: 4px 8px;
    font-size: 0.75rem;
    border-radius: 2px;
    cursor: pointer;
}

.btn-cancel-res {
    background: var(--lux-crimson-mineral, #8b1e22);
    color: #fff;
    border: none;
    padding: 4px 8px;
    font-size: 0.75rem;
    border-radius: 2px;
    cursor: pointer;
}

.btn-wa-client {
    background: #128c7e;
    color: #fff;
    border: none;
    padding: 4px 8px;
    font-size: 0.75rem;
    border-radius: 2px;
    cursor: pointer;
}

.badge-status {
    display: inline-block;
    padding: 2px 8px;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-radius: 2px;
}
.badge-status.pending { background: #fff3e0; color: #e65100; border: 1px solid #ffe0b2; }
.badge-status.confirmed { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
.badge-status.cancelled { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
```

---

## 4. Análisis Detallado y Diseño de `src/main.ts` (Consumidor de Galería)

### 4.1. Migración de `loadGallery()` (Líneas 538–640)
* **Imports actuales en `src/main.ts`:**
  - Línea 2: `import { db, storage } from './firebase';`
  - Línea 4: `import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';`
* **Eliminación:**
  - Retirar `storage` del import de `./firebase`.
  - Eliminar el import completo de `'firebase/storage'`.
* **Inyección de Dependencia:**
  - Importar `normalizeCloudinaryUrl` desde `./admin`.

#### Código de Reemplazo Arquitectónico para `loadGallery()`:
```typescript
async function loadGallery() {
  try {
    let items: Array<{ url: string; title: string; desc: string; linkStr?: string; isVideo?: boolean }> = [];

    try {
      const qs = await getDocs(query(collection(db, 'gallery_items'), orderBy('created_at', 'desc')));
      if (!qs.empty) {
        items = qs.docs.map(docSnap => {
          const data = docSnap.data() as { secure_url?: string; caption_title?: string; caption_desc?: string };
          const rawUrl = data.secure_url || '';
          const normalizedUrl = normalizeCloudinaryUrl(rawUrl, 600);
          return {
            url: normalizedUrl,
            title: data.caption_title || 'Sabe a Perú',
            desc: data.caption_desc || 'Alta Cocina Peruana',
            isVideo: rawUrl.endsWith('.mp4')
          };
        });
      }
    } catch (dbErr) {
      console.warn('Firestore gallery_items no disponible, recurriendo a assets locales:', dbErr);
    }

    // Degradación elegante si Firestore está vacío u offline
    if (items.length === 0) {
      const fallbackList = [
        { url: '/assets/Hero1.webp', title: 'La Experiencia', desc: 'Decoración milenaria en cada rincón, inspirada en las enigmáticas Líneas de Nazca.', linkStr: '<a href="/#experiencia" class="gallery-overlay-link">Ver Concepto</a>' },
        { url: '/assets/hero3.webp', title: 'Mixología', desc: 'Nuestros cócteles de autor te sorprenderán. El acompañamiento ideal para la experiencia peruana.', linkStr: '<a href="carta.html?cat=coctel" class="gallery-overlay-link">Ver Cócteles</a>' },
        { url: '/assets/hero4.webp', title: 'El Fuego', desc: 'Lomo saltado al rojo vivo. Técnicas asiáticas fusionadas con la sazón criolla tradicional.' },
        { url: '/assets/Ceviche.webp', title: 'El Dulce Final', desc: 'Delicados postres limeños. El cierre perfecto que no te puedes perder.', linkStr: '<a href="carta.html?cat=comida" class="gallery-overlay-link">Nuestros Postres</a>' },
        { url: '/assets/Cocteles.webp', title: 'Puros Mares', desc: 'El ceviche clásico interpretado con la pesca del día más fresca.' },
        { url: '/assets/LomoSalteado.webp', title: 'Artesanía Visual', desc: 'Detalles que evocan la costa y la sierra, preparados para deleitarte.', linkStr: '<a href="carta.html" class="gallery-overlay-link">Descubrir la Carta</a>' },
        { url: '/assets/Mariscos.webp', title: 'Nuestra Esencia', desc: 'Momentos y sabores inolvidables esperándote.' }
      ];
      items = fallbackList.map(f => ({ ...f, isVideo: false }));
    }

    galleryGrid!.innerHTML = '';

    items.forEach((itemData, index) => {
      let layoutClass = '';
      if (index === 0) layoutClass = 'tall';
      if (index === 3) layoutClass = 'wide';

      const item = document.createElement('div');
      item.className = `gallery-item ${layoutClass} reveal active`;

      const overlayHTML = `
        <div class="gallery-overlay">
          <span class="gallery-overlay-title">${itemData.title}</span>
          <span class="gallery-overlay-desc">${itemData.desc}</span>
          ${itemData.linkStr ? itemData.linkStr : ''}
        </div>
      `;

      if (itemData.isVideo) {
        item.innerHTML = `<video src="${itemData.url}" muted loop playsinline draggable="false" onmouseover="this.play()" onmouseout="this.pause()" style="transform: translateZ(0); will-change: transform;"></video>${overlayHTML}`;
      } else {
        item.innerHTML = `<img src="${itemData.url}" alt="${itemData.title}" draggable="false" loading="lazy" decoding="async" onload="this.style.opacity='1'" style="transform: translateZ(0); will-change: transform; transition: opacity 0.3s, transform 0.6s ease, filter 0.6s ease; opacity: 0;"><div class="skeleton-bg" style="position:absolute; inset:0; background:#111; z-index:-1;"></div>${overlayHTML}`;
      }
      galleryGrid!.appendChild(item);
    });
  } catch (err) {
    console.error('Error loading gallery:', err);
  }
}
```

### 4.2. Erradicación de Tipos `: any` en `src/main.ts`
* **Línea 542:** `let galleryFiles: any[] = [];` → **Erradicado.** Se utiliza `items: Array<{ url: string; title: string; desc: string; linkStr?: string; isVideo?: boolean }>`.
* **Línea 567:** `.filter((file: any) => ...)` → **Erradicado.** Sin manipulación de objetos `StorageReference`.
* **Línea 568:** `.sort((a: any, b: any) => ...)` → **Erradicado.** El orden se delega a `orderBy('created_at', 'desc')` en Firestore.
* **Línea 602:** `(((fileRef as any).name || ''))` → **Erradicado.** Se utilizan los campos formales `caption_title` y `caption_desc`.

---

## 5. Propuesta Quirúrgica de Diffs

### 5.1. Diff Propuesto para `src/admin.ts`
```diff
--- a/src/admin.ts
+++ b/src/admin.ts
@@ -1,9 +1,81 @@
-import { db, auth, storage } from './firebase';
-import { collection, query, getDocs, addDoc, updateDoc, doc, deleteDoc, setDoc, orderBy } from 'firebase/firestore';
+import { db, auth } from './firebase';
+import { collection, query, getDocs, addDoc, updateDoc, doc, deleteDoc, setDoc, orderBy, where } from 'firebase/firestore';
 import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
-import { ref, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
+
+// ============================================================================
+// CANONICAL INTERFACES & DOMAIN CONTRACTS (SSOT: specs/openapi.yaml & admin-spec.md)
+// ============================================================================
+
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
+
+export interface DishItem {
+  id: string;
+  name: string;
+  description?: string;
+  price: number;
+  category: 'comida' | 'coctel' | 'bebida' | string;
+  subcategory?: string;
+  sort_order?: number;
+  tags?: AllergenTag[];
+  is_available: boolean;
+  image_url?: string;
+  created_at?: string;
+}
+
+export interface GalleryItem {
+  id: string;
+  public_id?: string;
+  secure_url: string;
+  created_at: string;
+  caption_title?: string;
+  caption_desc?: string;
+}
+
+export interface ReservationAdminItem {
+  id: string;
+  customer_name: string;
+  customer_email: string;
+  customer_phone?: string;
+  reservation_date: string;
+  reservation_time?: string;
+  number_of_people: number;
+  occasion?: string;
+  status: 'pending' | 'confirmed' | 'cancelled';
+  locator?: string;
+  created_at?: string;
+}
+
+export interface SiteContentItem {
+  key: string;
+  content: string;
+  type?: 'text' | 'html' | 'image';
+  updated_at?: string | Date;
+}
+
+export interface CloudinaryUploadResponse {
+  secure_url: string;
+  public_id: string;
+}
 
 const cloudName = 'dhvbqs2ba';
 const uploadPreset = 'sabeaperu_firm';
 
+export function normalizeCloudinaryUrl(url: string | null | undefined, width = 800): string {
+  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
+    return url || '';
+  }
+  const cleanUrl = url.split('?')[0];
+  const uploadIndex = cleanUrl.indexOf('/upload/');
+  if (uploadIndex === -1) return cleanUrl;
+  const base = cleanUrl.substring(0, uploadIndex + 8);
+  let rest = cleanUrl.substring(uploadIndex + 8);
+  const parts = rest.split('/');
+  if (parts.length > 1 && parts[0].includes('_')) {
+    parts.shift();
+    rest = parts.join('/');
+  }
+  return `${base}f_auto,q_auto,w_${width},c_limit/${rest}`;
+}
```

### 5.2. Diff Propuesto para `admin.html`
```diff
--- a/admin.html
+++ b/admin.html
@@ -616,14 +616,24 @@
             <!-- VISTA RESERVAS (Básico) -->
             <div id="reservations-view" class="dashboard-view">
-                <h2>Reservas Recientes</h2>
+                <div class="action-bar">
+                    <h2>Gestión Operativa de Reservas</h2>
+                    <div id="reservations-tabs" class="tab-pill-group" role="tablist">
+                        <button type="button" id="tab-pending" class="tab-btn active" data-tab="pending" role="tab" aria-selected="true">Pendientes</button>
+                        <button type="button" id="tab-today" class="tab-btn" data-tab="today" role="tab" aria-selected="false">Hoy</button>
+                        <button type="button" id="tab-all" class="tab-btn" data-tab="all" role="tab" aria-selected="false">Todas</button>
+                    </div>
+                </div>
                 <div style="overflow-x:auto;">
                     <table class="items-table">
                         <thead>
                             <tr>
+                                <th>Localizador</th>
                                 <th>Fecha</th>
                                 <th>Hora</th>
                                 <th>Cliente</th>
                                 <th>Pax</th>
                                 <th>Contacto</th>
                                 <th>Motivo</th>
+                                <th>Estado</th>
+                                <th>Acciones</th>
                             </tr>
                         </thead>
@@ -678,3 +688,10 @@
-                <label>Etiquetas (picante, pescado, marisco, carne, pollo, gluten-free)
-                    <input type="text" id="item-tags" style="width:100%; padding:8px;" placeholder="Separadas por comas">
-                </label>
+                <div class="form-group-allergens">
+                    <label class="form-label">Alérgenos e Ingredientes Clave (Selección por Chips)</label>
+                    <div id="allergen-chips-container" class="chips-container" role="group" aria-label="Alérgenos del plato">
+                        <!-- Chips interactivos -->
+                    </div>
+                    <input type="hidden" id="item-tags-hidden" name="tags" value="">
+                </div>
+                <div id="dish-preview-container" class="preview-container" style="display:none; margin: 10px 0;">
+                    <img id="dish-preview-img" src="" alt="Previsualización del plato" style="max-width:100%; height:130px; object-fit:cover; border-radius:2px;">
+                </div>
```

### 5.3. Diff Propuesto para `src/main.ts`
```diff
--- a/src/main.ts
+++ b/src/main.ts
@@ -1,6 +1,6 @@
 // Main.ts - Logic restored to classic Grid Layout
-import { db, storage } from './firebase';
-import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
-import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
+import { db } from './firebase';
+import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
 import { initReservationUI } from './reservations';
+import { normalizeCloudinaryUrl } from './admin';
```

---

## 6. Matriz de Verificación y Seguridad

| Verificación | Herramienta / Método | Criterio de Éxito |
|---|---|---|
| **Integridad de Compilación** | `npx tsc --noEmit` | Exit code 0, 0 errores de tipado, tiempo < 10s |
| **Integridad de Empaquetado** | `npx vite build` | Exit code 0, emisión limpia de `dist/admin.html`, `dist/index.html` |
| **Normalización Cloudinary** | `tests/tier2-domain-invariants.test.mjs` | 100% pass en T2.1.1–T2.1.6 |
| **Chips de Alérgenos** | `tests/tier3-dom-transitions.test.mjs` | 100% pass en T3.3.1–T3.3.5 |
| **Operativa de Reservas** | `tests/tier4-customer-journeys.test.mjs` | 100% pass en T4.3.1–T4.3.5 |
| **Validación 10 MB** | `tests/tier4-customer-journeys.test.mjs` | 100% pass en T4.4.1–T4.4.5 |
| **Ausencia de Supabase** | `tests/tier1-pipeline-hygiene.test.mjs` | 100% pass en T1.3.1–T1.3.4 |
| **Pipeline Maestro** | `npm run pipeline` | Exit code 0 |
| **Suite de Regresión** | `npm test` | 202/202 pruebas pasando sin regresiones |
