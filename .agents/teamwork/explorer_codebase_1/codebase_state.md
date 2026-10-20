# Estado Actual de la Base de Código — Restaurante Sabe a Perú
**Fecha:** 2026-10-09  
**Explorador:** `teamwork_preview_explorer_survey_codebase` (explorer_codebase_1)  
**Objetivo:** Mapeo exhaustivo, forense y con números de línea de las deudas técnicas [DT-01] a [DT-13] en el código fuente actual.

---

## 1. Resumen Ejecutivo de la Arquitectura Actual

El proyecto es una Multi-Page Application (MPA) basada en **Vite + Vanilla TypeScript**:
- **Páginas HTML:** `index.html` (Home/Landing), `carta.html` (Carta digital), `admin.html` (Backoffice), `experiencia.html` (Invitación privada).
- **Hojas de Estilo:** `src/style.css` (estilos globales, menú, landing, admin base), `src/experiencia.css` (estilos de experiencia).
- **Lógica TypeScript:** `src/main.ts` (lógica interactiva de landing y carta), `src/admin.ts` (lógica del backoffice), `src/reservations.ts` (cálculo de slots de reserva), `src/firebase.ts` (conexión a Google Firebase).
- **Backend / Persistencia:** Google Firebase Firestore (`menu_items`, `reservations`, `site_content`).
- **Estado de Build:** `npm run pipeline` (`tsc --noEmit && vite build`) compila con Exit Code 0, pero presenta severas deudas técnicas arquitectónicas, visuales, operativas y de rendimiento.

---

## 2. Mapeo Detallado de Deudas Técnicas [DT-01] a [DT-13]

### [DT-01] Etiquetas `<img>` residuales de Supabase en `#main-gallery-grid` (`index.html`)

- **Archivos y Líneas:**
  - `index.html`: Líneas 216–261 (`#main-gallery-grid`).
  - `index.html`: Línea 22 (`<meta property="og:image">`).
- **Código Actual Observado (`index.html:216-261`):**
  ```html
  <div class="gallery-grid" id="main-gallery-grid">
    <div class="gallery-item tall">
      <img src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/Galeria1.png" alt="Ambiente Sabe a Perú">
    </div>
    <div class="gallery-item">
      <img src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/galeria3.png" alt="Cóctel">
    </div>
    <div class="gallery-item wide">
      <img src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/galeria4.png" alt="Preparación">
    </div>
    <div class="gallery-item">
      <img src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/galeria5.png" alt="Postre">
    </div>
    <div class="gallery-item">
      <img src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/galeria6.png" alt="Galería 6">
    </div>
    <div class="gallery-item">
      <img src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/galeria7.png" alt="Galería 7">
    </div>
    <div class="gallery-item">
      <img src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/galeria8.png" alt="Galería 8">
    </div>
    <div class="gallery-item">
      <img src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/galeria10.png" alt="Galería 10">
    </div>
    <div class="gallery-item">
      <img src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/galeria11.png" alt="Galería 11">
    </div>
    <div class="gallery-item">
      <img src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/galeria12.png" alt="Galería 12">
    </div>
  </div>
  ```
- **Comportamiento en Ejecución:**
  Al parsear `index.html`, el navegador inicia de forma síncrona la descarga de 10 imágenes PNG pesadas desde el bucket de Supabase. Posteriormente, al ejecutarse `src/main.ts` (línea 419: `galleryGrid!.innerHTML = '';`), JavaScript vacía todo el contenedor e inyecta dinámicamente imágenes desde Firebase Storage o assets locales.
- **Impacto:** Doble descarga innecesaria (Ghost Loading / Double Render), penalización en TTFB, consumo inútil de ancho de banda móvil y salto de layout (CLS).
- **Referencia SDD:** `specs/performance-spec.md` Sección 2.A; `specs/SDD_MASTER.md` Sección 5 y [DT-10].

---

### [DT-02] `@import` síncrono en `src/style.css` vs ausencia de `<link rel="preconnect">` en HTML

