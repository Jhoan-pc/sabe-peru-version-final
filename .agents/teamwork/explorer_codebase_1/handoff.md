# Handoff Report — Codebase Survey [DT-01] a [DT-13]
**Agente Emisor:** `teamwork_preview_explorer_survey_codebase` (explorer_codebase_1)  
**Agente Receptor / Destino:** `ed44eb6a-a075-4b06-a258-caefe2915195` (Orchestrator)  
**Tipo de Handoff:** Hard (Tarea de exploración completada)  
**Fecha:** 2026-10-09

---

## 1. Observation

A través de herramientas directas de lectura (`view_file`, `grep_search`, `run_command` con `Select-String` y `npm run pipeline`), se observó y verificó lo siguiente:

1. **[DT-01] Galería estática en `index.html`:**
   - Líneas 216–261 de `index.html`: Contenedor `<div class="gallery-grid" id="main-gallery-grid">` contiene 10 etiquetas `<img>` cableadas con URLs como:
     `src="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/Galeria1.png"`.
   - Línea 22 de `index.html`: `<meta property="og:image" content="https://xdslypbjmenthwyrarui.supabase.co/storage/v1/object/public/restaurante-assets/Hero1.png">`.
   - `src/main.ts` línea 419: Ejecuta `galleryGrid!.innerHTML = '';`, sobreescribiendo dichas 10 imágenes al cargar la página.

2. **[DT-02] Bloqueo de fuentes en CSS y cabeceras HTML:**
   - `src/style.css` línea 1: `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@300;400;600&family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Serif+Display:ital@0;1&family=Lato:ital,wght@0,300;0,400;0,700;1,400&family=Montserrat:ital,wght@0,300;0,400;0,600;1,400&family=Open+Sans:ital,wght@0,300;0,400;0,600;1,400&display=swap');` importa 8 familias tipográficas de forma síncrona.
   - `index.html` (líneas 24–25), `carta.html` (líneas 13–14) y `admin.html` (líneas 8–9) carecen de etiquetas `<link rel="preconnect">` hacia `fonts.googleapis.com` y `fonts.gstatic.com`.

3. **[DT-03] Prioridad de carga del Hero:**
   - `index.html` líneas 108–120: `#img-hero-1` (`src="/assets/Hero1.webp"`) no posee `fetchpriority="high"`, `loading="eager"` ni `decoding="async"`. Los slides 2 a 4 no tienen `loading="lazy"`.

4. **[DT-04] Listeners de scroll síncronos en `src/main.ts`:**
   - Líneas 108–114: `window.addEventListener('scroll', () => { if (window.scrollY > 50) ... });`.
   - Líneas 156–175: `window.addEventListener('scroll', revealOnScroll);` llamando a `reveal.getBoundingClientRect().top` en cada evento.
   - Líneas 177–199: `window.addEventListener("scroll", () => { sections.forEach(section => section.offsetTop ...); });`.

5. **[DT-05] Estilos visuales en `src/style.css`:**
   - Líneas 3–12: Ausencia de variables `--lux-*`.
   - Líneas 466–468: `.page-carta .section-container { border-width: 80px 80px; border-style: solid; border-color: #2e2620; }`.
   - Líneas 476–525: Pseudo-elementos `::before` y `::after` con SVGs de Colibrí, Espiral, Araña, Zigzag, Mono, Manos y Árbol.
   - Líneas 528–561: Glifos laterales en `.menu-grid::before` y `::after`.

6. **[DT-06] Animación shiny en fotos:**
   - `src/style.css` líneas 1427–1450: `.item-photo-btn::after` con `animation: shiny-button 3s infinite;`.
   - `src/main.ts` líneas 276–280: Botón `.item-photo-btn` con `📸 Ver`.

7. **[DT-07] Tipografía dispersa:**
   - 8 fuentes importadas en `src/style.css:1`.
   - `admin.html` líneas 363–378 ofrece selectores con 8 opciones distintas de fuentes guardadas en CMS.

8. **[DT-08] Emojis en títulos de platos en `src/main.ts`:**
   - Líneas 240–257: Mapa `tagIcons` con `🐟`, `🦐`, `🥩`, `🍗`, `🌶️`, `🌾`, `🥚`, `🥛`, `🫘`, `🥜`, `🟡`, `🥬`, `🦪`, `🥯`.
   - Línea 285: Inyección en título: `<h3>${item.name}${icons}${photoBtn}</h3>`.

9. **[DT-09] Precios duales y alérgenos:**
   - `src/main.ts` líneas 267–272: Conserva resiliencia cuando `price <= 0` mostrando `item.description`.
   - `src/admin.ts` línea 198: Muestra precios con símbolo `S/.` en vez de `€`.

10. **[DT-10] Pipeline de imágenes Cloudinary vs Firebase Storage:**
    - `src/admin.ts` línea 20: Reemplazo simple de string `replace('/upload/', '/upload/f_auto,q_auto,w_800,c_limit/')`.
    - `src/admin.ts` línea 445: Concatena `content: publicUrl + '?v=' + Date.now()`.
    - `src/admin.ts` líneas 537 y 593: Lee y borra de `storage` (`ref(storage, 'restaurante-assets')`).
    - `src/admin.ts` línea 619: Sube a Cloudinary sin registrar en Firestore ni Storage.
    - `src/main.ts` líneas 381–418: Lee galería desde `storage`.
    - Colección Firestore `gallery_items`: Inexistente en el código actual.

11. **[DT-11] Entrada de alérgenos en `admin.html`:**
    - `admin.html` líneas 678–680: `<input type="text" id="item-tags" placeholder="Separadas por comas">`.
    - `src/admin.ts` líneas 336–339: `tagsInput.split(',').map(...)`.

