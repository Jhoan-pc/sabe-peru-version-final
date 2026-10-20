# Catálogo e Inventario Integral de Especificaciones (SDD Master Mining)

**Proyecto:** Restaurante Sabe a Perú  
**Versión de Especificación:** 2.0.0-SDD  
**Fecha de Minado:** 2026-10-09  
**Agente Minador:** `teamwork_preview_spec_miner_1` (Spec Miner)  
**Fuente Única de la Verdad (SSOT):** `specs/SDD_MASTER.md`, `specs/openapi.yaml`, `specs/design-system-spec.md`, `specs/performance-spec.md`, `specs/admin-spec.md`, `package.json`

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | WPO & Assets | Erradicación de Doble Render (Ghost Loading) | Eliminar 10 etiquetas `<img>` residuales de Supabase en `#main-gallery-grid` e inicializar con contenedor/skeleton de dimensiones fijas (min 400px / 55vh) | HTML inicial `#main-gallery-grid` | Grid limpio sin descargas fantasma | Contenedor mantiene dimensiones reservadas para evitar CLS | `specs/performance-spec.md`, `specs/SDD_MASTER.md` |
| 2 | WPO & Fonts | Critical CSS & Carga Asíncrona de Fuentes | Sustituir directiva `@import` síncrona en `src/style.css` por `<link rel="preconnect">` y `<link rel="stylesheet">` con `display=swap` en el `<head>` de los HTML | Petición HTTP a Google Fonts | Carga asíncrona no bloqueante de fuentes | Fallback a fuentes del sistema sans-serif/serif sin FOUT/FOIT prolongado | `specs/performance-spec.md`, `src/style.css` |
| 3 | WPO & LCP | Prioridad LCP en Hero Slide | Configurar la primera imagen visible del Hero con `fetchpriority="high"`, `loading="eager"` y `decoding="async"`, reservando `loading="lazy"` para el resto | HTML `#img-hero-1` | Priorización en cola de red del navegador | Carga nativa del navegador sin depender de ejecución de scripts | `specs/performance-spec.md`, `ORIGINAL_REQUEST.md` |
| 4 | WPO & Scroll | Scroll Desacoplado con IntersectionObserver | Reemplazar listeners continuos de scroll con llamadas a `getBoundingClientRect` por un único `IntersectionObserver` pasivo (`rootMargin: '0px 0px -80px 0px', threshold: 0.1`) con `unobserve` tras activación | Intersección en viewport de elementos `.reveal` | Clase `.active` añadida a 60 fps | Si IntersectionObserver no está soportado, degradación segura con visualización estándar | `specs/performance-spec.md`, `specs/SDD_MASTER.md` |
| 5 | WPO & Timers | Pausa Inteligente de Bucle/Carrusel | Pausar intervalos `setInterval` de hero slideshow (5s) y auto-scroll de galería (4s) cuando la pestaña está oculta, el elemento fuera de viewport o bajo interacción táctil/hover | Eventos `visibilitychange`, `mouseenter`, `touchstart` | Detención de ticks innecesarios de CPU | Reanudación limpia al volver a ser visible | `specs/performance-spec.md`, `src/main.ts` |
| 6 | Design System | Paleta Cromática "Quiet Luxury" | Aplicación estricta de tokens: Negro Obsidiana (`#0b0b0b`), Carbón Pizarra (`#141414`), Marfil Cálido (`#f5f2eb`), Oro Champán (`#c5a880`), Carmín Mineral Andino (`#8b1e22`) | Variables CSS `:root` | Estética visual sobria y armónica | Descarte de colores primarios saturados (`#e31e24`, `#ffffff` plano) | `specs/design-system-spec.md` |
| 7 | Design System | Supresión de Marco Marrón 80px y Monos Nazca | Eliminar borde tosco `border: 80px solid #2e2620` y pseudoelementos con SVGs de animales y drop-shadows amarillos en `.page-carta .section-container` | Estilos CSS `.page-carta .section-container` | Contenedor con borde hairline de 1px (`rgba(197, 168, 128, 0.18)`) | Espacio negativo limpio sin desbordamientos visuales | `specs/design-system-spec.md`, `src/style.css` |
| 8 | Design System | Eliminación de Bucle Reflectante (*Shiny Button*) | Derogar la animación `shiny-button 3s infinite` en los botones de fotos de platos y sustituir el botón píldora por el enlace editorial minimalista `FOTOGRAFÍA` | Marcador HTML botón foto | Enlace tipográfico de 10px con línea inferior sutil en hover | Sin elementos reflectantes infinitos en pantalla | `specs/design-system-spec.md`, `src/style.css` |
| 9 | Design System | Estandarización a 2 Familias Tipográficas | Restricción del sistema tipográfico a Serif editorial (*Cormorant Garamond* / *Playfair Display*) para títulos y Sans-Serif geométrica (*Inter* / *Montserrat*) con tracking amplio para micro-copy | Fuentes cargadas | Jerarquía visual clara y monumental | Prohibición de importar más de 2 familias tipográficas | `specs/design-system-spec.md` |
| 10 | Menu & Carta | Erradicación de Emojis en Titulares | Eliminación de emojis duros (`🐟`, `🦐`, `🥩`, `🍗`, `🌶️`, `🌾`, etc.) en nombres de platos y títulos de subcategorías en `src/main.ts` | Colección Firestore `menu_items` | Títulos limpios en tipografía Serif 1.35rem | Sin emojis en el DOM | `specs/SDD_MASTER.md`, `ORIGINAL_REQUEST.md` |
| 11 | Menu & Carta | Micro-Etiquetas Sobrias de Alérgenos | Inyección de micro-etiquetas tipográficas monocromáticas (`.allergen-pill`, 9px uppercase Sans `--lux-text-muted`) basadas en el enum `AllergenTag` | Array `tags: AllergenTag[]` | Elementos `<span class="allergen-pill">TAG</span>` | Si tag no existe en enum, se omite o normaliza | `specs/design-system-spec.md`, `specs/openapi.yaml` |
| 12 | Menu & Carta | Resiliencia de Precios Duales | Platos con `price > 0` muestran formato numérico `XX.XX€`; platos con `price == 0` delegan su descripción como indicación de mercado (*"Precio según mercado"*) | Atributo `price` y `description` | Formateo numérico o texto descriptivo | Precio negativo bloqueado por contrato | `specs/SDD_MASTER.md`, `specs/openapi.yaml` |
| 13 | Menu & Carta | Trigger Editorial Minimalista de Fotografía | Sustitución del botón píldora con cámara por botón accesible `dish-photo-trigger` con etiqueta textual `FOTOGRAFÍA` y modal limpio | Atributo `image_url` en plato | Modal con imagen optimizada y bloqueo de scroll | Si plato no tiene foto, no se renderiza botón | `specs/design-system-spec.md`, `src/main.ts` |
| 14 | Admin & Media | Función Pura `normalizeCloudinaryUrl` | Normalización obligatoria y determinista de URLs de Cloudinary: inyección de `f_auto,q_auto,w_800,c_limit` y eliminación de parámetros sucios `?v=` | String de URL | URL estandarizada limpia | Si URL no es de Cloudinary, se retorna inalterada | `specs/admin-spec.md` |
| 15 | Admin & Media | Unificación de Galería en Firestore `gallery_items` | Migración total de la galería a Firestore `gallery_items`, eliminando toda consulta o manipulación en Firebase Storage (`restaurante-assets/`) | Documentos Firestore `gallery_items` | Renderizado unificado en admin y home | Fallback automático a los 8 activos locales en `/assets/` en caso de desconexión | `specs/admin-spec.md`, `specs/SDD_MASTER.md` |
| 16 | Admin & Media | Selector Visual de Alérgenos (Chips Interactivos) | Reemplazo del input de texto libre por panel de selección con botones estilo chip para los 16 alérgenos oficiales de `AllergenTag` | Selección de chips por el usuario | Array estructurado `tags: string[]` | Entrada de texto libre descartada | `specs/admin-spec.md`, `specs/openapi.yaml` |
| 17 | Admin & Media | Previsualización Instantánea (Zero-Latency) | Renderizado inmediato de la imagen seleccionada en el admin mediante `URL.createObjectURL(file)` antes de iniciar la subida a Cloudinary | Archivo local `File` (máx 10MB) | `blob:url` en elemento `<img>` preview | Archivo > 10MB o tipo no admitido genera toast de error y bloquea carga | `specs/admin-spec.md` |
| 18 | Admin & Operations | Botones Operativos en Tabla de Reservas | Incorporación de acciones por fila: `Confirmar` (status `confirmed`), `Cancelar` (modal + status `cancelled` liberando aforo), `WhatsApp` (deep link con mensaje prellenado) | Fila de reserva en tabla admin | Mutación de estado en Firestore / Apertura de chat | Confirmación modal previa antes de cancelar | `specs/admin-spec.md` |
| 19 | Admin & Operations | Filtros Rápidos de Sala de Reservas | Pestañas de filtrado en cabecera de tabla admin: `Pendientes` (default), `Hoy` (fecha actual), `Todas` (histórico) | Clic en pestaña de filtro | Filtrado en memoria o consulta filtrada | Sin reservas muestra estado vacío sobrio | `specs/admin-spec.md` |
| 20 | Booking & UX | Flujo Anti-Bloqueo de Popup de WhatsApp | Prohibición de `window.open` asíncrono; flujo de dos pasos con guardado en Firebase + tarjeta de confirmación en pantalla con botón voluntario a WhatsApp | Envío de formulario de reserva | Registro en Firestore + renderizado de tarjeta con enlace WhatsApp | Detección de errores con toast RFC 9457 (prohibido `alert()`) | `specs/SDD_MASTER.md`, `ORIGINAL_REQUEST.md` |
| 21 | Booking & Domain | Generación de Localizador Único (`SP-XXXX`) | Creación de identificador transaccional único para la reserva (`SP-` seguido de 4 caracteres alfanuméricos) visible en la confirmación y mensaje | Datos de la reserva | Código localizador asignado | Generación determinista o pseudoaleatoria garantizada | `ORIGINAL_REQUEST.md`, `specs/SDD_MASTER.md` |
| 22 | Booking & Domain | Regla de Capacidad Ordinaria (< 4 Mesas) | Validación de aforo por franja horaria de 30 min en `KITCHEN_HOURS`: máximo 4 reservas activas simultáneas (`status != 'cancelled'`) | Fecha y hora de reserva | Disponibilidad booleana `available: true/false` | Si cupo >= 4, se marca hora como no disponible | `specs/SDD_MASTER.md`, `src/reservations.ts` |
| 23 | Booking & Domain | Regla de Grupos Especiales (> 6 Comensales) | Separación de lógica: 1 a 6 comensales validación automática; > 6 comensales advertencia y solicitud de confirmación para mesa imperial | Campo `number_of_people` | Advertencia en UI y nota en solicitud | Bloqueo o advertencia si excede límite máximo de 20 pax | `specs/SDD_MASTER.md`, `ORIGINAL_REQUEST.md` |
| 24 | Error Handling | Manejo Formal de Errores RFC 9457 | Prohibición absoluta de `alert()` nativo; todo error de reserva o carta se mapea a Problem Details (`title`, `detail`, `status`) y se muestra en toasts flotantes | Excepción o código de error | Toast flotante estilizado con tokens Quiet Luxury | Formato `application/problem+json` serializado | `specs/SDD_MASTER.md`, `specs/openapi.yaml` |
| 25 | API Contract | OpenAPI 3.1 Contrato Formal Completo | Definición exhaustiva de rutas (`/reservations/availability`, `/reservations`, `/menu`, `/site-content`, `/media/upload`, `/gallery`, `/admin/*`) y esquemas | Especificación OpenAPI YAML | Contrato formal SSOT para clientes y backend | Códigos HTTP estandarizados (200, 201, 204, 400, 401, 404, 422) | `specs/openapi.yaml` |
| 26 | CI/CD Pipeline | Pipeline de Integración (`npm run pipeline`) | Verificación estricta de compilación y tipado TypeScript junto con empaquetado Vite (`tsc --noEmit && vite build`) | Código fuente TypeScript y assets | Bundle listo en `dist/` con exit code 0 | Cualquier error de tipado o importación aborta el pipeline | `package.json`, `ORIGINAL_REQUEST.md` |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | `normalizeCloudinaryUrl` | URL vacía o `null` | Retorna string vacío `""` sin lanzar excepciones |
| 2 | `normalizeCloudinaryUrl` | URL sin dominio `cloudinary.com` (ej: `/assets/Hero1.webp`) | Retorna la URL original intacta sin aplicar transformaciones |
| 3 | `normalizeCloudinaryUrl` | URL con parámetros de versión sucios (ej: `https://res.cloudinary.com/.../img.jpg?v=1774907`) | Elimina el sufijo `?v=...` y formatea la URL limpia |
| 4 | `normalizeCloudinaryUrl` | URL con transformaciones previas duplicadas (ej: `/upload/f_auto,q_auto/v1/dish.jpg`) | Descarta el segmento anterior con guiones bajos y genera exactamente un único segmento `f_auto,q_auto,w_800,c_limit/` |
| 5 | `normalizeCloudinaryUrl` | Ancho personalizado `width = 1200` | Reemplaza `w_800` por `w_1200` respetando `f_auto,q_auto,c_limit` |
| 6 | `MenuItem` Precios Duales | Plato con `price: 0` | Muestra `description` como texto de precio (*"Precio según mercado"*) y añade clase CSS `.menu-item-price.dual` |
| 7 | `MenuItem` Precios Duales | Plato con `price: 24.5` | Muestra precio numérico formateado como `24.50€` con dos decimales |
| 8 | `AllergenTag` Enum | Plato con tag desconocido o errata tipográfica (ej: `"pescadoo"`) | Filtrado estricto por enum descarta el tag inválido, evitando chips o etiquetas rotas |
| 9 | `Reservation` Aforo | Franja con exactamente 4 reservas no canceladas | Franja retorna `available: false`, `reason: "Completo"` y se deshabilita en el `<select>` |
| 10 | `Reservation` Cancelación | Reserva previamente `confirmed` cambia a `cancelled` | La franja horaria correspondiente recalcula ocupación y vuelve a estar `available: true` |
| 11 | `Reservation` Grupos | `number_of_people: 7` (> 6) | Muestra advertencia de mesa imperial y requerimiento de confirmación directa con el maître |
| 12 | `Reservation` Grupos | `number_of_people: 25` (> 20) | Falla validación de esquema OpenAPI (`maximum: 20`), emitiendo Problem Details RFC 9457 |
| 13 | Fallback de Galería | CDN Cloudinary o Firestore sin conexión / vacío | Se activa fallback suave e inmediato a los 8 activos locales inmutables en `/assets/` |
| 14 | Admin Subida Imagen | Archivo que excede 10 MB (ej: foto RAW de 15 MB) | Se rechaza antes de invocar la red, se muestra toast de error y no se consume cuota de CDN |
| 15 | WhatsApp Anti-Bloqueo | Usuario envía formulario en móvil Safari / iOS | Se almacena la reserva en Firestore, se genera el localizador `SP-XXXX` y se muestra el botón interactivo de WhatsApp sin ser bloqueado por el navegador |
| 16 | Animaciones & Título | Usuario minimiza pestaña o cambia de ventana | Evento `visibilitychange` (`hidden`) pausa inmediatamente los timers de slideshow y autoscroll, reanudándolos al regresar |

