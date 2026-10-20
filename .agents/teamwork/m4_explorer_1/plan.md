# Blueprint de Especificaciones y Contratos — Milestone 4 (Fase 4: Backoffice y Cloudinary)

**Autor:** `m4_explorer_1` (M4 Spec Miner)  
**Destinatarios:** `m4_worker_1`, `m4_challenger_1`, `m4_auditor_1`, Parent Orchestrator  
**SSOT Autoridad:** `specs/admin-spec.md`, `specs/openapi.yaml`, `specs/SDD_MASTER.md`, `PROJECT.md`  
**Fecha:** 2026-10-14  

---

## 1. Visión General del Hito 4

El Hito 4 erradica la deuda técnica acumulada en la administración del sistema ([DT-04], [DT-05], [DT-10], [DT-13]):
1. **Unificación en Cloudinary:** Eliminación absoluta y permanente de consultas y dependencias de Firebase Storage (`restaurante-assets/`) en el panel de control. Cloudinary se consolida como el único pipeline y CDN multimedia.
2. **Normalización Determinista de URLs:** Implementación y exportación de la función pura `normalizeCloudinaryUrl(url: string, width = 800): string`. Erradicación de reemplazos manuales con regex y eliminación de sufijos destructivos de caché (`?v=...`).
3. **Persistencia Unificada de Galería:** Adopción de la colección Firestore `gallery_items` con ordenación por `created_at desc`, permitiendo subidas instantáneas, listado y eliminación directa por ID de documento.
4. **Selector Interactivo de Alérgenos (16 Chips):** Sustitución del `<input type="text">` de texto libre por un panel visual de 16 botones chips con atributos `data-tag`, correspondientes de forma estricta al enum `AllergenTag` de `specs/openapi.yaml`.
5. **Previsualización en Tiempo Real y Blindaje de Archivos:** Validación estricta de archivos previa a la subida (máximo 10 MB, tipos MIME `image/jpeg`, `image/png`, `image/webp`), con previsualización sin latencia vía `URL.createObjectURL(file)` y liberación de memoria mediante `URL.revokeObjectURL`.
6. **Operativa de Reservas de Sala:** Transformación de la tabla de reservas en un centro de control operativo con pestañas de filtrado rápido (`Pendientes`, `Hoy`, `Todas`) y botones directos de acción (`Confirmar`, `Cancelar`, `WhatsApp Directo`).

---

## 2. Contrato 1: Función Pura `normalizeCloudinaryUrl`

### 2.1. Firma y Ubicación
- **Archivo:** `src/admin.ts` (exportada para consumo de tests y otros módulos si aplica)
- **Firma TypeScript:**
  ```typescript
  export function normalizeCloudinaryUrl(url: string, width = 800): string
  ```

### 2.2. Algoritmo y Reglas de Invarianza
1. **Validación de Tipo y Dominio:**
   - Si `url` es falsy (`null`, `undefined`, `''`) o no es string: retorna `''` (o el valor de entrada si falsy).
   - Si `url` no contiene la cadena `'cloudinary.com'`: retorna `url` intacta sin alteración.
2. **Sanitización de Query Strings (Anti-Cache Busting Corruption):**
   - Extraer la URL base limpia dividiendo por `?` (`const cleanUrl = url.split('?')[0]`).
   - Esto purga parámetros sucios residuales como `?v=1720000000`, `?v=999`, etc.
3. **Localización del Punto de Inyección `/upload/`:**
   - Buscar el índice de `'/upload/'`: `const uploadIndex = cleanUrl.indexOf('/upload/');`
   - Si no existe (p. ej. URLs de Cloudinary tipo `/raw/`): retornar `cleanUrl`.
   - Extraer prefijo base: `const base = cleanUrl.substring(0, uploadIndex + 8);` (incluye `/upload/`).
   - Extraer sufijo: `let rest = cleanUrl.substring(uploadIndex + 8);`.
4. **Descarte de Transformaciones Previas (Idempotencia y Anti-Nesting):**
   - Dividir `rest` en segmentos por `/`: `const parts = rest.split('/');`
   - Si `parts.length > 1` y el primer segmento `parts[0]` contiene un carácter guion bajo `_` (indicador canónico de directivas Cloudinary como `f_auto`, `q_auto`, `w_800`, `c_limit`), se descarta dicho segmento mediante `parts.shift();`.
   - Volver a ensamblar `rest = parts.join('/');`.
   - **Nota sobre versiones (`v1234567890`):** Los segmentos de versión no contienen `_`, por lo que se preservan íntegros.
