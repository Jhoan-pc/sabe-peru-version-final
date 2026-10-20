# Especificación Formal del Panel de Administración y Pipeline Multimedia (Admin Spec)
**Estándar:** Backoffice Blindado y Gestión Multimedia Unificada  
**Estado:** Aprobado para Especificación (Sin ejecución de código aún)  
**Versión:** 1.0.0  
**Responsable Técnico:** `especialista_admin_backoffice`

---

## 1. Diagnóstico y Decisión Arquitectónica: Unificación en Cloudinary

### A. Causa Raíz de los Bugs Actuales
En el código heredado de [`src/admin.ts`](file:///c:/Users/Martin/Documents/Trabajo/sabeaperu/src/admin.ts), existía un conflicto arquitectónico crítico:
* La función de subida de galería enviaba los archivos a **Cloudinary** (`https://api.cloudinary.com/...`).
* La función de renderizado y borrado de galería consultaba a **Google Firebase Storage** (`restaurante-assets/`).
* Múltiples funciones aplicaban reemplazos de cadenas sucesivos (`replace('/upload/', '/upload/f_auto...')`), corrompiendo las URLs en sucesivas ediciones.

### B. Decisión Inmutable de la Especificación
1. **Cloudinary es la ÚNICA fuente de almacenamiento y transformación de imágenes** del sistema (Platos, CMS del Sitio y Galería).
2. Se extingue el uso de Firebase Storage para la galería.
3. Se crea una colección unificada en Firestore: **`gallery_items`**, donde cada documento almacena:
   ```typescript
   {
     id: string;               // Document ID
     public_id: string;        // Cloudinary Public ID
     secure_url: string;       // URL limpia sin flags repetidos
     created_at: string;       // ISO 8601
     caption_title?: string;
     caption_desc?: string;
   }
   ```

---

## 2. Pipeline de Normalización de URLs de Cloudinary

Queda terminantemente prohibido hacer reemplazos directos de texto mediante expresiones regulares manuales sobre strings en los controladores.

### Contrato de la Función Normalizadora:
Toda URL de Cloudinary pasará obligatoriamente por una función pura y determinista:

```typescript
export function normalizeCloudinaryUrl(url: string, width = 800): string {
  if (!url || !url.includes('cloudinary.com')) return url || '';
  
  // Limpiar cualquier parámetro de query ensuciado (?v=...)
  const cleanUrl = url.split('?')[0];

  // Extraer el prefijo hasta /upload/ y el sufijo con la ruta de la imagen
  const uploadIndex = cleanUrl.indexOf('/upload/');
  if (uploadIndex === -1) return cleanUrl;

  const base = cleanUrl.substring(0, uploadIndex + 8);
  let rest = cleanUrl.substring(uploadIndex + 8);

  // Si ya existían transformaciones previas, descartarlas para evitar duplicación
  const parts = rest.split('/');
  if (parts.length > 1 && parts[0].includes('_')) {
    parts.shift(); // Elimina el segmento antiguo de transformaciones
    rest = parts.join('/');
  }

  // Inyectar el estándar oficial de alta gama
  return `${base}f_auto,q_auto,w_${width},c_limit/${rest}`;
}
```

---

## 3. Contratos de Subida y Previsualización en Vivo

### A. Reglas de Validación Pre-Carga
* **Tamaño Máximo:** 10 MB por archivo. Si excede, bloquear la subida inmediatamente y mostrar un toast de advertencia.
* **Formatos Aceptados:** `image/jpeg`, `image/png`, `image/webp`.

### B. Previsualización Instantánea (Zero-Latency Preview)
* Al seleccionar un archivo en el input (`change`), el navegador debe renderizar de inmediato la previsualización usando `URL.createObjectURL(file)`.
* Estado de carga visible: Deshabilitación del botón "Guardar" y spinner mientras se ejecuta el `fetch` con `upload_preset: "sabeaperu_firm"`.
* Tras la respuesta exitosa de Cloudinary, reemplazar la URL temporal por la `secure_url` normalizada.

---

## 4. Selector Visual de Alérgenos (Chips / Checkboxes)

### A. Derogación del Campo de Texto Libre
* Queda derogado el input de texto libre donde se escribía `pescado, picante`.

### B. Nuevo Contrato de Interfaz
* Se modela un panel de selección con botones estilo chip para los 16 alérgenos oficiales del enum `AllergenTag` ([`specs/openapi.yaml`](file:///c:/Users/Martin/Documents/Trabajo/sabeaperu/specs/openapi.yaml)):
  * `pescado`, `marisco`, `carne`, `pollo`, `picante`, `gluten-free`, `gluten`, `huevos`, `lacteos`, `soja`, `cacahuetes`, `mostaza`, `crustaceos`, `apio`, `moluscos`, `sesamo`.
* Cada chip tiene estado activo/inactivo con un clic (`tag-chip.active`).
* Al guardar, se extraen exclusivamente las claves válidas en un array limpio de strings: `tags: string[]`.

---

## 5. Módulo de Gestión Operativa de Reservas

La tabla de reservas pasa de ser un visor estático a un **centro de operaciones de sala**:

### A. Acciones por Fila de Reserva
1. **Botón Confirmar (`btn-confirm-res`):**
   - Mutación en Firestore: `updateDoc(doc(db, 'reservations', id), { status: 'confirmed' })`.
   - Feedback visual: La fila se resalta con badge verde de *Confirmada*.
2. **Botón Cancelar (`btn-cancel-res`):**
   - Modal de confirmación: *"¿Desea cancelar esta reserva y liberar el cupo?"*.
   - Mutación: `updateDoc(..., { status: 'cancelled' })`. Libera automáticamente la franja horaria para nuevos clientes.
3. **Botón WhatsApp Directo (`btn-wa-client`):**
   - Abre ventana de chat directa con el cliente:
     `https://wa.me/{telefono_limpio}?text=Hola%20{nombre},%20le%20escribimos%20de%20Sabe%20a%20Perú%20respecto%20a%20su%20reserva...`

### B. Filtros de Gestión Rápida
* Pestañas en la cabecera de la tabla:
  - `Pendientes` (Default, ordenadas por fecha próxima).
  - `Hoy` (Todas las reservas de la fecha actual).
  - `Todas` (Histórico completo).

---

## 6. Criterios de Aceptación QA para Backoffice

1. [ ] **100% Coherencia en Galería:** Toda imagen subida desde el admin debe aparecer inmediatamente en la cuadrícula del admin y en la galería pública de `index.html`.
2. [ ] **0 URLs Duplicadas:** Ninguna URL almacenada en Firestore podrá contener cadenas repetidas (`/f_auto.../f_auto...`).
3. [ ] **0 Consultas Cruzadas:** La pestaña de galería no debe invocar ninguna función del SDK de Firebase Storage.
4. [ ] **Integridad de Tags:** La carta pública no debe perder el filtrado de ningún plato debido a erratas tipográficas en los alérgenos.