---

## 1. Catálogo Completo de Deuda Técnica ([DT-01] a [DT-13])

A partir del análisis exhaustivo de `specs/SDD_MASTER.md`, `ORIGINAL_REQUEST.md`, `specs/design-system-spec.md`, `specs/performance-spec.md` y `specs/admin-spec.md`, se establece la matriz canónica de deuda técnica:

### [DT-01] Duplicación de Código Estático HTML (Falta de Componentización)
- **Categoría:** Arquitectura de Código & HTML
- **Archivos Afectados:** `index.html`, `carta.html`, `experiencia.html`, `admin.html`
- **Diagnóstico y Requisitos:**
  - El encabezado con el SVG detallado del chullo, la barra de navegación móvil, el pie de página con horarios y datos de contacto, y los modales de fotos están replicados de forma idéntica en los cuatro archivos HTML.
  - Modificar un teléfono o un horario requiere editar manualmente 4 archivos, generando desincronizaciones entre páginas.
  - Para la versión v2.0 (Vite Vanilla MPA) se mantiene Vite para asegurar 0 KB de sobrecarga de React y build en ~1.2s, pero se requiere saneamiento y alineación estricta de todos los fragmentos estáticos.
  - Se define como camino evolutivo formal para v3.0 la adopción de Astro (componentes `.astro` estáticos con 0 KB de JS y SSR/SSG).