5. **Inyección de Transformación Estándar Quiet Luxury:**
   - Concatenar: `${base}f_auto,q_auto,w_${width},c_limit/${rest}`.
   - Parámetro por defecto: `width = 800`.
   - Soporte para anchos personalizados: `normalizeCloudinaryUrl(url, 400)` -> `w_400`, `normalizeCloudinaryUrl(url, 1600)` -> `w_1600`.

### 2.3. Código de Referencia Canónico
```typescript
export function normalizeCloudinaryUrl(url: string, width = 800): string {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return url || '';
  }

  // 1. Limpiar cualquier parámetro de query (?v=...)
  const cleanUrl = url.split('?')[0];

  // 2. Localizar el punto de inyección /upload/
  const uploadIndex = cleanUrl.indexOf('/upload/');
  if (uploadIndex === -1) return cleanUrl;

  const base = cleanUrl.substring(0, uploadIndex + 8);
  let rest = cleanUrl.substring(uploadIndex + 8);

  // 3. Descartar transformaciones previas si existen (idempotencia)
  const parts = rest.split('/');
  if (parts.length > 1 && parts[0].includes('_')) {
    parts.shift();
    rest = parts.join('/');
  }

  // 4. Inyectar directiva oficial
  return `${base}f_auto,q_auto,w_${width},c_limit/${rest}`;
}
```

---

## 3. Contrato 2: Colección Firestore `gallery_items`

### 3.1. Erradicación Total de Firebase Storage
- Se eliminan de `src/admin.ts` todos los imports de `firebase/storage`:
  `ref, getDownloadURL, listAll, deleteObject` y el binding `storage` de `./firebase`.
- Ninguna función de administración leerá o borrará objetos en la ruta `restaurante-assets/`.
- La subida se realiza directamente a la API REST de Cloudinary (`https://api.cloudinary.com/v1_1/dhvbqs2ba/image/upload`), y el registro resultante se persiste en Firestore.

### 3.2. Esquema del Documento Firestore (`gallery_items`)
Para garantizar compatibilidad 100% con `specs/admin-spec.md` §1.B, `specs/openapi.yaml` (`GalleryItem`), y el formulario de administración, el documento almacena los siguientes campos canónicos y alias:

| Campo | Tipo | Obligatorio | Descripción | Ejemplo |
|---|---|---|---|---|
| `id` | `string` | Sí (Doc ID) | Identificador autogenerado por Firestore | `"glr_8f93d01a"` |
| `image_url` | `string` | Sí | URL normalizada de Cloudinary | `"https://res.cloudinary.com/.../f_auto,q_auto,w_800,c_limit/plato.jpg"` |
| `secure_url` | `string` | Sí (Alias) | Alias idéntico a `image_url` para cumplimiento OpenAPI | `"https://res.cloudinary.com/.../f_auto,q_auto,w_800,c_limit/plato.jpg"` |
| `public_id` | `string` | No | Public ID devuelto por Cloudinary | `"gallery/ceviche_2026"` |
| `created_at` | `string` | Sí | Marca de tiempo ISO 8601 | `"2026-10-14T08:15:00.000Z"` |
| `title` | `string` | No | Título descriptivo o pie de foto | `"Ceviche Mixto Tradicional"` |
| `caption_title` | `string` | No (Alias) | Alias idéntico a `title` para cumplimiento OpenAPI | `"Ceviche Mixto Tradicional"` |
| `description` | `string` | No | Descripción editorial de la imagen | `"Pesca del día marinada con ají limo y cilantro"` |
| `caption_desc` | `string` | No (Alias) | Alias idéntico a `description` para cumplimiento OpenAPI | `"Pesca del día marinada con ají limo y cilantro"` |

