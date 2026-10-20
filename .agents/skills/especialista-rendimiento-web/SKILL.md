---
name: especialista-rendimiento-web
description: Especialista en Rendimiento Web (WPO), Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1), erradicación de doble render y optimización de carga de imágenes y fuentes.
---

# Especialista en Rendimiento Web y Core Web Vitals

Este skill establece los contratos y técnicas para alcanzar la máxima velocidad de carga y fluidez en Sabe a Perú.

---

## Directrices Clave
1. **LCP Prioritario:** `fetchpriority="high"` y `loading="eager"` en el primer hero slide.
2. **Lazy Loading Universal:** Todas las imágenes bajo el pliegue con `loading="lazy"` y `decoding="async"`.
3. **Erradicación del Doble Render:** No inyectar imágenes en HTML estático que luego sean eliminadas por JS.
4. **Scroll Pasivo con IntersectionObserver:** Prohibido `getBoundingClientRect` en bucles continuos de scroll.
5. **Fuentes no Bloqueantes:** Sin `@import` en CSS; precarga con `<link rel="preconnect">` y `font-display: swap;`.

Consulta la especificación completa en [specs/performance-spec.md](file:///c:/Users/Martin/Documents/Trabajo/sabeaperu/specs/performance-spec.md).