- **Criterios de Aceptación:**
  - Los datos de contacto, enlaces de navegación y estructuras de cabecera/pie son consistentes en todas las páginas.
- **Mapeo de Fase:** Fase 1 y Fase 2 (con roadmap futuro a Astro).

### [DT-02] Manipulación Imperativa del DOM con `innerHTML`
- **Categoría:** Lógica Frontend & Seguridad
- **Archivos Afectados:** `src/main.ts` (líneas 33, 60, 206, 228, 259-296, 419, 463-475, 614), `src/admin.ts` (líneas 149, 205, 535, 576, 633, 646)
- **Diagnóstico y Requisitos:**
  - La carta, la galería y las tablas de administración se renderizan mediante concatenación manual de cadenas HTML inyectadas en `innerHTML`.
  - No existe validación de esquemas en tiempo de renderizado ni protección formal contra inyecciones de código.
  - Debe estructurarse la renderización validando previamente que los datos se ajusten a los contratos tipados de OpenAPI (`MenuItemOutput`, `GalleryItem`, etc.).
- **Criterios de Aceptación:**
  - La renderización respeta estrictamente los tipos TypeScript generados del contrato.
  - Escapado y formateo seguro de contenido antes de su inserción en el DOM.
- **Mapeo de Fase:** Fase 3 (Carta) y Fase 4 (Admin).