- **Archivos y Líneas:**
  - `src/style.css`: Línea 1.
  - `index.html`: Líneas 24–25.
  - `carta.html`: Líneas 13–14.
  - `admin.html`: Líneas 8–9.
- **Código Actual Observado:**
  - `src/style.css:1`:
    ```css
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@300;400;600&family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Serif+Display:ital@0;1&family=Lato:ital,wght@0,300;0,400;0,700;1,400&family=Montserrat:ital,wght@0,300;0,400;0,600;1,400&family=Open+Sans:ital,wght@0,300;0,400;0,600;1,400&display=swap');
    ```
  - `index.html:24-25` y `carta.html:13-14`:
    ```html
    <link rel="stylesheet" href="/src/style.css">
    ```
- **Comportamiento en Ejecución:**
  El motor de renderizado del navegador bloquea la construcción del CSSOM mientras resuelve la directiva `@import` externa en cascada (DNS, TCP, TLS hacia `fonts.googleapis.com` y `fonts.gstatic.com`). Al no existir `<link rel="preconnect">` en los encabezados HTML de `index.html`, `carta.html` y `admin.html`, la resolución de conexión no comienza hasta que `src/style.css` se ha descargado y parseado.
- **Impacto:** Bloqueo del Critical Rendering Path, retraso severo en FCP (> 1.8s) y FOUT (Flash of Unstyled Text).
- **Referencia SDD:** `specs/performance-spec.md` Sección 4.A; `specs/SDD_MASTER.md` [DT-08].

---

### [DT-03] Atributos de imagen del Hero (`fetchpriority="high"`, `loading="eager"`)

- **Archivos y Líneas:**
  - `index.html`: Líneas 107–120 (Slideshow del Hero).
  - `index.html`: Líneas 146–149, 169–172, 175–179, 195–199 (Imágenes de Filosofía y Especialidades).
- **Código Actual Observado (`index.html:107-120`):**
  ```html
  <div class="hero-slideshow">
    <img id="img-hero-1" src="/assets/Hero1.webp" class="hero-slide active" alt="Sabe a Perú Ambiente 1">
    <img id="img-hero-2" src="/assets/hero2.webp" class="hero-slide" alt="Sabe a Perú Ambiente 2">
    <img id="img-hero-3" src="/assets/hero3.webp" class="hero-slide" alt="Sabe a Perú Platos">
    <img id="img-hero-4" src="/assets/hero4.webp" class="hero-slide" alt="Sabe a Perú Detalle">
  </div>
  ```
- **Comportamiento en Ejecución:**
  La imagen candidata LCP (`#img-hero-1`) carece de `fetchpriority="high"`, `loading="eager"` y `decoding="async"`. Las imágenes secundarias (`#img-hero-2`, `#img-hero-3`, `#img-hero-4`) y las secciones inferiores carecen de `loading="lazy"` y `decoding="async"`, compitiendo por los flujos de red contra el LCP en el pliegue inicial.
- **Impacto:** Degradación de la métrica Largest Contentful Paint (LCP > 2.5s) en móviles 4G.
- **Referencia SDD:** `specs/performance-spec.md` Sección 2.B; `specs/SDD_MASTER.md` Sección 5.

---

### [DT-04] Listeners pesados de eventos de scroll en `src/main.ts`

- **Archivos y Líneas:**
  - `src/main.ts`: Líneas 108–114 (Sticky Header scroll listener).
  - `src/main.ts`: Líneas 156–175 (Reveal on Scroll con `getBoundingClientRect()`).
  - `src/main.ts`: Líneas 177–199 (Scroll Spy de pestañas con `section.offsetTop`).
  - `src/main.ts`: Líneas 100–105 y 538–567 (`setInterval` sin pausar cuando el elemento no es visible o pestaña inactiva).