### 3.3. Operaciones CRUD en Firestore
1. **Crear / Subir (`addGalleryItem`):**
   ```typescript
   // 1. Subir a Cloudinary
   const cloudRes = await uploadToCloudinary(file);
   const normalizedUrl = normalizeCloudinaryUrl(cloudRes.secure_url, 800);

   // 2. Persistir en Firestore
   await addDoc(collection(db, 'gallery_items'), {
     image_url: normalizedUrl,
     secure_url: normalizedUrl,
     public_id: cloudRes.public_id || '',
     title: title || '',
     caption_title: title || '',
     description: description || '',
     caption_desc: description || '',
     created_at: new Date().toISOString()
   });
   ```
2. **Listar (`loadGalleryAdmin`):**
   ```typescript
   const q = query(collection(db, 'gallery_items'), orderBy('created_at', 'desc'));
   const snapshot = await getDocs(q);
   const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
   ```
3. **Eliminar (`deleteGalleryItem`):**
   ```typescript
   if (confirm('¿Seguro que deseas eliminar esta imagen de la galería?')) {
     await deleteDoc(doc(db, 'gallery_items', id));
     showToast('Imagen eliminada de la galería');
     loadGalleryAdmin();
   }
   ```
4. **Sincronización con la Web Pública (`src/main.ts`):**
   La función pública `loadGallery()` en `src/main.ts` consultará la colección `gallery_items` de Firestore ordenada por `created_at desc`. Si la colección estuviese vacía o no hubiera conexión, se aplicará el fallback inmutable a los 8 assets locales en `/assets/`.

---

## 4. Contrato 3: Selector Interactivo de Alérgenos (16 Chips)

### 4.1. Catálogo Oficial Canónico (16 Valores de `AllergenTag`)
Conforme a `specs/openapi.yaml` (líneas 425-441) y `tests/contracts/allergens.mjs`:
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
```

### 4.2. Estructura HTML en `admin.html`
En el modal de creación y edición de platos (`#item-modal`), el antiguo campo `<input type="text" id="item-tags">` se reemplaza por el siguiente contenedor semántico:

```html
<div class="form-group allergen-selector-group">
  <label class="form-label" style="display:block; margin-bottom:6px; font-weight:600;">
    Alérgenos e Ingredientes Destacados
  </label>
  <div id="allergen-chips-container" class="allergen-chips-container">
    <button type="button" class="tag-chip" data-tag="pescado">PESCADO</button>
    <button type="button" class="tag-chip" data-tag="marisco">MARISCO</button>
    <button type="button" class="tag-chip" data-tag="carne">CARNE</button>
    <button type="button" class="tag-chip" data-tag="pollo">POLLO</button>
    <button type="button" class="tag-chip" data-tag="picante">PICANTE</button>
    <button type="button" class="tag-chip" data-tag="gluten-free">SIN GLUTEN</button>
    <button type="button" class="tag-chip" data-tag="gluten">CON GLUTEN</button>
    <button type="button" class="tag-chip" data-tag="huevos">HUEVOS</button>
    <button type="button" class="tag-chip" data-tag="lacteos">LÁCTEOS</button>
    <button type="button" class="tag-chip" data-tag="soja">SOJA</button>
    <button type="button" class="tag-chip" data-tag="cacahuetes">CACAHUETES</button>
    <button type="button" class="tag-chip" data-tag="mostaza">MOSTAZA</button>
    <button type="button" class="tag-chip" data-tag="crustaceos">CRUSTÁCEOS</button>
    <button type="button" class="tag-chip" data-tag="apio">APIO</button>
    <button type="button" class="tag-chip" data-tag="moluscos">MOLUSCOS</button>
    <button type="button" class="tag-chip" data-tag="sesamo">SÉSAMO</button>
  </div>
  <!-- Campo oculto para mantener compatibilidad si algún script consulta value -->
  <input type="hidden" id="item-tags" name="tags" value="">
</div>
```

### 4.3. Estilos CSS (Tokens Quiet Luxury)
```css
.allergen-chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
  margin-bottom: 15px;
}

.tag-chip {
  background: #2a2a2a;
  border: 1px solid #444;
  color: #ccc;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 11px;
  font-family: var(--font-sans);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.tag-chip:hover {
  border-color: var(--color-gold);
  color: #fff;
}

.tag-chip.active {
  background: var(--color-gold);
  border-color: var(--color-gold);
  color: #0b0b0b;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(197, 168, 128, 0.3);
}
```