### [DT-03] Contaminación Visual Anti-Lujo en la Carta
- **Categoría:** Identidad Visual & UI Haute Cuisine
- **Archivos Afectados:** `src/main.ts` (líneas 240-257, 274, 276-285, 448, 450), `src/style.css` (líneas 1403-1463), `carta.html`, `index.html`
- **Diagnóstico y Requisitos:**
  - Inyección de emojis duros (`🐟`, `🦐`, `🥩`, `🍗`, `🌶️`, `🌾`, `🥚`, `🥛`, `🫘`, `🥜`, `🟡`, `🥬`, `🦪`, `🥯`, `📸`, `🍸`, `🍰`) en nombres de platos, categorías y botones.
  - Presencia del botón píldora `.item-photo-btn` con gradiente reflectante en bucle infinito (`animation: shiny-button 3s infinite`), impropio de un restaurante de alta gama.
  - Se exige eliminar todos los emojis en titulares de platos y sustituirlos por micro-etiquetas tipográficas sobrias (`.allergen-pill`, 9px mayúsculas, color `--lux-text-muted`) basadas en el enum `AllergenTag`.
  - Se exige derogar el botón píldora y sustituirlo por el enlace editorial minimalista `dish-photo-trigger` (`FOTOGRAFÍA` con línea animada).
- **Criterios de Aceptación:**
  - 0 emojis en títulos de platos y subcategorías.
  - Micro-etiquetas tipográficas monocromáticas sobrias.
  - Enlace editorial minimalista para fotografías de platos.
- **Mapeo de Fase:** Fase 3.

### [DT-04] Almacenamiento Multimedia Híbrido y Enlaces Fantasma
- **Categoría:** Arquitectura de Multimedia & CDNs
- **Archivos Afectados:** `src/main.ts` (líneas 380-484), `src/admin.ts` (líneas 530-625), `index.html` (líneas 218-260), `experiencia.html` (líneas 98-116), `admin.html`
- **Diagnóstico y Requisitos:**
  - Convivencia caótica de tres orígenes: activos locales en `/assets/`, 10 URLs cableadas a Supabase Storage en el HTML, consultas de galería a Firebase Storage (`restaurante-assets/`), y subidas a Cloudinary en el admin.
  - La galería pública de `main.ts` leía de Firebase Storage, mientras que el admin subía imágenes a Cloudinary pero borraba de Firebase Storage.
  - Se decreta la unificación del 100% del contenido multimedia en Cloudinary y la extinción de Firebase Storage para la galería.
  - Se crea la colección canónica Firestore `gallery_items` (`id`, `public_id`, `secure_url`, `created_at`, `caption_title`, `caption_desc`).
- **Criterios de Aceptación:**
  - 0 referencias activas a Firebase Storage en la gestión de galería.
  - Todos los activos multimedia residen exclusivamente en Cloudinary.
  - Colección `gallery_items` alimenta de forma unificada tanto el backoffice como la web pública.
- **Mapeo de Fase:** Fase 1 y Fase 4.

### [DT-05] Corrupción de URLs en Cloudinary
- **Categoría:** Integridad de Datos & Pipeline CDN
- **Archivos Afectados:** `src/admin.ts` (líneas 20, 445), `src/main.ts` (líneas 316-322)
- **Diagnóstico y Requisitos:**
  - Sustituciones artesanales de cadenas mediante `.replace('/upload/', ...)` provocan duplicación anidada de directivas (`/upload/f_auto.../f_auto...`) en ediciones sucesivas.
  - Adición de sufijos de versión `?v=` que invalidan la caché edge de Cloudinary.
  - Se requiere la implementación de la función pura determinista `normalizeCloudinaryUrl(url: string, width = 800): string`.
- **Criterios de Aceptación:**
  - Todas las URLs guardadas en Firestore o renderizadas pasan por `normalizeCloudinaryUrl`.
  - Formato estandarizado sin banderas repetidas: `f_auto,q_auto,w_{width},c_limit`.
  - Erradicación total de sufijos `?v=`.
- **Mapeo de Fase:** Fase 4.

### [DT-06] Residuos de Supabase en Base de Código
- **Categoría:** Código Muerto & Dependencias Huérfanas
- **Archivos Afectados:** `src/supabase.ts`, `index.html` (líneas 22, 218-260), `experiencia.html` (líneas 98-116), scripts sueltos en raíz (`check_db.js`, `check_bucket.js`), `package.json`
- **Diagnóstico y Requisitos:**
  - Existencia de archivos de configuración y endpoints hacia Supabase en un proyecto cuya base de datos operativa real es 100% Google Firebase Firestore.
  - `package.json` incluye `"@supabase/supabase-js": "^2.104.1"` como dependencia no utilizada en producción.
  - Se exige erradicar toda referencia activa a Supabase en el código de producción de `src/` y en los enlaces multimedia del HTML.
- **Criterios de Aceptación:**
  - 0 referencias activas a Supabase en los archivos fuente de `src/`.
  - 0 URLs a `xdslypbjmenthwyrarui.supabase.co` en el HTML de producción.
- **Mapeo de Fase:** Fase 1.

### [DT-07] Archivo Semilla Huérfano
- **Categoría:** Arquitectura de Datos & SSOT
- **Archivos Afectados:** `backup_menu_items.json`
- **Diagnóstico y Requisitos:**
  - Presencia del archivo `backup_menu_items.json` en la raíz del proyecto que puede inducir a confusión sobre la procedencia de los platos.
  - Se establece formalmente que la única fuente de datos viva es la colección `menu_items` de Firestore. El archivo JSON queda exclusivamente como artefacto estático congelado / semilla histórica.
- **Criterios de Aceptación:**
  - El código de la aplicación consulta exclusivamente Firestore `menu_items`.
  - Ningún módulo de producción importa o lee en tiempo de ejecución archivos JSON locales de carta.
- **Mapeo de Fase:** Fase 1 y Fase 3.

### [DT-08] Bloqueo del Hilo Principal por Fuentes
- **Categoría:** Rendimiento Web & Critical Rendering Path
- **Archivos Afectados:** `src/style.css` (línea 1), `index.html`, `carta.html`, `experiencia.html`, `admin.html`
- **Diagnóstico y Requisitos:**
  - Directiva `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display...&family=Inter...&family=Cinzel...&family=Cormorant+Garamond...&family=DM+Serif+Display...&family=Lato...&family=Montserrat...&family=Open+Sans...&display=swap');` en la primera línea de `src/style.css` que importa 8 familias tipográficas de manera síncrona, bloqueando el renderizado y degradando el FCP.
  - Se exige eliminar `@import` de CSS y cargar de forma asíncrona exactamente las 2 familias oficiales mediante `<link rel="preconnect">` en el `<head>` de los HTML con `&display=swap`.