- **Código Actual Observado:**
  - `src/main.ts:108-114`:
    ```typescript
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header?.classList.add('scrolled');
      } else {
        header?.classList.remove('scrolled');
      }
    });
    ```
  - `src/main.ts:159-175`:
    ```typescript
    const revealOnScroll = () => {
      const windowHeight = window.innerHeight;
      const elementVisible = 150;
      revealElements.forEach((reveal) => {
        const elementTop = reveal.getBoundingClientRect().top;
        if (elementTop < windowHeight - elementVisible) {
          reveal.classList.add('active');
        }
      });
    };
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();
    ```
  - `src/main.ts:183-198`:
    ```typescript
    window.addEventListener("scroll", () => {
      let current = "";
      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        if (window.pageYOffset >= sectionTop - 150) {
          current = section.getAttribute("id") || "";
        }
      });
      // ...
    });
    ```
- **Comportamiento en Ejecución:**
  Se ejecutan múltiples listeners de `scroll` no pasivos que leen propiedades geométricas del DOM (`getBoundingClientRect().top`, `offsetTop`, `pageYOffset`) en cada frame del scroll. Esto dispara Forced Synchronous Layouts y Layout Thrashing continuo.
- **Impacto:** Congelamiento de fotogramas (*dropped frames*), violación del presupuesto de 60 fps e INP > 200 ms.
- **Referencia SDD:** `specs/performance-spec.md` Sección 3.A; `specs/SDD_MASTER.md` [DT-09].

---

### [DT-05] Tokens de diseño en `src/style.css`, marco marrón de 80px y SVGs decorativos

- **Archivos y Líneas:**
  - `src/style.css`: Líneas 3–12 (Tokens `:root` desactualizados).
  - `src/style.css`: Líneas 449–473 (Marco arqueológico marrón de 80px).
  - `src/style.css`: Líneas 476–525 (Pseudo-elementos `::before` y `::after` con SVGs de Colibrí, Espiral, Araña, Mono, Manos, Árbol).
  - `src/style.css`: Líneas 528–561 (Glifos laterales en `.menu-grid::before` y `::after`).
  - `src/style.css`: Líneas 92–94 (`.logo-line-top-right` con rojo `#e31e24`).
- **Código Actual Observado:**
  - `src/style.css:3-12`:
    ```css
    :root {
      --color-gold: #b38e5d;
      --color-gold-dark: #8c6d44;
      --color-primary: #050505;
      --color-white: #ffffff;
      --color-text-dim: #666;
      --font-serif: 'Playfair Display', serif;
      --font-sans: 'Inter', sans-serif;
      --transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
    }
    ```
  - `src/style.css:451-473`:
    ```css
    .page-carta .section-container {
      padding: 60px;
      margin: 100px auto 100px;
      max-width: 1000px;
      background-color: #1a1a1a;
      box-shadow: 0 0 50px rgba(0, 0, 0, 0.8);
      position: relative;
      border-width: 80px 80px;
      border-style: solid;
      border-color: #2e2620;
      overflow: visible;
    }
    ```
  - `src/style.css:476-525`:
    Pseudo-elementos embebiendo `data:image/svg+xml` con dibujos de líneas de Nazca en oro chillón (`#ffd700`) sobre el marco de tierra marrón.
- **Comportamiento en Ejecución:**
  La carta renderiza un marco tosco exterior marrón de 80 píxeles que reduce el ancho útil de lectura en pantallas pequeñas y colisiona frontalmente con la identidad Quiet Luxury de 3 estrellas Michelin.
- **Impacto:** Contaminación estética, ruido visual, ausencia de los tokens oficiales `--lux-*`.
- **Referencia SDD:** `specs/design-system-spec.md` Secciones 1 y 3.B; `specs/SDD_MASTER.md` Secciones 4 y 7 (Fase 2).

---

### [DT-06] Animación reflectante continua (*shiny button loop*) en fotos de platos

- **Archivos y Líneas:**
  - `src/style.css`: Líneas 1403–1450 (`.item-photo-btn` y `@keyframes shiny-button`).
  - `src/main.ts`: Líneas 276–280 (Markup inyectado en `item-photo-btn`).
