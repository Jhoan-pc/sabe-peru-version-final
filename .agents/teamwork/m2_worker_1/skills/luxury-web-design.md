# Luxury Culinary Web Design System (3-Michelin-Star Aesthetic)

Esta guía define el sistema de diseño visual de ultra-lujo inspirado en los grandes referentes de la alta gastronomía mundial:
- **El Celler de Can Roca** (Minimalismo mediterráneo, alabastro, ritmo pausado).
- **Osteria Francescana** (Vanguardia editorial, contrastes monumentales, composiciones asimétricas).
- **Eleven Madison Park** (Quiet Luxury neoyorquino, geometría Art Déco depurada, tonos carbón y champagne).
- **Atelier Crenn** (Calidez poética, líneas finas etéreas, luz tenue).
- **Quay Restaurant** (Arquitectura contemporánea, negros profundos con acentos dorados sutiles).

---

## 1. Tokens de Diseño ("Quiet Luxury")

### Paleta de Colores
```css
:root {
  /* Fondos primarios y secundarios */
  --lux-bg-obsidian: #0b0b0b;       /* Fondo principal oscuro (nunca #000 plano) */
  --lux-bg-charcoal: #141414;       /* Secciones secundarias o tarjetas */
  --lux-bg-elevated: #1a1918;       /* Dropdowns, modales y barras de navegación */

  /* Alternativas claras (Estilo Alabastro / Lino) */
  --lux-bg-alabaster: #f9f8f5;      /* Modo claro o citas destacadas */
  --lux-bg-parchment: #f2eee9;      /* Fondos secundarios claros */

  /* Acentos metálicos tenues (Desaturados y refinados) */
  --lux-gold-champagne: #c5a880;    /* Acento oro champán primario */
  --lux-gold-burnished: #a88d65;    /* Oro envejecido para hover o bordes */
  --lux-bronze: #8e7354;            /* Detalles discretos */

  /* Tipografía y Textos */
  --lux-text-primary: #f5f2eb;      /* Blanco suave con toque cálido */
  --lux-text-secondary: #c2bdb4;    /* Gris cálido para párrafos y descripciones */
  --lux-text-muted: #858077;        /* Metadatos, etiquetas y pies de foto */
  --lux-text-dark: #1a1917;         /* Para bloques sobre alabastro */

  /* Hairlines y Bordes */
  --lux-border-hairline: rgba(245, 242, 235, 0.08);
  --lux-border-gold-subtle: rgba(197, 168, 128, 0.25);
}
```

### Tipografía y Jerarquía
1. **Titulares Principales (`display`, `h1`, `h2`):**
   - Familia: *Cormorant Garamond*, *Playfair Display*, *Cinzel* o *Canela*.
   - Proporción: Monumental con peso ligero (`font-weight: 300` o `400`).
   - Line height: Compacto y elegante (`line-height: 1.05` a `1.15`).
2. **Navegación, Botones y Eyebrows (Micro-copy):**
   - Familia: Sans-Serif geométrica (*Montserrat*, *Inter*, *Neue Haas Grotesk*).
   - Tamaño: Pequeño pero legible (`10px` a `13px`).
   - Mayúsculas sostenidas con tracking amplio: `text-transform: uppercase; letter-spacing: 0.2em;`.
3. **Cuerpo de Texto (`body`, descripciones de platos):**
   - Line height holgado: `line-height: 1.75` a `1.9`.
   - Tamaño óptimo: `15px` a `17px`.

---

## 2. Reglas de Composición y Layout

1. **Inmenso Espacio Negativo (Breathing Room):**
   - El espacio en blanco/oscuro es el mayor indicador de exclusividad.
   - Márgenes de sección mínimos:
     ```css
     section {
       padding-top: clamp(5rem, 10vw, 11rem);
       padding-bottom: clamp(5rem, 10vw, 11rem);
     }
     ```
   - No amontonar fotos ni textos; una sola idea o plato por encuadre visual tiene mucho más impacto.

2. **Arquitectura de Bordes (Bordes Rectos y Hairlines):**
   - Los restaurantes de alta gama no usan bordes redondeados infantiles (`border-radius: 20px;` está prohibido).
   - Mantener `border-radius: 0px` o máximo `2px`.
   - Divisores finos de 1px o 0.5px con opacidad reducida (`rgba(255,255,255,0.08)`).

3. **Fotografía de Galería y Platos:**
   - Tratamiento de obra de arte: relación de aspecto cinematográfica (`16:9`, `4:5` o `3:2`).
   - Sombra sutil o nula: evitar sombras difusas pesadas de Material Design (`box-shadow: 0 10px 30px rgba(0,0,0,0.5)`). En su lugar, usar veladuras o degradados hacia el fondo del sitio.
   - Transiciones de imagen fluidas:
     ```css
     img {
       transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.8s ease;
     }
     ```

4. **Botones y Llamados a la Acción (CTAs):**
   - En lugar de botones bulbosos con fondos brillantes:
     - **Estilo A (Borde Hairline Refinado):** Fondo transparente, borde fino de 1px en champán, texto en mayúsculas con espaciado ancho.
     - **Estilo B (Línea Inferior Minimalista):** Texto sobrio con un trazo inferior que se expande del 0% al 100% en hover.
     - **Estilo C (Bloque Sólido Sobrio):** Fondo oro desaturado o blanco marfil con texto negro, sin gradientes chillones.

5. **Formulario de Reservas "Concierge":**
   - Debe transmitir la sensación de una invitación exclusiva o mesa reservada por un mayordomo.
   - Inputs con fondo transparente y línea inferior sutil (`border-bottom: 1px solid var(--lux-border-hairline)`).
   - Menús selectivos personalizados y discretos.

---

## 3. Checklist de Auditoría de Lujo

Antes de aprobar cualquier ajuste de diseño:
- [ ] ¿Hay colores primarios estridentes (rojos/azules chillones, gradientes de app tech)? -> *Reemplazar por carbón, alabastro y oro champán.*
- [ ] ¿Hay esquinas redondeadas excesivas (`border-radius > 6px`)? -> *Reducir a 0px o 2px.*
- [ ] ¿La tipografía de títulos luce común o de sistema? -> *Aplicar Serif editorial de alto contraste.*
- [ ] ¿Los botones parecen de tienda online masiva? -> *Refactorizar a botón editorial con hairline o texto espaciado.*
- [ ] ¿Las secciones se sienten apretadas? -> *Duplicar el padding vertical.*
- [ ] ¿El menú de platos parece una lista de precios de cafetería? -> *Dar formato de menú degustación con tipografía espaciada y precios sutiles.*