- **Criterios de Aceptación:**
  - 0 sentencias `@import` en `src/style.css`.
  - `<head>` de todos los HTML con `<link rel="preconnect" href="https://fonts.googleapis.com">` y `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`.
  - Carga restringida a las dos familias oficiales: Cormorant Garamond / Playfair Display e Inter / Montserrat.
- **Mapeo de Fase:** Fase 1.

### [DT-09] Sobrecarga de Renderizado por Scroll
- **Categoría:** Rendimiento WPO & CPU Main Thread
- **Archivos Afectados:** `src/main.ts` (líneas 108-114, 159-175, 183-199)
- **Diagnóstico y Requisitos:**
  - Múltiples listeners `window.addEventListener('scroll', ...)` que ejecutan en cada cuadro `getBoundingClientRect().top`, `offsetTop`, `pageYOffset` forzando *layout recalculations* (reflows sincrónicos) y provocando caídas de frames en móviles.
  - Se exige refactorizar el efecto reveal a un único `IntersectionObserver` pasivo con `unobserve(entry.target)` una vez visible.
  - Para listeners continuos indispensables (ej. header fijo), declarar `{ passive: true }` y amortiguar con bandera o `requestAnimationFrame`.
- **Criterios de Aceptación:**
  - 0 advertencias en consola de tipo *"Added non-passive event listener to a scroll-blocking event"*.
  - Desplazamiento fluido garantizado a 60 fps.
- **Mapeo de Fase:** Fase 1.

### [DT-10] Doble Renderizado en Galería (Ghost Loading)
- **Categoría:** Rendimiento de Red & Desperdicio de Ancho de Banda
- **Archivos Afectados:** `index.html` (líneas 216-261), `src/main.ts` (líneas 378-484)
- **Diagnóstico y Requisitos:**
  - En `index.html`, `#main-gallery-grid` contiene 10 etiquetas `<img>` cableadas a Supabase. El navegador descarga estas 10 imágenes al parsear el HTML, pero tan pronto se ejecuta `main.ts`, la función `loadGallery` ejecuta `galleryGrid.innerHTML = ''`, destruyendo las 10 imágenes y descargando otras nuevas desde el bucket.
  - Esto duplica el consumo de red en el primer render, empeora el LCP y genera saltos visuales.
  - Se exige eliminar las 10 etiquetas `<img>` estáticas del HTML e inicializar el contenedor con altura reservada fija (`height: 55vh; min-height: 400px;`) o esqueleto semántico.
- **Criterios de Aceptación:**
  - 0 descargas fantasma en el panel Network de DevTools.
  - `#main-gallery-grid` inicia limpio sin etiquetas de imágenes rotas o descartadas.
- **Mapeo de Fase:** Fase 1.

### [DT-11] Vulnerabilidad de Bloqueo de Popup en WhatsApp
- **Categoría:** Experiencia de Usuario Móvil & Conversión
- **Archivos Afectados:** `src/main.ts` (líneas 611-633), `src/reservations.ts`, `index.html`, `experiencia.html`
- **Diagnóstico y Requisitos:**
  - En `src/main.ts`, tras recibir el formulario de reserva, se ejecuta `await addDoc(...)` de forma asíncrona y posteriormente `window.open(waUrl, '_blank')`. Al ocurrir tras una promesa asíncrona, los navegadores móviles (Safari en iOS y Chrome en Android) consideran la llamada como popup no solicitado y la bloquean sistemáticamente.
  - Se exige sustituir el `window.open` automático por un flujo en dos pasos: 1) Registro de la reserva en Firestore en estado `pending`, 2) Renderizado en pantalla de una tarjeta de confirmación de estilo conserjería con localizador único (`SP-XXXX`) y un botón de enlace directo donde el usuario pulsa voluntariamente para abrir WhatsApp sin sufrir bloqueo de popup.
- **Criterios de Aceptación:**
  - 0 popups bloqueados en navegadores móviles.
  - Confirmación inmediata en pantalla con botón explícito de apertura voluntaria de WhatsApp.
- **Mapeo de Fase:** Fase 5.

### [DT-12] Ausencia de Confirmación Transaccional
- **Categoría:** Operativa de Reservas & Fidelización
- **Archivos Afectados:** `src/main.ts`, `src/reservations.ts`, `specs/openapi.yaml`
- **Diagnóstico y Requisitos:**
  - El sistema no generaba un localizador formal único visible para el cliente ni proporcionaba resumen transaccional claro.
  - Se exige la creación sistemática del código localizador `SP-XXXX` y su inclusión en la tarjeta de confirmación y en el texto predeterminado del mensaje de WhatsApp.
- **Criterios de Aceptación:**
  - Toda reserva genera un localizador único identificable con formato `SP-XXXX`.
  - El cliente visualiza su identificador y resumen de datos antes de salir de la página.
- **Mapeo de Fase:** Fase 5.

### [DT-13] Pasividad en el Backoffice
- **Categoría:** Operativa del Maître & Gestión de Sala
- **Archivos Afectados:** `src/admin.ts` (líneas 630-656), `admin.html` (líneas 617-636)
- **Diagnóstico y Requisitos:**
  - La tabla de reservas en el panel de administración era meramente informativa y estática (solo lectura de fecha, hora, cliente, pax, contacto, motivo).
  - No permitía al maître confirmar, cancelar ni contactar al comensal directamente.
  - Se exige incorporar botones de acción operativa en cada fila: `Confirmar` (`btn-confirm-res`, muta estado a `confirmed`), `Cancelar` (`btn-cancel-res`, modal de confirmación y muta a `cancelled` liberando el aforo de la franja) y `WhatsApp` (`btn-wa-client`, abre chat directo con el número del cliente con saludo prellenado).
  - Se exige incorporar pestañas de filtrado rápido: `Pendientes` (por defecto), `Hoy` (reservas de la jornada) y `Todas` (histórico).