### 4.4. Ciclo de Vida y Sincronización con el Formulario
1. **Inicialización de Event Listeners:**
   Cada `.tag-chip` recibe un listener de clic que ejecuta `chip.classList.toggle('active')`.
2. **Apertura en Modo Crear (`openCreateModal`):**
   Desactivar todos los chips:
   `document.querySelectorAll('#allergen-chips-container .tag-chip').forEach(c => c.classList.remove('active'));`
3. **Apertura en Modo Edición (`openEditModal`):**
   - Limpiar chips activos previamente.
   - Leer el array `item.tags` (p. ej. `['pescado', 'picante']`).
   - Para cada tag presente, marcar el chip correspondiente:
     `const chip = document.querySelector(#allergen-chips-container .tag-chip[data-tag="${tag}"]);`
     `if (chip) chip.classList.add('active');`
4. **Envío del Formulario (`itemForm.submit`):**
   - Extraer tags activos:
     ```typescript
     const activeChips = Array.from(
       document.querySelectorAll('#allergen-chips-container .tag-chip.active')
     );
     const tags: string[] = activeChips
       .map(c => c.getAttribute('data-tag') || '')
       .filter(t => OFFICIAL_ALLERGEN_TAGS.includes(t as any));
     ```
   - Asignar `tags` al payload del documento `menu_items`.
5. **Reinicio del Formulario (`itemForm.reset`):**
   Limpiar clases `active` de todos los chips.

---

## 5. Contrato 4: Previsualización en Vivo y Validación de Archivos

### 5.1. Reglas de Validación Pre-Carga
Cualquier archivo de imagen seleccionado (plato, galería o CMS de inicio/experiencia) debe validarse síncronamente antes de enviarse a Cloudinary:

```typescript
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUploadFile(file: File | null | undefined): FileValidationResult {
  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB exactos (10,485,760 bytes)
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
```

### 5.2. Previsualización Inmediata (`URL.createObjectURL`) y Liberación de Memoria
1. **Al detectar `change` en el input de archivo:**
   ```typescript
   const file = input.files[0];
   const validation = validateUploadFile(file);
   if (!validation.valid) {
     showToast(validation.error!, 'error');
     input.value = '';
     return;
   }

   // 1. Liberar URL previa si existía
   if (currentObjectURL) {
     URL.revokeObjectURL(currentObjectURL);
   }

   // 2. Generar Object URL instantánea (Zero-Latency Preview)
   currentObjectURL = URL.createObjectURL(file);
   previewImg.src = currentObjectURL;
   previewImg.style.display = 'block';
   ```
2. **Durante la Subida:**
   - Deshabilitar el botón de submit con spinner indicador.
   - Mostrar estado: `"Subiendo imagen a Cloudinary..."`.
3. **Tras la Respuesta de Cloudinary:**
   - Normalizar la URL: `const normalizedUrl = normalizeCloudinaryUrl(resData.secure_url, 800);`.
   - Asignar `normalizedUrl` al campo de URL (`#item-image-url`).
   - Liberar la Object URL de memoria: `URL.revokeObjectURL(currentObjectURL); currentObjectURL = null;`.
   - Asignar la URL final a la imagen: `previewImg.src = normalizedUrl;`.

---

## 6. Contrato 5: Operativa de Reservas de Sala y Filtros Rápidos

### 6.1. Pestañas de Filtrado Rápido en Cabecera
En la vista `#reservations-view`, se inyectan 3 botones de pestañas:

```html
<div class="reservation-tabs" style="display:flex; gap:10px; margin-bottom:15px;">
  <button type="button" class="res-tab-btn active" data-tab="pending">Pendientes</button>
  <button type="button" class="res-tab-btn" data-tab="today">Hoy</button>
  <button type="button" class="res-tab-btn" data-tab="all">Todas</button>
</div>
```

- **Pestaña `pending` (Default):** Filtra reservas con `status === 'pending'`, ordenadas por fecha/hora próxima.
- **Pestaña `today`:** Filtra reservas cuya `reservation_date === new Date().toISOString().split('T')[0]`.
- **Pestaña `all`:** Muestra todas las reservas sin filtrar por estado ni fecha.

### 6.2. Botones de Acción Operativa por Fila