- **Código Actual Observado:**
  - `src/style.css:1427-1450`:
    ```css
    .item-photo-btn::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        to bottom right,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.1) 40%,
        rgba(255, 255, 255, 0.4) 50%,
        rgba(255, 255, 255, 0.1) 60%,
        rgba(255, 255, 255, 0) 100%
      );
      transform: rotate(45deg);
      animation: shiny-button 3s infinite;
      pointer-events: none;
    }
    @keyframes shiny-button {
      0% { transform: translateX(-100%) rotate(45deg); }
      20%, 100% { transform: translateX(100%) rotate(45deg); }
    }
    ```
  - `src/main.ts:276-280`:
    ```typescript
    const photoBtn = item.image_url ? `
      <button class="item-photo-btn" data-img="${item.image_url}" data-name="${item.name}" data-desc="${item.description || ''}" title="Ver foto del plato">
        <span style="font-size: 1.1em; margin-right: 3px; pointer-events: none;">📸</span> Ver
      </button>
    ` : '';
    ```
- **Comportamiento en Ejecución:**
  Cada plato con foto muestra un botón tipo píldora (`border-radius: 20px`) con un destello brillante que se repite indefinidamente cada 3 segundos en bucle.
- **Impacto:** Distracción visual constante, sobrecarga de composición en la GPU y estética de videojuego móvil "free-to-play".
- **Referencia SDD:** `specs/design-system-spec.md` Sección 3.A; `specs/SDD_MASTER.md` Sección 4.

---

### [DT-07] Familias tipográficas y su uso disperso

- **Archivos y Líneas:**
  - `src/style.css`: Línea 1 (8 familias cargadas vía Google Fonts).
  - `admin.html`: Líneas 363–378 (Selectores para 4 fuentes de título y 4 de texto).
  - `experiencia.html`: Líneas 11–13 (Montserrat + Playfair Display).
  - `src/style.css`: Líneas 9–10 (`--font-serif: 'Playfair Display'`, `--font-sans: 'Inter'`).
- **Código Actual Observado:**
  - Se importan simultáneamente: `Playfair Display`, `Inter`, `Cinzel`, `Cormorant Garamond`, `DM Serif Display`, `Lato`, `Montserrat`, `Open Sans`.
  - El backoffice permite a cualquier administrador cambiar las fuentes dinámicamente guardando claves `font_title` y `font_text` en Firestore `site_content`.
- **Comportamiento en Ejecución:**
  Se descargan cientos de kilobytes de archivos WOFF2/TTF de fuentes que no se usan o se usan inconsistentemente entre páginas.
- **Impacto:** Peso inflado del bundle de red, inconsistencia visual tipográfica y falta de disciplina editorial.
- **Referencia SDD:** `specs/design-system-spec.md` Sección 2; `specs/performance-spec.md` Sección 4.A.

---

### [DT-08] Emojis hardcodeados (`🐟`, `🥩`, `🌶️`, `🌾`, `📸`) en títulos de platos y categorías en `src/main.ts`

- **Archivos y Líneas:**
  - `src/main.ts`: Líneas 240–257 (Diccionario `tagIcons` con emojis).
  - `src/main.ts`: Línea 278 (Emoji `📸` en botón de foto).
  - `src/main.ts`: Línea 285 (`<h3>${item.name}${icons}${photoBtn}</h3>`).
  - `src/main.ts`: Líneas 448, 450 (`Mixología 🍸`, `El Dulce Final 🍰` en galería).
- **Código Actual Observado (`src/main.ts:240-257` y `285`):**
  ```typescript
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

  // ...
  <h3>${item.name}${icons}${photoBtn}</h3>
  ```
- **Comportamiento en Ejecución:**
  En `carta.html`, cada plato tiene emojis de colores pegados directamente a su nombre en el `<h3>`.
- **Impacto:** Rompe el estándar de alta cocina Michelin, pareciendo un menú informal de comida rápida.
- **Referencia SDD:** `specs/design-system-spec.md` Sección 3.A; `specs/SDD_MASTER.md` [DT-03].

---

### [DT-09] Etiquetas de alérgenos y resiliencia de precios duales (`price == 0`)

- **Archivos y Líneas:**
  - `src/main.ts`: Líneas 267–273 (Lógica de precio dual).
  - `src/main.ts`: Líneas 240–257 (Falta de enum tipado de alérgenos).
  - `src/admin.ts`: Línea 198 (Visualización errónea con símbolo de Soles `S/.` en vez de Euros `€`).
