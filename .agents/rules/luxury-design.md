# Workspace Rule: Luxury & Fine-Dining Design Principles

Aplica estos principios de diseño a todo archivo HTML, CSS, JavaScript o TypeScript que afecte a la interfaz de usuario en este repositorio:

1. **Inspiración:**
   - Restaurantes 3 Estrellas Michelin (*El Celler de Can Roca*, *Osteria Francescana*, *Eleven Madison Park*, *Atelier Crenn*, *Quay*).
   - Estética: "Quiet Luxury", limpia, espaciosa, editorial y refinada.

2. **Espaciado y Composición:**
   - Dar siempre amplio respiro visual (espacio negativo). Usar paddings de sección generosos (`clamp(5rem, 8vw, 10rem)`).
   - Evitar saturación de elementos o cuadrículas apretadas.

3. **Tipografía:**
   - Titulares (`h1`, `h2`, `h3`): Serifas de alto contraste (*Playfair Display*, *Cormorant Garamond* o equivalentes), peso sutil y proporciones monumentales.
   - Micro-copy (Navegación, botones, badges, fechas): Sans-serif geométrica en mayúsculas sostenidas con tracking amplio (`letter-spacing: 0.18em` a `0.25em`), tamaños entre 10px y 12px.
   - Párrafos: Altura de línea amplia (`line-height: 1.7` a `1.9`) en colores cálidos no blancos puros (`#e8e4dc`, `#c5c0b8`).

4. **Colores y Acentos:**
   - Prohibido el uso de colores saturados o estridentes.
   - Fondo principal: Carbón profundo u obsidiana (`#0d0d0d`, `#121212`, `#161514`), nunca negro `#000000` plano.
   - Acentos: Oro champán bruñido (`#C5A880`), bronce suave y platino cálido, usados con estricta moderación.

5. **Bordes y Geometría:**
   - Prohibidos los bordes muy redondeados tipo app infantil (`border-radius` máximo `0px` a `2px`).
   - Líneas de separación ultra-finas (*hairline*, `1px` o `0.5px`) con opacidades reducidas (`rgba(255, 255, 255, 0.08)` o `rgba(197, 168, 128, 0.2)`).

6. **Interacciones:**
   - Transiciones suaves y sin prisa (`cubic-bezier(0.16, 1, 0.3, 1)` entre 400ms y 700ms).
   - Animaciones y efectos de hover sutiles (subrayados expansivos, zoom milimétrico en imágenes).