Cada fila de reserva renderizada en `#reservations-table-body` contendrá:
1. **Datos de la Reserva:**
   - Fecha y Hora
   - Localizador único (`locator` tipo `SP-XXXX`)
   - Nombre del cliente
   - Comensales (`number_of_people`)
   - Email y Teléfono
   - Badge de Estado:
     - `pending`: `<span class="res-badge badge-pending">Pendiente</span>`
     - `confirmed`: `<span class="res-badge badge-confirmed">Confirmada</span>`
     - `cancelled`: `<span class="res-badge badge-cancelled">Cancelada</span>`
2. **Botones de Acción:**
   - **`btn-confirm-res` (`Confirmar`):**
     - Oculto o deshabilitado si ya está confirmada.
     - Al pulsar:
       ```typescript
       await updateDoc(doc(db, 'reservations', res.id), { status: 'confirmed' });
       showToast('Reserva confirmada con éxito');
       ```
   - **`btn-cancel-res` (`Cancelar`):**
     - Oculto o deshabilitado si ya está cancelada.
     - Al pulsar:
       ```typescript
       if (confirm('¿Desea cancelar esta reserva y liberar el cupo?')) {
         await updateDoc(doc(db, 'reservations', res.id), { status: 'cancelled' });
         showToast('Reserva cancelada. Cupo liberado.');
       }
       ```
   - **`btn-wa-client` (`WhatsApp Directo`):**
     - Limpia el teléfono: `const cleanPhone = (res.customer_phone || '').replace(/\D/g, '') || '34662125650';`
     - Mensaje codificado:
       ```typescript
       const msg = `Hola ${res.customer_name}, le escribimos de Sabe a Perú respecto a su reserva ${res.locator || ''}.`;
       const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
       window.open(waUrl, '_blank');
       ```
     - Al ser un evento de clic directo del usuario, **no es bloqueado por Safari ni navegadores móviles**.

### 6.3. Manejo Formal de Errores (RFC 9457 Toasts)
Cualquier fallo de mutación en Firestore debe capturarse en bloque `catch` y mostrarse mediante toasts con estructura RFC 9457:
- Prohibido `window.alert()`.
- Toast estructurado con `role="alert"`, título y detalle descriptivo del error.

---