- **Código Actual Observado (`src/main.ts:267-273`):**
  ```typescript
  const hasNumericPrice = item.price > 0;
  let priceDisplay = hasNumericPrice ? `${parseFloat(item.price).toFixed(2)}€` : item.description;
  let descriptionDisplay = hasNumericPrice ? (item.description || '') : '';
  const priceClass = !hasNumericPrice ? 'menu-item-price dual' : 'menu-item-price';
  ```
- **Comportamiento en Ejecución:**
  La resiliencia de precios duales funciona correctamente (si `price <= 0`, toma la descripción como "Precio según mercado" o indicación especial), pero no existe tipado formal contra `AllergenTag` de `specs/openapi.yaml`, y los alérgenos no se renderizan como micro-etiquetas sobrias (`.allergen-pill`). En el admin se muestra el símbolo peruano `S/.`, cuando la carta pública cobra en euros `€`.
- **Impacto:** Desalineación contractual con OpenAPI 3.1 y visual con el Design System.
- **Referencia SDD:** `specs/openapi.yaml` componente `AllergenTag`; `specs/design-system-spec.md` Sección 3.A; `specs/SDD_MASTER.md` Regla 4.

---

### [DT-10] Normalización de URLs de Cloudinary en `src/admin.ts` y Firestore `gallery_items` vs Firebase Storage

- **Archivos y Líneas:**
  - `src/admin.ts`: Líneas 10–21 (`uploadToCloudinary` con reemplazo ingenuo).
  - `src/admin.ts`: Líneas 441–448 (`content: publicUrl + '?v=' + Date.now()`).
  - `src/admin.ts`: Líneas 537, 593 (Lectura y borrado en Firebase Storage `ref(storage, 'restaurante-assets')`).
  - `src/admin.ts`: Líneas 607–625 (Subida a Cloudinary pero sin registro en Firestore ni Storage).
  - `src/main.ts`: Líneas 381–418 (Lectura de galería en Firebase Storage).
- **Código Actual Observado:**
  - `src/admin.ts:19-20`:
    ```typescript
    const data = await res.json();
    return data.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_800,c_limit/');
    ```
  - `src/admin.ts:445`:
    ```typescript
    content: publicUrl + '?v=' + Date.now(),
    ```
  - `src/admin.ts:537`:
    ```typescript
    const listFolderRef = ref(storage, 'restaurante-assets');
    const res = await listAll(listFolderRef);
    data = res.items;
    ```
  - `src/admin.ts:619`:
    ```typescript
    await uploadToCloudinary(file);
    // ¡No guarda en Firestore ni en Storage!
    ```
- **Comportamiento en Ejecución:**
  Existe un conflicto de diseño fundamental:
  1. Al subir una foto desde el panel de galería del admin, se envía a Cloudinary, pero **nunca se registra en ninguna base de datos**.
  2. La función `loadGalleryAdmin()` y la galería pública en `src/main.ts` intentan leer los archivos desde **Firebase Storage**.
  3. Al guardar imágenes del sitio en `saveSectionContent`, se concatena `?v=...` a la URL de Cloudinary, rompiendo la caché y corrompiendo la URL si se re-edita.
  4. La colección Firestore `gallery_items` (definida en `specs/admin-spec.md` y `specs/openapi.yaml`) no existe ni es consultada en el código.
- **Impacto:** Fotos subidas que desaparecen, URLs degradadas y dependencia residual de Firebase Storage.
- **Referencia SDD:** `specs/admin-spec.md` Secciones 1 y 2; `specs/SDD_MASTER.md` [DT-04] y [DT-05].

---

### [DT-11] Input de texto libre de alérgenos en `admin.html` vs selector interactivo de chips

- **Archivos y Líneas:**
  - `admin.html`: Líneas 678–680 (`#item-tags`).
  - `src/admin.ts`: Líneas 302–308 y 336–339.