- **Criterios de Aceptación:**
  - El maître puede confirmar, cancelar y abrir chats de WhatsApp con clientes con un solo clic.
  - La cancelación actualiza el aforo y libera de inmediato la franja para nuevos comensales.
- **Mapeo de Fase:** Fase 4.

---

## 2. Contratos y Esquemas (OpenAPI 3.1 & Modelos de Datos)

### 2.1. Información General del Contrato
- **Documento:** `specs/openapi.yaml`
- **Versión OpenAPI:** 3.1.0
- **Versión de la API:** 1.1.0
- **Servidores:**
  - Producción: `https://api.sabeaperu.es/v1`
  - Desarrollo local / Mock: `http://localhost:5173/api/v1`
- **Esquema de Seguridad:** `FirebaseAuth` (HTTP Bearer JWT con rol de administrador de Firebase Auth).

### 2.2. Catálogo de Rutas y Métodos

1. **`GET /reservations/availability`**
   - **Operación:** `getAvailableSlots`
   - **Parámetros:** `date` (query, string formato `date`, requerido, ej. `"2026-11-20"`).
   - **Respuestas:**
     - `200`: Array de `ReservationSlot`.
     - `400`: `ProblemDetails`.

2. **`POST /reservations`**
   - **Operación:** `createReservation`
   - **Request Body:** `ReservationInput` (JSON, requerido).
   - **Respuestas:**
     - `201`: `ReservationOutput` (JSON, estado `pending`).
     - `422`: `ProblemDetails`.

3. **`GET /menu`**
   - **Operación:** `getPublicMenu`
   - **Parámetros:**
     - `category` (query, enum: `[comida, coctel, bebida]`, requerido).
     - `tag` (query, esquema `AllergenTag`, opcional).
   - **Respuestas:**
     - `200`: Array de `MenuItemOutput` ordenados ascendentemente por `sort_order`.

4. **`GET /site-content`**
   - **Operación:** `getSiteContent`
   - **Respuestas:**
     - `200`: Array de `SiteContentItem`.

5. **`POST /media/upload`**
   - **Operación:** `uploadMedia`
   - **Request Body:** `multipart/form-data` con campos `file` (binario, máx 20MB) y `upload_preset` (`"sabeaperu_firm"`).
   - **Respuestas:**
     - `200`: `{ "secure_url": string (uri) }`.

6. **`GET /gallery`**
   - **Operación:** `getGalleryItems`
   - **Respuestas:**
     - `200`: Array de `GalleryItem`.

7. **`PATCH /admin/reservations/{id}/status`**
   - **Operación:** `updateReservationStatus` (Requiere `FirebaseAuth`)
   - **Parámetros:** `id` (path, string, requerido).
   - **Request Body:** `ReservationStatusUpdate` (`status: enum[pending, confirmed, cancelled]`).
   - **Respuestas:**
     - `200`: `ReservationOutput`.
     - `401`: `ProblemDetails`.
     - `404`: `ProblemDetails`.

8. **`POST /admin/menu`**
   - **Operación:** `createMenuItem` (Requiere `FirebaseAuth`)
   - **Request Body:** `MenuItemInput`.
   - **Respuestas:**
     - `201`: `MenuItemOutput`.
     - `401`: `ProblemDetails`.

9. **`PUT /admin/menu/{id}`**
   - **Operación:** `updateMenuItem` (Requiere `FirebaseAuth`)
   - **Parámetros:** `id` (path, string, requerido).
   - **Request Body:** `MenuItemInput`.
   - **Respuestas:**
     - `200`: `MenuItemOutput`.
     - `401`: `ProblemDetails`.

10. **`DELETE /admin/menu/{id}`**
    - **Operación:** `deleteMenuItem` (Requiere `FirebaseAuth`)
    - **Parámetros:** `id` (path, string, requerido).
    - **Respuestas:**
      - `204`: Plato eliminado.
      - `401`: `ProblemDetails`.

11. **`POST /admin/gallery`**
    - **Operación:** `addGalleryItem` (Requiere `FirebaseAuth`)
    - **Request Body:** `GalleryItemInput`.
    - **Respuestas:**
      - `201`: `GalleryItem`.

12. **`DELETE /admin/gallery/{id}`**
    - **Operación:** `deleteGalleryItem` (Requiere `FirebaseAuth`)
    - **Parámetros:** `id` (path, string, requerido).
    - **Respuestas:**
      - `204`: Foto eliminada.

### 2.3. Definición de Esquemas Principales

#### `AllergenTag` (Enum de 16 valores oficiales)
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

#### `ReservationSlot`
- `time`: string con regex `^([01]\d|2[0-3]):[0-5]\d$` (ej. `"14:00"`, requerido).
- `available`: boolean (requerido).
- `reason`: string nullable (ej. `"Completo"`).

#### `ReservationInput`
- `customer_name`: string (min 2, max 100, requerido).
- `customer_email`: string formato `email` (requerido).
- `reservation_date`: string formato `date` (requerido).
- `reservation_time`: string regex `^([01]\d|2[0-3]):[0-5]\d$` (requerido).
- `number_of_people`: integer (min 1, max 20, requerido).
- `occasion`: string nullable (max 200).

#### `ReservationOutput`
- Hereda todos los campos de `ReservationInput`.
- `id`: string (ej. `"res_8492048fjs"`, requerido).
- `status`: string enum `[pending, confirmed, cancelled]` (requerido).
- `created_at`: string formato `date-time` ISO 8601 (requerido).

#### `ProblemDetails` (Estándar RFC 9457 / RFC 7807)
- `type`: string formato `uri` (ej. `"https://api.sabeaperu.es/errors/slot-full"`, requerido).
- `title`: string (ej. `"Franja horaria no disponible"`, requerido).
- `status`: integer (ej. `422`, requerido).
- `detail`: string (ej. `"La franja seleccionada ha alcanzado el límite máximo de comensales."`).
- `instance`: string (ej. `"/reservations/availability?date=2026-11-20"`).
- `invalid_params`: array de objetos `{ name: string, reason: string }`.

