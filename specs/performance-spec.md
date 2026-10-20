# Especificación Formal de Rendimiento Web y Core Web Vitals (Performance Spec)
**Estándar:** Google Core Web Vitals & WPO de Alta Velocidad  
**Estado:** Aprobado para Especificación (Sin ejecución de código aún)  
**Versión:** 1.0.0  
**Responsables:** `especialista_rendimiento_web` & `especialista_qa_navegador`

---

## 1. Presupuestos de Rendimiento (Performance Budgets & SLAs)

Todo cambio en el código fuente debe cumplir estrictamente con los siguientes umbrales en condiciones de red móvil simulada (4G lenta, CPU throttling 4x):

| Métrica | Definición | Límite Máximo Aceptable | Objetivo Ideal (Michelin-Class) |
| :--- | :--- | :--- | :--- |
| **LCP** | *Largest Contentful Paint* | **< 2.5 s** | **< 1.8 s** |
| **INP** | *Interaction to Next Paint* | **< 200 ms** | **< 100 ms** |
| **CLS** | *Cumulative Layout Shift* | **< 0.1** | **< 0.02** |
| **FCP** | *First Contentful Paint* | **< 1.8 s** | **< 1.2 s** |
| **TTFB** | *Time to First Byte* | **< 800 ms** | **< 400 ms** |
| **Bundle JS Inicial** | Peso de JavaScript en primera vista | **< 150 kB** (gzip) | **< 80 kB** (gzip) |
| **Puntuación Lighthouse** | Auditoría móvil de Google | **>= 90 / 100** | **>= 95 / 100** |

---

## 2. Contratos de Red y Entrega de Multimedia

### A. Erradicación del Doble Renderizado (Ghost Loading)
* **Regla Inmutable:** Queda estrictamente prohibido colocar en el HTML etiquetas `<img>` con fuentes que luego serán sobreescritas o vaciadas con `innerHTML = ''` en JavaScript.
* **Contrato de la Galería:** El contenedor HTML `#main-gallery-grid` debe iniciar con un esqueleto semántico ligero (*Skeleton loader*) o permanecer vacío con dimensiones fijas (`height: 55vh; min-height: 400px;`) hasta que el módulo de datos inyecte los elementos definitivos.

### B. Contrato de Carga de Imágenes (LCP vs Below-the-Fold)
1. **Elemento LCP (Hero Slide Activo):**
   - Debe poseer: `loading="eager"`, `fetchpriority="high"`, `decoding="async"`.
   - No debe depender de scripts externos para comenzar su descarga.
2. **Imágenes Secundarias y Bajo el Pliegue (Filosofía, Especialidades, Galería, Modal):**
   - Deben poseer obligatoriamente: `loading="lazy"`, `decoding="async"`.
   - Dimensiones reservadas obligatorias mediante `aspect-ratio` en CSS para garantizar `CLS = 0`.
3. **Imágenes en Cloudinary:**
   - La construcción de URLs debe forzar siempre las transformaciones automáticas:
     `f_auto,q_auto,w_800,c_limit`.

---

## 3. Contratos del Hilo Principal (Main Thread) y Animaciones

### A. Erradicación de Forced Synchronous Layouts en Scroll
* **Prohibición:** Queda prohibido registrar listeners `window.addEventListener('scroll', ...)` que lean propiedades de geometría (`getBoundingClientRect()`, `offsetTop`, `offsetHeight`, `scrollY`) en cada cuadro sin control de tasa de refresco.
* **Contrato de Revelación (Reveal Elements):**
  - Todo efecto de aparición (*reveal on scroll*) debe implementarse exclusivamente mediante la API nativa **`IntersectionObserver`**:
    ```typescript
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          obs.unobserve(entry.target); // Dejar de observar una vez visible
        }
      });
    }, { rootMargin: '0px 0px -80px 0px', threshold: 0.1 });
    ```
* **Contrato de Eventos Continuos:**
  - Los listeners de `scroll` residuales (ej. header fijo) deben declarar obligatoriamente `{ passive: true }` y limitar su ejecución con `requestAnimationFrame` o bandera booleana (*ticking*).

### B. Gestión de Bucle y Temporizadores (`setInterval`)
* **Contrato de Visibilidad:**
  - Los intervalos de carrusel (Hero slideshow cada 5s y auto-scroll de galería cada 4s) deben pausarse automáticamente si:
    1. El usuario cambia de pestaña (`document.visibilityState === 'hidden'`).
    2. El elemento sale del viewport visible (controlado por `IntersectionObserver`).
    3. El usuario interactúa mediante hover o toque (`mouseenter`, `touchstart`).

---

## 4. Contrato de Carga de Fuentes y Critical Rendering Path

### A. Erradicación de `@import` en CSS
* **Prohibición:** Ninguna hoja de estilo CSS podrá contener sentencias `@import url('https://fonts.googleapis.com/...')`.
* **Contrato de Carga en `<head>`:**
  - Las fuentes aprobadas en el SDD (*Cormorant Garamond* y *Inter/Montserrat*) deben declararse en el HTML con preconexión temprana:
    ```html
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Inter:wght@300;400;600&display=swap">
    ```
  - Es obligatorio el parámetro `&display=swap` para evitar el bloqueo del renderizado de texto.

---

## 5. Contrato de Compilación y Bundling (Vite)

* **Code-Splitting y Aislamiento de Dependencias:**
  - En [`vite.config.ts`](file:///c:/Users/Martin/Documents/Trabajo/sabeaperu/vite.config.ts), se debe configurar `manualChunks` para desacoplar el motor de Firebase del código de la aplicación.
  - La carga de módulos pesados de administración (como el cliente de subida de imágenes o SDKs de autenticación) no debe contaminar el bundle de las páginas públicas (`index.html`, `carta.html`).

---

## 6. Criterios de Aceptación QA (Quality Gates)

Antes de considerar concluida la implementación de rendimiento, el agente `especialista_qa_navegador` ejecutará las siguientes verificaciones:

1. [ ] **0 Descargas Fantasma:** Comprobar en el panel Network del navegador que ninguna imagen sea descargada y luego destruida sin uso.
2. [ ] **0 Advertencias de Rendimiento:** La consola no debe arrojar mensajes de *"Added non-passive event listener to a scroll-blocking event"*.
3. [ ] **Fluidez a 60 fps:** El desplazamiento vertical a lo largo de toda la página no debe presentar congelamiento de fotogramas (*dropped frames*).
4. [ ] **Lighthouse Mobile Score >= 90:** Certificación formal en emulación de dispositivo móvil.