- **Código Actual Observado:**
  - `admin.html:678-680`:
    ```html
    <label>Etiquetas (picante, pescado, marisco, carne, pollo, gluten-free)
        <input type="text" id="item-tags" style="width:100%; padding:8px;" placeholder="Separadas por comas">
    </label>
    ```
  - `src/admin.ts:336-339`:
    ```typescript
    const tagsInput = (document.getElementById('item-tags') as HTMLInputElement).value;
    // ...
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    ```
- **Comportamiento en Ejecución:**
  El usuario del backoffice debe escribir manualmente los alérgenos separados por comas. Cualquier error tipográfico (`pesacdo`, `mariscos`) provoca que el plato no aparezca en los filtros de la carta pública (`carta.html?tag=pescado`).
- **Impacto:** Corrupción de datos en Firestore y fallos de filtrado en cliente.
- **Referencia SDD:** `specs/admin-spec.md` Sección 4; `specs/openapi.yaml` componente `AllergenTag`.

---

### [DT-12] Ausencia de botones de acción operativa en la tabla de reservas de `admin.html` / `src/admin.ts`

- **Archivos y Líneas:**
  - `admin.html`: Líneas 620–635 (Encabezado de la tabla de reservas).
  - `src/admin.ts`: Líneas 630–656 (`loadReservations`).
- **Código Actual Observado:**
  - `admin.html:621-630`:
    ```html
    <thead>
        <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Cliente</th>
            <th>Pax</th>
            <th>Contacto</th>
            <th>Motivo</th>
        </tr>
    </thead>
    ```
  - `src/admin.ts:645-654`:
    ```typescript
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${res.reservation_date}</td>
        <td>${res.reservation_time || '-'}</td>
        <td>${res.customer_name}</td>
        <td>${res.number_of_people}</td>
        <td>${res.customer_email}</td>
        <td>${res.occasion || '-'}</td>
    `;
    reservationsTableBody.appendChild(row);
    ```
- **Comportamiento en Ejecución:**
  La tabla de reservas es un visor pasivo de solo lectura. No recupera el `id` del documento de Firestore, por lo que no es posible:
  - Cambiar el estado a `confirmed`.
  - Cancelar la reserva (`cancelled`) para liberar la mesa en el cálculo de disponibilidad de `getAvailableSlots`.
  - Iniciar un chat de WhatsApp con el cliente con un solo clic.
- **Impacto:** El personal de sala no puede gestionar las mesas desde la plataforma web.
- **Referencia SDD:** `specs/admin-spec.md` Sección 5; `specs/SDD_MASTER.md` [DT-13].

---

### [DT-13] Flujo de conserjería de reservas: bloqueo de popup, tarjeta con código `SP-XXXX`, control de aforo y toasts RFC 9457

- **Archivos y Líneas:**
  - `src/main.ts`: Líneas 572–646 (Manejador del formulario de reservas).
  - `src/reservations.ts`: Líneas 40–64 (`getAvailableSlots` cuenta disponibilidad pero no valida aforo en submit).
  - `index.html`: Líneas 325–360 (Formulario de reservas).
  - `src/admin.ts`: Líneas 219, 591 (Uso de `confirm()` nativo del navegador).
- **Código Actual Observado (`src/main.ts:608-634`):**
  ```typescript
  const waUrl = `https://wa.me/${restaurantPhone}?text=${encodeURIComponent(waMessage)}`;

  // Try to open WhatsApp
  const newWindow = window.open(waUrl, '_blank');

  if (formMessage) {
    formMessage.innerHTML = '¡Reserva guardada! Confirmando en WhatsApp...<br>';
    // ...
  }

  if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
    // Popup blocked
    console.log("Popup blocked");
  }
  ```
- **Comportamiento en Ejecución:**
  1. **Bloqueo de Popup:** `window.open` se llama después de un `await addDoc(...)` asíncrono. Los navegadores móviles modernos consideran que la acción ya no proviene de un gesto directo del usuario y bloquean la apertura de la ventana de WhatsApp.
  2. **Sin Código Localizador:** No se genera un código identificador formal con formato `SP-XXXX` (requerido por SDD y OpenAPI).
  3. **Sin Tarjeta de Confirmación en 2 Pasos:** Simplemente se inyecta un texto dentro de un `div#form-message`.
  4. **Sin Validación de Aforo en Envío:** Si dos clientes eligen la misma franja simultáneamente, el segundo no es rechazado. Además, reservas de más de 6 comensales no disparan la advertencia obligatoria de mesa imperial / coordinación con el maître (Regla 2 del dominio en SDD 3.2).
  5. **Manejo de Errores Informal:** Los errores se muestran en texto básico o mediante diálogos nativos (`confirm()` en admin), violando la directiva de Problem Details RFC 9457.
