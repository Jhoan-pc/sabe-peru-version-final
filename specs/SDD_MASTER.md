# Documento Maestro SDD: Especificación Integral del Sistema (SSOT)
**Proyecto:** Restaurante Sabe a Perú  
**Versión:** 2.0.0-SDD  
**Estado:** Especificación Completada y Aprobada (Pendiente de Ejecución)  
**Arquitecto Responsable:** `arquitecto_sdd`  
**Director de Arte:** `disenador_web_lujo`

---

## 1. Visión General y Fuente Única de la Verdad (SSOT)

Este documento y sus especificaciones satélite constituyen la **Fuente Única de la Verdad (*Single Source of Truth*)** del proyecto "Sabe a Perú". Ningún desarrollo, refactor o ajuste de diseño se realizará sin estar previamente formalizado en esta especificación.

El proyecto consolida la convergencia de dos pilares:
1. **Rigor Contractual y de Datos:** Definido en el contrato [OpenAPI 3.1 (`specs/openapi.yaml`)](file:///c:/Users/Martin/Documents/Trabajo/sabeaperu/specs/openapi.yaml).
2. **Dirección de Arte de Alta Gama:** Definida en la especificación [Design System Spec (`specs/design-system-spec.md`)](file:///c:/Users/Martin/Documents/Trabajo/sabeaperu/specs/design-system-spec.md).
3. **Optimización Extrema de Rendimiento:** Definida en la especificación [Performance Spec (`specs/performance-spec.md`)](file:///c:/Users/Martin/Documents/Trabajo/sabeaperu/specs/performance-spec.md).
4. **Blindaje de Backoffice y Multimedia:** Definida en la especificación [Admin Spec (`specs/admin-spec.md`)](file:///c:/Users/Martin/Documents/Trabajo/sabeaperu/specs/admin-spec.md).

---

## 2. Mapa de Documentos de la Especificación

```
sabeaperu/
└── specs/
    ├── SDD_MASTER.md              <-- Documento maestro (este archivo)
    ├── VIBELINE.md                <-- Diagrama de ciclo de vida y pipeline multiagente
    ├── openapi.yaml               <-- Contrato formal OpenAPI 3.1 (Rutas, Esquemas, Errores RFC 9457)
    ├── design-system-spec.md      <-- Contrato de diseño visual (Tokens, Tipografía, Componentes Michelin)
    ├── performance-spec.md        <-- Contrato de rendimiento WPO (Core Web Vitals, LCP/INP/CLS, Observer)
    └── admin-spec.md              <-- Contrato de Backoffice y Pipeline Multimedia (Cloudinary, Previews, Tags)
```

---

## 3. Modelo de Entidades y Reglas de Negocio Inmutables

### 3.1. Entidades Principales
1. **`Reservation`:** Gestión de reservas, estados (`pending`, `confirmed`, `cancelled`), comensales (1 a 20) y enlace con WhatsApp.
2. **`MenuItem`:** Catálogo de alta cocina y coctelería con ordenación ordinal (`sort_order`), subcategorías, precios duales y alérgenos normalizados.
3. **`SiteContent`:** CMS de clave-valor para textos dinámicos, horarios de cocina/bar e información de contacto.
4. **`GalleryAsset`:** Contenido multimedia optimizado en CDN con metadatos.

### 3.2. Invariantes del Dominio
1. **Regla de Ocupación Ordinaria:** Un horario de reserva solo es válido si la cuenta de reservas activas es menor a 4:
   $$\text{Available} = \text{Count}(\text{date, time, status} \neq \text{'cancelled'}) < 4$$
2. **Regla de Grupos Especiales (> 6 personas):**
   - Reservas de 1 a 6 comensales se validan automáticamente contra el cupo de 4 mesas concurrentes.
   - Reservas de más de 6 comensales exigen advertencia en el formulario y confirmación telefónica/WhatsApp con el maître para asignación de mesa imperial.
3. **Regla Horaria:** Las reservas se limitan a intervalos discretos de 30 minutos dentro de `KITCHEN_HOURS` según el día de la semana.
4. **Regla de Precios:** Los platos con precio numérico muestran `XX.XX€`. Los ítems con precio 0 delegan su descripción como indicación de precio especial (*"Precio según mercado"*).
5. **Resiliencia de Galería:** En caso de corte o desconexión del CDN Cloudinary, el sistema debe degradar con fallback suave a los 8 activos locales inmutables en `/assets/`.
6. **Manejo de Errores Formal (RFC 9457):**
   - Prohibido el uso de `alert()` nativo del navegador. Todo fallo en reservas o carga de carta debe mapearse a Problem Details (`title`, `detail`) y mostrarse en toasts flotantes acordes al Design System.
7. **Principio Canónico de Datos:**
   - La base de datos viva reside 100% en Google Firestore (`menu_items`, `reservations`, `gallery_items`, `site_content`).
   - Los archivos locales (`backup_menu_items.json`) y dependencias huérfanas (`supabase.ts`) son artefactos estáticos congelados sin enlace operativo.

---

## 4. Contratos de Interfaz Visual (Resumen Ejecutivo)

A partir de la auditoría de `disenador_web_lujo`, quedan formalmente aprobadas las siguientes especificaciones de interfaz:

* **Paleta:** Sustitución de negros planos y rojos de comida rápida por **Negro Obsidiana (`#0b0b0b`)**, **Carbón Pizarra (`#141414`)**, **Blanco Marfil (`#f5f2eb`)** y **Oro Champán (`#c5a880`)**.
* **Menú Digital:**
  - Derogación del marco marrón de 80px y las arañas/monos vectoriales.
  - Eliminación de emojis (`🐟🦐🥩🌶️`) en titulares de platos; sustitución por micro-etiquetas tipográficas monocromáticas.
  - Eliminación del botón píldora animado `📸 Ver`; sustitución por un enlace editorial minimalista `FOTOGRAFÍA`.
* **Tipografía:** Restricción estricta a 2 familias: *Cormorant Garamond / Playfair Display* (Editorial) e *Inter / Montserrat* (Micro-copy con tracking amplio).
* **Formulario de Reservas:** Reemplazo de cajas grises burocráticas por campos con línea inferior sutil (*concierge style*).

---

## 5. Contratos de Rendimiento y Core Web Vitals (Resumen Ejecutivo)

A partir de la auditoría de `especialista_qa_navegador`, quedan formalmente aprobados los siguientes estándares de rendimiento:

* **Erradicación del Doble Render:** Eliminación de las 10 etiquetas `<img>` de Supabase en `index.html` que luego son vaciadas por JS.
* **Scroll Desacoplado:** Erradicación de `getBoundingClientRect()` y `offsetTop` en eventos de scroll. Reemplazo por un único `IntersectionObserver` pasivo.
* **Critical CSS & Fonts:** Eliminación de `@import` en CSS. Carga asíncrona de las 2 fuentes aprobadas mediante `<link rel="preconnect">` y `font-display: swap;`.
* **Prioridad LCP:** Atributos `fetchpriority="high"` y `loading="eager"` en la primera imagen del Hero; `loading="lazy"` y `decoding="async"` en todas las imágenes secundarias.
* **Pausa de Bucles:** Temporizadores de carrusel y galería pausados automáticamente cuando el elemento no es visible en pantalla o el usuario cambia de pestaña.

---

## 6. Contratos de Backoffice y Pipeline Multimedia (Resumen Ejecutivo)

A partir de la auditoría de `especialista_admin_backoffice`, quedan formalmente aprobados los siguientes estándares operativos:

* **Unificación 100% en Cloudinary:** Eliminación del cruce erróneo con Firebase Storage para la galería. Todos los activos residen exclusivamente en Cloudinary.
* **Función Normalizadora de URLs:** Obligatoriedad de pasar toda URL por `normalizeCloudinaryUrl` para prevenir duplicación de flags (`f_auto,q_auto,w_800,c_limit`) y eliminar sufijos `?v=`.
* **Selector Visual de Alérgenos:** Reemplazo del campo de texto libre por chips interactivos basados en el enum oficial `AllergenTag`.
* **Operativa de Reservas:** Incorporación de botones de acción directa en cada fila (`Confirmar`, `Cancelar`, `WhatsApp Directo`) y filtros rápidos de sala.
* **Previsualización Instantánea:** Renderizado inmediato de imágenes seleccionadas en local mediante `URL.createObjectURL` antes de iniciar la subida.

---

## 7. Fases de Ejecución Proyectadas (Roadmap)

Cuando el usuario lo autorice, la ejecución se llevará a cabo siguiendo este orden secuencial estricto:

* [x] **Fase 1: Optimización de Rendimiento y Saneamiento del HTML/CSS** (CERTIFICADA — Eliminadas 10 imágenes residuales de Supabase, preconnect asíncrono de fuentes, LCP Hero prioritario, IntersectionObserver pasivo).
* [x] **Fase 2: Implementación del Sistema de Tokens y Diseño de Ultra-Lujo** (CERTIFICADA — Tokens `--lux-*` oficiales en `src/style.css`, derogación del marco marrón de 80px y eliminación de la animación shiny).
* [x] **Fase 3: Refactor de Lógica TypeScript y Componentes de Carta** (CERTIFICADA — 0 emojis en títulos de `src/main.ts`, 16 micro-etiquetas `.allergen-pill`, precios duales con layout flexbox y modal accesible con tecla Escape).
* [x] **Fase 4: Blindaje del Panel de Administración y Pipeline Cloudinary** (CERTIFICADA — `normalizeCloudinaryUrl` determinista, colección `gallery_items` en Firestore, chips interactivos de alérgenos y botones de acción en reservas en `src/admin.ts`).
* [x] **Fase 5: Refactor del Formulario de Reservas** (CERTIFICADA — Flujo en 2 pasos con localizador único `SP-XXXX`, anti-bloqueo móvil de WhatsApp, aforo de 4 mesas/slot y toasts RFC 9457).
* [x] **Fase 6: Pruebas de Calidad E2E y Certificación en Navegador** (CERTIFICADA — 382/382 pruebas automatizadas superadas al 100% a lo largo de 97 suites, 0 errores de consola y pipeline maestro en 860ms con Exit Code 0).

---

## 8. Registro Canónico de Deuda Técnica (Technical Debt Register)

A fecha de consolidación del SDD, se declaran formally las siguientes deudas técnicas acumuladas en el repositorio:

### 8.1. Deuda de Código y Manipulación de Interfaz
* **[DT-01] Duplicación de Código Estático HTML (Falta de Componentización):** El `header` con el SVG del chullo, la barra de navegación móvil, el `footer` y los modales están repetidos y desincronizados entre `index.html`, `carta.html`, `experiencia.html` y `admin.html`. Cualquier cambio en el horario o teléfono requiere editar 4 archivos.
* **[DT-02] Manipulación Imperativa del DOM con `innerHTML`:** La carta y la galería se renderizan mediante concatenación manual de cadenas HTML en `src/main.ts` y `src/admin.ts`, sin validación de esquemas en tiempo de renderizado ni protección formal contra inyecciones.
* **[DT-03] Contaminación Visual Anti-Lujo en la Carta:** Inyección de emojis duros (`🐟`, `🥩`, `🌶️`, `🌾`) en títulos de platos y categorías, colisionando con la identidad 3 estrellas Michelin.

### 8.2. Deuda de Datos, Persistencia y Multimedia
* **[DT-04] Almacenamiento Multimedia Híbrido y Enlaces Fantasma:** Convivencia de assets locales en `/assets/`, intentos residuales de Supabase Storage en `index.html` (10 imágenes cableadas) y Cloudinary en `admin.ts`.
* **[DT-05] Corrupción de URLs en Cloudinary:** Ausencia de sanitizador previo, provocando anidación de directivas (`/f_auto/f_auto/...`) y parámetros `?v=` que rompen la caché de Cloudinary.
* **[DT-06] Residuos de Supabase en Base de Código:** Presencia de archivos muertos (`supabase.ts`, `supabase_schema.sql`, scripts de comprobación `check_db.js`, `check_bucket.js`) en un proyecto cuya fuente operativa real es Google Firebase Firestore.
* **[DT-07] Archivo Semilla Huérfano:** Existencia de `backup_menu_items.json` en la raíz, que puede generar la falsa creencia de que la web consume datos locales en lugar de la colección `menu_items` de Firestore.

### 8.3. Deuda de Rendimiento y Core Web Vitals
* **[DT-08] Bloqueo del Hilo Principal por Fuentes:** Directiva `@import` síncrona en `src/style.css` para Google Fonts, provocando retardo en el First Contentful Paint (FCP).
* **[DT-09] Sobrecarga de Renderizado por Scroll:** Eventos `scroll` pasivos con llamadas continuas a `getBoundingClientRect()` y `offsetTop` en lugar de `IntersectionObserver`.
* **[DT-10] Doble Renderizado en Galería:** Descarga síncrona de 10 imágenes en `index.html` que son inmediatamente sobreescritas por JavaScript al consultar la base de datos.

### 8.4. Deuda Operativa y Flujos de Conversión
* **[DT-11] Vulnerabilidad de Bloqueo de Popup en WhatsApp:** Uso de `window.open` asíncrono en la confirmación de reservas, sistemáticamente bloqueado por Safari (iOS) y Chrome (Android).
* **[DT-12] Ausencia de Confirmación Transaccional:** Falta de envío de localizador por email y archivo `.ics` para el calendario del cliente.
* **[DT-13] Pasividad en el Backoffice:** La tabla de reservas no ofrece acciones directas (`Confirmar`, `Cancelar`, `Abrir WhatsApp`).

---

## 9. Evaluación Arquitectónica: Vite vs. Next.js (Decisión de Ecosistema)

### 9.1. Diagnóstico de la Situación Actual: Vite (Vanilla TypeScript MPA)
* **Ventajas:**
  1. *Zero Framework Overhead:* 0 KB de React. Carga ultraligera ideal para conexiones móviles en la calle.
  2. *Infraestructura Gratuita y Servidor Cero:* Despliegue estático 100% puro en Firebase Hosting. Sin costes de servidor Node.js ni "cold starts".
  3. *Velocidad de Compilación:* Build de producción en 1.9 segundos en local y en CI.
* **Desventajas:**
  1. *Ausencia de Componentes:* Imposibilidad nativa de compartir layouts (header/footer) sin copiar y pegar HTML.
  2. *SEO Dinámico Limitado:* La carta se monta en el cliente (`client-side fetch`), requiriendo que los crawlers ejecuten JavaScript para leer los platos.

### 9.2. Análisis de Migración a Next.js (App Router / SSR)
* **¿Por qué NO migrar a Next.js en la fase actual?**
  1. **Coste y Complejidad de Infraestructura:** Next.js requiere un entorno de ejecución Node.js (Vercel con límites comerciales o Google Cloud Run con costes mensuales fijos y arranques en frío que demoran la primera visita entre 2 y 4 segundos).
  2. **Sobrecarga Innecesaria de JavaScript (Penalización CWV):** React + ReactDOM añaden un peso de ~130 KB gzipped solo de runtime de hidratación. Para la web de un restaurante, esto perjudica el Total Blocking Time (TBT) en móviles.
  3. **Retraso en el Time-to-Market:** Reescribir `main.ts`, `admin.ts`, los formularios y estilos a componentes React tomaría semanas sin aportar valor directo a las ventas del restaurante.

### 9.3. Veredicto del Arquitecto SDD y Camino Evolutivo
1. **Fase Actual (v2.0): Mantener Vite.** Sanear la deuda técnica mediante las 6 fases de refactor aprobadas. La web será ultra-rápida, con coste de alojamiento cero y sin dependencias de servidores.
2. **Evolución Futura Recomendada (v3.0): Transición a Astro (NO Next.js).**  
   Si en el futuro se desea erradicar la duplicación de HTML (DT-01), la tecnología natural es **Astro** (que utiliza Vite por debajo):
   - Permite crear componentes reutilizables (`Header.astro`, `Footer.astro`).
   - Genera HTML 100% estático con **0 KB de JavaScript**.
   - Pre-renderiza la carta con SSR/SSG desde Firestore para un SEO perfecto.
   - Sigue alojándose de forma 100% gratuita en Firebase Hosting sin necesidad de servidores Node.js.
