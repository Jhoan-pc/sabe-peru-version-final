---
name: web-performance
description: >-
  Comprehensive guide and workflows for web performance optimization (WPO), Core Web Vitals (LCP, INP, CLS), asset compression, Vite bundle tuning, and critical rendering path optimization. Use when auditing, profiling, or optimizing web applications for maximum speed.
---

# Web Performance & Core Web Vitals Optimization Guide

Este skill proporciona procedimientos, estándares y técnicas para auditar y optimizar el rendimiento web al máximo nivel.

---

## 1. Métricas Objetivo (Core Web Vitals)

| Métrica | Definición | Meta (Bueno) | Principales Técnicas de Optimización |
| :--- | :--- | :--- | :--- |
| **LCP** | *Largest Contentful Paint* (Elemento visual más grande) | **< 2.5 s** | Preload del elemento LCP con `fetchpriority="high"`, imágenes WebP/AVIF optimizadas en CDN, eliminar CSS/JS bloqueante. |
| **INP** | *Interaction to Next Paint* (Respuesta a interacción) | **< 200 ms** | Reducir tareas largas en JS (>50ms), debouncing en listeners de scroll/input, evitar reflows forzados. |
| **CLS** | *Cumulative Layout Shift* (Estabilidad visual) | **< 0.1** | Dimensiones fijas (`aspect-ratio` o `width`/`height`) en imágenes, videos, iframes y anuncios; `font-display: swap` con fallbacks coincidentes. |
| **FCP** | *First Contentful Paint* (Primer render con contenido) | **< 1.8 s** | Reducción de TTFB, compresión Brotli/Gzip, Critical CSS inlined. |
| **TTFB** | *Time to First Byte* (Respuesta del servidor) | **< 800 ms** | CDN edge caching, DNS preconnect (`<link rel="preconnect">`). |

---

## 2. Reglas de Optimización por Capa

### A. Multimedia (Imágenes y Videos)
1. **Regla LCP vs Lazy:**
   - La imagen principal de portada (Hero Image) **NUNCA** debe tener `loading="lazy"`.
     ```html
     <!-- Correcto para LCP -->
     <img src="/assets/hero.webp" fetchpriority="high" loading="eager" decoding="async" alt="Hero">
     ```
   - Todas las demás imágenes debajo del pliegue (galería, platos de la carta, footer) **DEBEN** tener `loading="lazy"` y `decoding="async"`.
2. **Dimensiones y Aspect-Ratio:**
   - Prevenir saltos de layout (CLS) reservando el espacio antes de que la imagen descargue:
     ```css
     .menu-item-img {
       aspect-ratio: 16 / 9;
       width: 100%;
       object-fit: cover;
     }
     ```
3. **Optimización con Cloudinary / CDN:**
   - Usar parámetros dinámicos de transformación: `f_auto,q_auto,w_800,c_limit`.
   - No servir imágenes de 4000px a una pantalla móvil de 400px.

### B. Tipografías Web
1. **Preload de Fuentes Críticas:**
   ```html
   <link rel="preload" href="/fonts/cinzel-v19-latin-regular.woff2" as="font" type="font/woff2" crossorigin>
   ```
2. **Declaración `font-display`:**
   - Usar siempre `font-display: swap;` para asegurar que el texto sea legible inmediatamente.

### C. JavaScript y Eventos
1. **Throttling y Passive Listeners en Scroll:**
   ```typescript
   // Siempre usar passive: true para no bloquear el hilo de scroll
   window.addEventListener('scroll', handleScroll, { passive: true });
   ```
2. **IntersectionObserver sobre Eventos de Scroll:**
   - Utilizar `IntersectionObserver` para animaciones reveal y carga diferida en lugar de escuchar coordenadas continuas en `window.onscroll`.

### D. Optimización de Bundle (Vite)
1. En `vite.config.ts`, separar librerías pesadas en chunks independientes para maximizar la caché del navegador:
   ```typescript
   build: {
     rollupOptions: {
       output: {
         manualChunks: {
           firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage']
         }
       }
     }
   }
   ```

---

## 3. Checklist de Auditoría de Rendimiento

- [ ] ¿El elemento LCP tiene `fetchpriority="high"` y está exento de `loading="lazy"`?
- [ ] ¿Todas las imágenes debajo del pliegue tienen `loading="lazy"` y `decoding="async"`?
- [ ] ¿Tienen todas las imágenes y videos dimensiones explícitas o `aspect-ratio` en CSS?
- [ ] ¿Están los listeners de eventos táctiles y de scroll configurados con `{ passive: true }`?
- [ ] ¿Se utiliza `IntersectionObserver` para animaciones y elementos que entran en pantalla?
- [ ] ¿Se eliminó cualquier llamada bloqueante en el `<head>`?
- [ ] ¿Están las fuentes web servidas en formato WOFF2 moderno con `font-display: swap`?