## 7. Features Discovered Table

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | Media CDN | `normalizeCloudinaryUrl` | Normalización determinista de URLs Cloudinary inyectando `f_auto,q_auto,w_${width},c_limit` y eliminando query strings | `url: string`, `width?: number` (default: 800) | `string` con transformaciones canónicas | Retorna `url` original o `''` si es falsy/no-Cloudinary | `specs/admin-spec.md` §2, `tests/contracts/cloudinary.mjs` |
| 2 | Media CDN | Query String Sanitization | Purga de parámetros sucios (`?v=123`) que provocan rotura de caché en Cloudinary | URL con query params | URL sin query params | N/A | `specs/admin-spec.md` §2, `tests/tier2-domain-invariants.test.mjs` T2.1.2 |
| 3 | Media CDN | Transform Idempotency | Detección y reemplazo de transformaciones previas sin duplicar directivas (`/f_auto.../f_auto...`) | URL ya transformada | URL con un único bloque transformador | N/A | `specs/admin-spec.md` §2, `tests/tier2-domain-invariants.test.mjs` T2.1.3 |
| 4 | Gallery Persistence | Unificación en Firestore `gallery_items` | Almacenamiento de fotos de galería en colección Firestore `gallery_items` | Documento `{ image_url, secure_url, public_id, created_at, title, description }` | Persistencia en Firestore y render en admin/web | Mapeo a toast de error si falla Firestore | `specs/admin-spec.md` §1.B, `specs/openapi.yaml` |
| 5 | Gallery Storage | Erradicación de Firebase Storage | Eliminación de consultas y borrados en el bucket `restaurante-assets` | N/A | 0 llamadas a Firebase Storage en Admin | N/A | `specs/admin-spec.md` §1.B, ORIGINAL_REQUEST R4 |
| 6 | Menu Allergens | Panel de 16 Chips de Alérgenos | Selector interactivo de chips basado exclusivamente en el enum `AllergenTag` | Clic en chips con `data-tag` | Array limpio `tags: string[]` en el payload | Rechazo de tags ajenos al catálogo canónico | `specs/openapi.yaml` lines 425-441, `tests/tier3-dom-transitions.test.mjs` T3.3 |
| 7 | Menu Allergens | Form Synchronization de Chips | Preselección de chips activos al editar y reseteo completo al crear o limpiar plato | `item.tags` array | Activación visual (`.tag-chip.active`) | Descarte elegante de tags nulos o corruptos | `tests/tier3-dom-transitions.test.mjs` T3.3.5 |
| 8 | Asset Validation | Validación de Tamaño y MIME | Validación estricta previa a la subida: máximo 10 MB y solo JPEG, PNG o WebP | `file: File` | `{ valid: boolean, error?: string }` | Bloqueo inmediato de subida y emisión de toast | `specs/admin-spec.md` §3.A, `tests/tier4-customer-journeys.test.mjs` T4.4.1 |
| 9 | UI / UX | Previsualización Zero-Latency | Generación instantánea de previsualización con `URL.createObjectURL` y liberación con `revokeObjectURL` | `file: File` | `previewImg.src = objectUrl` | Liberación de memoria en descarte o fin de subida | `specs/admin-spec.md` §3.B, `tests/tier4-customer-journeys.test.mjs` |
| 10 | Reservations | Filtros Rápidos de Sala | Pestañas de filtrado: Pendientes (default), Hoy (fecha actual), Todas | Selección de pestaña (`data-tab`) | Renderizado filtrado de filas de reservas | N/A | `specs/admin-spec.md` §5.B, `tests/tier4-customer-journeys.test.mjs` T4.3.1 |
| 11 | Reservations | Botón Confirmar (`btn-confirm-res`) | Mutación de estado de reserva a `confirmed` en Firestore con badge verde | Clic en botón de fila | `status: 'confirmed'` en Firestore | Toast de error RFC 9457 en fallo | `specs/admin-spec.md` §5.A.1, `tests/tier4-customer-journeys.test.mjs` T4.3.2 |
| 12 | Reservations | Botón Cancelar (`btn-cancel-res`) | Cancelación con confirmación modal previa y liberación de aforo | Clic en botón con confirmación | `status: 'cancelled'` en Firestore | Reversión si el usuario cancela en el diálogo | `specs/admin-spec.md` §5.A.2, `tests/tier4-customer-journeys.test.mjs` T4.3.3 |
| 13 | Reservations | Botón WhatsApp Directo (`btn-wa-client`) | Generación y apertura de chat directo con mensaje prellenado incluyendo localizador | Datos de cliente y reserva | Apertura voluntaria `https://wa.me/...` | Fallback a teléfono oficial si cliente no aporta teléfono | `specs/admin-spec.md` §5.A.3, `tests/tier4-customer-journeys.test.mjs` T4.3.4 |
| 14 | Error Handling | Problem Details RFC 9457 Toasts | Eliminación de `alert()` nativo en favor de notificaciones toast estructuradas | Error object con status/detail | Notificación flotante accesible | N/A | `specs/SDD_MASTER.md` §3.2.6, `tests/tier4-customer-journeys.test.mjs` T4.3.5 |

---

## 8. Edge Cases Table