#### `GalleryItem` (Colección Firestore `gallery_items`)
- `id`: string (requerido).
- `public_id`: string (Cloudinary Public ID).
- `secure_url`: string formato `uri` (URL normalizada, requerido).
- `created_at`: string formato `date-time` ISO 8601 (requerido).
- `caption_title`: string nullable.
- `caption_desc`: string nullable.

#### `MenuItemOutput`
- `id`: string (requerido).
- `name`: string (requerido).
- `description`: string (opcional).
- `price`: number (min 0, requerido; si es 0 delega en descripción para indicar mercado).
- `category`: string enum `[comida, coctel, bebida]` (requerido).
- `subcategory`: string (requerido).
- `sort_order`: integer (min 0, requerido).
- `tags`: array de `AllergenTag`.
- `is_available`: boolean (requerido).
- `image_url`: string formato `uri` nullable.

---

## 3. Tokens del Sistema de Diseño ("Quiet Luxury")

### 3.1. Paleta Cromática Oficial
```css
:root {
  /* Fondos Primarios y Secundarios */
  --lux-bg-obsidian: #0b0b0b;        /* Fondo principal de inmersión */
  --lux-bg-charcoal: #141414;        /* Contenedores de sección y tarjetas */
  --lux-bg-surface: #1c1b1a;         /* Superficies elevadas, dropdowns y modales */

  /* Alternativas Claras (Estilo Alabastro / Lino Crudo) */
  --lux-bg-alabaster: #fbf9f5;       /* Fondo claro para secciones de lectura */
  --lux-bg-parchment: #f4efe8;       /* Fondos secundarios claros */

  /* Acentos Metálicos y Minerales (Desaturados y Nobles) */
  --lux-gold-champagne: #c5a880;     /* Acento principal en oro champán */
  --lux-gold-burnished: #a88d65;     /* Oro envejecido para hover y bordes activos */
  --lux-crimson-mineral: #8b1e22;    /* Carmín profundo andino (sustituye al rojo comida rápida) */

  /* Tipografía y Textos */
  --lux-text-primary: #f5f2eb;       /* Marfil cálido (alto contraste pero sin deslumbrar) */
  --lux-text-secondary: #c0bab0;     /* Gris cálido para descripciones de platos */
  --lux-text-muted: #858076;         /* Alérgenos, subtítulos pequeños y metadatos */
  --lux-text-dark: #1a1918;          /* Texto sobre fondos de alabastro */

  /* Hairlines y Bordes Arquitectónicos */
  --lux-border-hairline: rgba(245, 242, 235, 0.08);
  --lux-border-gold-subtle: rgba(197, 168, 128, 0.20);
}
```

### 3.2. Disciplina Tipográfica (Exactamente 2 Familias)
1. **Titular Editorial:** *Cormorant Garamond* o *Playfair Display*
   - Pesos permitidos: `300` (Light), `400` (Regular), `400i` (Italic).
   - Uso: Encabezados `h1`, `h2`, nombres de platos en el menú. Proporción monumental, `line-height: 1.05` a `1.15`.
2. **Micro-copy & Lectura:** *Inter* o *Montserrat*
   - Pesos permitidos: `300` (Light), `400` (Regular), `600` (Semibold).
   - Uso: Navegación, botones, selectores, precios, micro-etiquetas de alérgenos y cuerpo de texto.
   - En navegación y botones: Mayúsculas con tracking amplio (`letter-spacing: 0.22em`), tamaño 10px a 12px.

### 3.3. Elementos Derogados y Prohibiciones Estrictas
- **Derogación de Marco Marrón de 80px:** Se elimina `border-width: 80px; border-color: #2e2620;` y los pseudo-elementos con dibujos de colibríes, arañas y monos con sombras amarillas. Reemplazado por fondo obsidiana con borde hairline de 1px (`rgba(197, 168, 128, 0.18)`).
- **Derogación de Shiny Button Loop:** Se elimina la animación `.item-photo-btn::after { animation: shiny-button 3s infinite; }`. Reemplazado por enlace tipográfico editorial minimalista `FOTOGRAFÍA`.
- **Derogación de Emojis:** Prohibidos emojis en títulos de platos y categorías.
- **Geometría Arquitectónica:** Prohibidos bordes de píldora `border-radius: 20px`. Permitido `0px` o máximo `2px`.
- **Formularios Concierge:** Prohibidos recuadros grises burocráticos. Campos con fondo transparente y línea inferior sutil `border-bottom: 1px solid var(--lux-border-hairline)`.

---

## 4. Métricas de Rendimiento WPO y Core Web Vitals (CWV)

### 4.1. Presupuestos y Umbrales (Simulación Móvil 4G Lenta, CPU Throttling 4x)
- **LCP (*Largest Contentful Paint*):** Límite máximo `< 2.5 s` (Objetivo ideal: `< 1.8 s`).
- **INP (*Interaction to Next Paint*):** Límite máximo `< 200 ms` (Objetivo ideal: `< 100 ms`).
- **CLS (*Cumulative Layout Shift*):** Límite máximo `< 0.1` (Objetivo ideal: `< 0.02`).
- **FCP (*First Contentful Paint*):** Límite máximo `< 1.8 s` (Objetivo ideal: `< 1.2 s`).
- **TTFB (*Time to First Byte*):** Límite máximo `< 800 ms` (Objetivo ideal: `< 400 ms`).
- **Initial JS Bundle (gzip):** Límite máximo `< 150 kB` (Objetivo ideal: `< 80 kB`).
- **Lighthouse Mobile Score:** Límite mínimo `>= 90 / 100` (Objetivo ideal: `>= 95 / 100`).

### 4.2. Contratos de Carga de Red y Critical Rendering Path
- **Hero LCP:** Elemento `#img-hero-1` debe tener obligatoriamente:
  `fetchpriority="high"`, `loading="eager"`, `decoding="async"`.
- **Imágenes Below-The-Fold:** Todas las imágenes secundarias deben tener:
  `loading="lazy"`, `decoding="async"` y dimensiones reservadas vía `aspect-ratio` en CSS.