12. **[DT-12] Operativa de reservas en `admin.html`:**
    - `admin.html` líneas 620–635: No existe columna de acciones.
    - `src/admin.ts` líneas 630–656: Renders estáticos sin ID de documento ni botones (Confirmar, Cancelar, WhatsApp).

13. **[DT-13] Conserjería de reservas en `src/main.ts`:**
    - `src/main.ts` línea 611: `window.open(waUrl, '_blank')` llamado tras `await addDoc(...)` asíncrono.
    - No existe validación de aforo concurrente en el momento del envío.
    - No existe distinción ni aviso especial para reservas de más de 6 comensales.
    - No se genera localizador `SP-XXXX`.
    - Los errores no usan formato RFC 9457 ni toasts estructurados.

14. **Estado de Compilación:**
    - Comando: `npm run pipeline` (`tsc --noEmit && vite build`).
    - Resultado: Salida limpia sin errores de compilación (`Exit Code 0`, 34 módulos empaquetados en 1.12s).

---

## 2. Logic Chain

1. A partir de las observaciones de `index.html:216-261` y `src/main.ts:419`, se constata que los 10 elementos `<img>` con fuentes de Supabase son leídos por el parser HTML e inmediatamente descartados por JS, lo que causa **Ghost Loading / Double Render** ([DT-01]).
2. A partir de `src/style.css:1` y la falta de `<link rel="preconnect">` en `index.html` y `carta.html`, se deduce que la cascada de CSS bloquea el renderizado inicial esperando la resolución externa de Google Fonts ([DT-02]).
3. A partir de `index.html:108-120`, la imagen Hero 1 no está priorizada en la cola de red del navegador frente a las diapositivas ocultas, perjudicando el **LCP** ([DT-03]).
4. A partir de `src/main.ts:156-199`, la ejecución continua de `getBoundingClientRect()` y `offsetTop` en el hilo principal durante el scroll satura la tasa de refresco, provocando **Layout Thrashing** ([DT-04]).
5. A partir de `src/style.css:449-561` y `src/style.css:3-12`, el diseño actual fuerza un marco rígido de 80px con dibujos de líneas de Nazca e ignora los tokens oficiales de la especificación Quiet Luxury ([DT-05]).
6. A partir de `src/style.css:1427-1450` y `src/main.ts:276-280`, cada plato con foto renderiza una píldora animada en bucle infinito que no aporta valor informativo y penaliza la GPU ([DT-06]).
7. A partir de `src/style.css:1` y `admin.html:363-378`, la importación de 8 familias genera sobrecarga de descarga y dispersión tipográfica ([DT-07]).
8. A partir de `src/main.ts:240-257, 285`, los emojis duros en títulos infantizan la propuesta gastronómica de alta gama ([DT-08]).
9. A partir de `src/main.ts:267-272` y `specs/openapi.yaml`, la resiliencia de precios duales está implementada pero faltan micro-etiquetas tipográficas sobrias y el enum de alérgenos formal ([DT-09]).
10. A partir de `src/admin.ts:10-21, 445, 537, 607-626` y `src/main.ts:381-418`, el sistema de galería sube a Cloudinary pero lee de Firebase Storage, creando una desincronización total y corrompiendo URLs con `?v=` ([DT-10]).
11. A partir de `admin.html:678-680` y `src/admin.ts:336-339`, el input de texto libre expone el catálogo a erratas humanas que rompen los filtros de la carta ([DT-11]).
12. A partir de `admin.html:620-635` y `src/admin.ts:630-656`, el maître no puede operar reservas ni sincronizar la ocupación de mesas ([DT-12]).
13. A partir de `src/main.ts:572-646`, el flujo de reservas es vulnerable a bloqueos de popup en Safari/Chrome móvil, carece de código localizador `SP-XXXX`, no avisa a grupos de >6 personas ni valida aforo en submit ([DT-13]).

---

## 3. Caveats

- **No caveats** sobre la existencia o localización de las deudas en el código; todas han sido verificadas en archivos y líneas concretas.
- Nota operativa: `npm run pipeline` actualmente compila con éxito, por lo que cualquier refactorización posterior debe mantener esta garantía estricta de compilación (`tsc --noEmit && vite build`).
- Los scripts utilitarios en la raíz (`seed_*.js`, `check_*.js`) y `src/supabase.ts` son artefactos heredados que no deben ser consumidos en los flujos principales de producción.

---

## 4. Conclusion

El estado del repositorio confirma al 100% el diagnóstico formal de las 13 deudas técnicas catalogadas en `specs/SDD_MASTER.md`. El documento completo de mapeo ha quedado registrado en:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\explorer_codebase_1\codebase_state.md`.

La base de código está lista para que el planificador y los agentes de implementación aborden secuencialmente las fases R1 a R5 respetando los contratos SDD.

---

## 5. Verification Method

Para verificar independientemente estos hallazgos:
1. **Comprobar compilación actual:**
   ```powershell
   npm run pipeline
   ```
   (Debe resultar en Exit Code 0).
2. **Inspeccionar líneas clave reportadas:**
   - Abrir `index.html:216-261` y buscar `supabase.co`.
   - Abrir `src/style.css:1` y buscar `@import`.
   - Abrir `src/style.css:466-468` y buscar `border-color: #2e2620`.
   - Abrir `src/main.ts:156-199` y verificar `getBoundingClientRect()` y `offsetTop`.
   - Abrir `src/main.ts:240-257` y verificar emojis en `tagIcons`.
   - Abrir `src/admin.ts:537` vs `src/admin.ts:619` y contrastar `ref(storage, ...)` con `uploadToCloudinary`.
   - Abrir `admin.html:678-680` y contrastar el input de texto libre con el selector de chips requerido.