| # | Feature | Input | Observed / Expected Behavior |
|---|---|---|---|
| 1 | `normalizeCloudinaryUrl` | `null` o `undefined` | Retorna `''` limpiamente sin lanzar excepciones |
| 2 | `normalizeCloudinaryUrl` | `''` (cadena vacía) | Retorna `''` |
| 3 | `normalizeCloudinaryUrl` | `'https://images.unsplash.com/photo-123'` (No-Cloudinary) | Retorna la URL externa intacta sin inyectar transformaciones |
| 4 | `normalizeCloudinaryUrl` | `'https://res.cloudinary.com/demo/raw/doc.pdf'` (Sin `/upload/`) | Retorna la URL limpia sin `/upload/` sin mutar |
| 5 | `normalizeCloudinaryUrl` | URL con `?v=123` y `&utm_source=test` | Corta en `?` y extrae solo la URL base limpia |
| 6 | `normalizeCloudinaryUrl` | URL con directivas previas: `.../upload/f_auto,q_auto/sample.jpg` | Descarta `f_auto,q_auto` y sustituye por `f_auto,q_auto,w_800,c_limit` |
| 7 | `normalizeCloudinaryUrl` | Re-normalización de URL ya normalizada (Idempotencia) | Devuelve exactamente la misma URL sin duplicar segmentos |
| 8 | `normalizeCloudinaryUrl` | URL con versión pero sin transformaciones: `.../upload/v1720000000/ceviche.jpg` | Preserva el segmento de versión `v1720000000` e inyecta la transformación antes |
| 9 | `normalizeCloudinaryUrl` | Subcarpetas complejas y caracteres escapados (`folder/subfolder/plato%201.png`) | Mantiene la estructura de subcarpetas y nombres codificados |
| 10 | File Validation | Archivo de 10 MB exactos (`10 * 1024 * 1024` bytes) | Válido (`valid: true`) |
| 11 | File Validation | Archivo de 10 MB + 1 byte (`10485761` bytes) | Rechazado con mensaje de error explicativo |
| 12 | File Validation | Archivo de formato `image/gif` o `image/svg+xml` | Rechazado con mensaje: solo JPEG, PNG o WebP |
| 13 | Allergen Chips | Plato con etiquetas no estándar en BD heredada (`'nuez'`, `'alcohol'`) | Filtradas y descartadas; solo los 16 tags de `AllergenTag` activan chips |
| 14 | Allergen Chips | Plato sin alérgenos (`tags: []` o `undefined`) | Todos los chips permanecen inactivos; `tags` se guarda como `[]` |
| 15 | Reservations Tab | Cambio de pestaña de 'Pendientes' a 'Hoy' | Solo se muestran reservas con fecha de hoy; la tabla no parpadea ni rompe layout |
| 16 | WhatsApp Direct | Teléfono de cliente con formato internacional sucio (`+34 (654) 11-22-33`) | Sanitizado a `34654112233` antes de montar el link `wa.me` |
| 17 | Cancel Reservation | Usuario cancela el diálogo de confirmación del navegador | No se ejecuta `updateDoc`, el estado permanece intacto |

---

## 9. Plan de Implementación para M4 Worker

1. **Paso 1: `src/admin.ts` — Implementar y exportar `normalizeCloudinaryUrl`:**
   - Escribir la función con tipado estricto.
   - Refactorizar `uploadToCloudinary` para usar `normalizeCloudinaryUrl(data.secure_url, 800)`.
   - Limpiar cualquier sufijo `?v=` en la persistencia de secciones (`site_content`).
2. **Paso 2: `admin.html` & `src/style.css` — Implementar el panel de 16 chips de alérgenos:**
   - Inyectar el contenedor `#allergen-chips-container` con los 16 botones `.tag-chip`.
   - Agregar estilos en `src/style.css`.
   - Conectar sincronización en `src/admin.ts`: inicialización de clics, carga en `openEditModal`, vaciado en `openCreateModal` y extracción en el evento `submit`.
3. **Paso 3: `src/admin.ts` — Validación y Previsualización Instantánea:**
   - Implementar `validateUploadFile`.
   - Conectar listeners `change` en inputs de archivo con `URL.createObjectURL(file)` y liberación con `URL.revokeObjectURL`.
4. **Paso 4: `src/admin.ts` — Unificación de Galería en Firestore `gallery_items`:**
   - Eliminar imports y referencias a `storage` y `restaurante-assets`.
   - Implementar `loadGalleryAdmin` leyendo `gallery_items` ordenados por `created_at desc`.
   - Implementar guardado en `gallery_items` tras subir a Cloudinary.
   - Implementar borrado con `deleteDoc(doc(db, 'gallery_items', id))`.
   - Actualizar `src/main.ts` para que `loadGallery()` consuma `gallery_items` de Firestore.
5. **Paso 5: `admin.html` & `src/admin.ts` — Operativa de Reservas y Filtros:**
   - Inyectar pestañas `.res-tab-btn` en `admin.html`.
   - Renderizar botones `.btn-confirm-res`, `.btn-cancel-res`, `.btn-wa-client` por fila en `loadReservations()`.
   - Conectar mutaciones Firestore y apertura de WhatsApp.
6. **Paso 6: Verificación y Certificación:**
   - Ejecutar `npm run pipeline` (validar compilación TS y build Vite).
   - Ejecutar `npm run test:all` (validar que los 87 tests actuales se mantienen en verde).
