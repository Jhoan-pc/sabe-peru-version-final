# Workspace Rule: Web Performance & Speed Constraints

Aplica estas restricciones de rendimiento a cualquier cambio en código HTML, CSS, JavaScript o TypeScript:

1. **Gestión de Imágenes y Multimedia:**
   - La imagen principal de cabecera/hero (LCP) debe cargar de inmediato: usar `loading="eager"`, `fetchpriority="high"`, y `decoding="async"`. Nunca añadirle `loading="lazy"`.
   - Todas las demás imágenes deben incluir `loading="lazy"` y `decoding="async"`.
   - Siempre define `aspect-ratio` o atributos `width`/`height` en elementos multimedia para evitar Layout Shifts (CLS).
   - En llamadas a Cloudinary, forzar siempre `f_auto,q_auto,w_800,c_limit` para prevenir descarga de imágenes pesadas no optimizadas.

2. **Eventos y Animaciones en el Hilo Principal:**
   - Todo listener de `scroll`, `touchmove` o `wheel` debe usar `{ passive: true }` para no penalizar el INP.
   - Usar `IntersectionObserver` para detección de elementos en pantalla o animaciones; no hacer cálculos continuos de `getBoundingClientRect()` dentro de bucles de scroll.
   - Las animaciones deben limitarse a propiedades aceleradas por GPU: `transform` y `opacity`. Evitar animar `height`, `width`, `top`, `margin` o `padding`.

3. **Fuentes y Carga de Red:**
   - Toda fuente personalizada debe declarar `font-display: swap;`.
   - Evitar llamadas bloqueantes en el `<head>`. Usar scripts con `type="module"` o atributos `defer`.

4. **Bundle y Consultas:**
   - Cachear en memoria las consultas repetidas de Firestore (`site_content` o `menu_items`).
   - Evitar dependencias innecesarias de gran peso.