- **Impacto:** Pérdida de reservas en dispositivos móviles por popup bloqueado, riesgo de sobreventa de mesas y experiencia de usuario burocrática.
- **Referencia SDD:** `specs/SDD_MASTER.md` Secciones 3.2 (Reglas 1, 2, 6) y [DT-11]; `specs/openapi.yaml` esquemas `ReservationSlot`, `ReservationInput`, `ProblemDetails`.

---

## 3. Residuos de Supabase y Dependencias Huérfanas

- **`src/supabase.ts`:** Archivo que crea cliente de Supabase usando variables de entorno que ya no son necesarias.
- **`package.json`:** Línea 19 contiene `"@supabase/supabase-js": "^2.104.1"`.
- **Scripts en la raíz:** Múltiples scripts `.sql` y `.js` antiguos de auditorías previas (`check_db.js`, `check_bucket.js`, `backup_menu_items.json`, `supabase_schema.sql`). La fuente única de datos viva es Google Firebase Firestore.

---

## 4. Matriz de Localización Rápida para Agentes de Implementación

| ID | Título de la Deuda | Archivos Afectados | Líneas Clave |
| :--- | :--- | :--- | :--- |
| **[DT-01]** | Imágenes Supabase en galería | `index.html` | 22, 216–261 |
| **[DT-02]** | `@import` síncrono vs `preconnect` | `src/style.css`, `index.html`, `carta.html`, `admin.html` | `src/style.css:1`, `index.html:24-25`, `carta.html:13-14` |
| **[DT-03]** | Atributos LCP en Hero | `index.html` | 108–120 |
| **[DT-04]** | Listeners de scroll pesados | `src/main.ts` | 108–114, 156–175, 183–198 |
| **[DT-05]** | Tokens Quiet Luxury, marco 80px y SVGs | `src/style.css` | 3–12, 449–561 |
| **[DT-06]** | Animación reflectante continua (shiny) | `src/style.css`, `src/main.ts` | `src/style.css:1403-1450`, `src/main.ts:276-280` |
| **[DT-07]** | Disciplina de 2 familias tipográficas | `src/style.css`, `admin.html`, HTMLs | `src/style.css:1,9-10`, `admin.html:363-378` |
| **[DT-08]** | Emojis en títulos de platos/categorías | `src/main.ts` | 240–257, 278, 285, 448, 450 |
| **[DT-09]** | Micro-etiquetas alérgenos y precios duales | `src/main.ts`, `src/admin.ts` | `src/main.ts:267-273`, `src/admin.ts:198` |
| **[DT-10]** | Normalizador Cloudinary y galería Firestore | `src/admin.ts`, `src/main.ts` | `src/admin.ts:10-21,445,537,607-626`, `src/main.ts:381-418` |
| **[DT-11]** | Selector de chips interactivo de alérgenos | `admin.html`, `src/admin.ts` | `admin.html:678-680`, `src/admin.ts:302-308,336-339` |
| **[DT-12]** | Botones de acción en reservas del admin | `admin.html`, `src/admin.ts` | `admin.html:620-635`, `src/admin.ts:630-656` |
| **[DT-13]** | Conserjería de reservas, aforo, `SP-XXXX`, RFC 9457 | `src/main.ts`, `src/reservations.ts`, `index.html` | `src/main.ts:572-646`, `src/reservations.ts:40-64` |

---
**Fin del informe de estado de código.**