- **Fuentes en HTML `<head>`:**
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Inter:wght@300;400;600&display=swap">
  ```
- **IntersectionObserver:** Reemplazo de listeners `scroll` continuos. Observación de elementos `.reveal` con desconexión pasiva al hacerse visibles.
- **Pausa de Bucles:** Temporizadores de carrusel y carrusel automático de galería detenidos al perder foco la ventana (`document.visibilityState === 'hidden'`) o cuando el elemento no es visible en el viewport.

---

## 5. Reglas de Normalización de Cloudinary y Backoffice

### 5.1. Función Pura `normalizeCloudinaryUrl`
Implementación oficial de contrato aprobada en `specs/admin-spec.md`:
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
  }
  rest = parts.join('/');

  // Inyectar el estándar oficial de alta gama
  return `${base}f_auto,q_auto,w_${width},c_limit/${rest}`;
}
```

### 5.2. Reglas de Operación del Backoffice
1. **Almacenamiento Exclusivo:** Todo asset de menú, CMS y galería reside en Cloudinary. Queda estrictamente extinguido el uso de Firebase Storage para la galería.
2. **Colección Firestore `gallery_items`:** Documentos con estructura `{ id, public_id, secure_url, created_at, caption_title?, caption_desc? }`.
3. **Validación Pre-Carga:** Límite estricto de 10 MB por archivo. Formatos permitidos: `image/jpeg`, `image/png`, `image/webp`.
4. **Previsualización en Vivo:** Uso de `URL.createObjectURL(file)` al disparar el evento `change` del input, antes de enviar la petición a Cloudinary.
5. **Selector de Alérgenos por Chips:** Panel de 16 botones basados en `AllergenTag` sustituyendo el campo de texto libre con comas.
6. **Operativa de Reservas:**
   - Botón `Confirmar`: actualiza Firestore `status: 'confirmed'`.
   - Botón `Cancelar`: modal de confirmación y actualiza Firestore `status: 'cancelled'` (libera aforo).
   - Botón `WhatsApp`: deep link directo al chat del cliente con mensaje de cortesía prellenado.
   - Pestañas de filtrado: `Pendientes`, `Hoy`, `Todas`.

---

## 6. Mapeo de Fases de Ejecución (Roadmap Fases 1 a 6)

| Fase | Título | Deudas Técnicas Resueltas | Archivos Principales Afectados | Entregables y Criterios de Aceptación |
|---|---|---|---|---|
| **Fase 1** | Optimización de Rendimiento WPO y Saneamiento de Assets | [DT-04], [DT-06], [DT-08], [DT-09], [DT-10] | `index.html`, `carta.html`, `experiencia.html`, `src/style.css`, `src/main.ts` | Eliminación de 10 fotos Supabase en galería; sustitución de `@import` por `<link rel="preconnect">`; `fetchpriority="high"` en Hero LCP; refactor de scroll a `IntersectionObserver`; purga de referencias a Supabase. |
| **Fase 2** | Sistema de Tokens y Diseño Ultra-Lujo (Quiet Luxury) | [DT-01 partial], [DT-03 partial] | `src/style.css`, `index.html`, `carta.html`, `experiencia.html` | Inyección de tokens CSS (Obsidiana, Carbón, Champán, Marfil, Carmín Mineral); derogación de marco marrón de 80px y figuras Nazca; eliminación de animación shiny de fotos; estandarización a 2 familias tipográficas. |
| **Fase 3** | Refactor de Lógica TypeScript y Carta Digital | [DT-02 partial], [DT-03], [DT-07] | `src/main.ts`, `carta.html`, `index.html` | Erradicación de emojis en nombres de platos y categorías; inyección de micro-etiquetas tipográficas monocromáticas sobrias según `AllergenTag`; trigger editorial minimalista `FOTOGRAFÍA`; soporte de precios duales (mercado vs numérico); consumo exclusivo de Firestore `menu_items`. |
| **Fase 4** | Blindaje del Backoffice y Pipeline Cloudinary | [DT-04], [DT-05], [DT-13] | `src/admin.ts`, `admin.html` | Implementación de `normalizeCloudinaryUrl`; erradicación de `?v=`; migración de galería a Firestore `gallery_items` (fin de Firebase Storage); selector interactivo de chips para los 16 `AllergenTag`; botones de acción en reservas (`Confirmar`, `Cancelar`, `WhatsApp`) y filtros de sala. |
| **Fase 5** | Conserjería de Reservas y Anti-Bloqueo de WhatsApp | [DT-11], [DT-12] | `src/main.ts`, `src/reservations.ts`, `index.html`, `experiencia.html` | Eliminación de `window.open` automático; flujo de dos pasos con registro Firestore + tarjeta de confirmación en pantalla con código localizador único `SP-XXXX` y botón voluntario a WhatsApp; validación de grupos (1-6 vs >6 imperial); toasts de error según RFC 9457 (prohibido `alert()`). |
| **Fase 6** | Pruebas de Calidad E2E y Certificación Final | Validación Global | Todo el proyecto | Ejecución de `npm run pipeline` (`tsc --noEmit && vite build`) con Exit Code 0; verificación en navegador de 0 errores de consola, 0 descargas fantasma, fluidez a 60 fps y Lighthouse Mobile >= 90. |

---

## 7. Verificación del Pipeline CI/CD

El pipeline oficial de construcción y tipado está formalizado en `package.json`:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "pipeline": "tsc --noEmit && vite build"
}
```

### Comprobación de Línea Base Actual:
- **Comando Ejecutado:** `npm run pipeline`
- **Resultado:** Exit Code 0.
- **Tiempo de compilación:** 1.23s.
- **Tamaño de salida:**
  - `dist/index.html`: 22.87 kB (gzip: 5.47 kB)
  - `dist/carta.html`: 8.35 kB (gzip: 2.36 kB)
  - `dist/experiencia.html`: 16.19 kB (gzip: 4.10 kB)
  - `dist/admin.html`: 31.36 kB (gzip: 5.15 kB)
  - `dist/assets/style-*.css`: 26.70 kB (gzip: 6.51 kB)
  - `dist/assets/main-*.js`: 15.82 kB (gzip: 6.21 kB)
  - `dist/assets/firebase-*.js`: 376.09 kB (gzip: 116.81 kB)
- **Diagnóstico del Minador:**
  El pipeline compila limpiamente sin errores de tipado actuales. La refactorización en 6 fases debe preservar este estatus (Exit Code 0 obligatorio) en todo momento.
