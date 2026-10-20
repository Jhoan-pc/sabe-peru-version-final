# Especificación Formal del Sistema de Diseño (Design System Spec)
**Estándar:** Haute Cuisine & Hospitalidad de Ultra-Lujo (Inspirado en 3 Estrellas Michelin)  
**Estado:** Aprobado para Especificación (Sin ejecución de código aún)  
**Versión:** 2.0.0 (Refactor de Alta Gama)

---

## 1. Tokens de Color Oficiales ("Quiet Luxury")

Queda formalmente prohibido el uso de colores primarios saturados (`#e31e24`, `#ffffff` plano sobre fondos oscuros masivos, gradientes chillones o amarillos brillantes `#ffd700`).

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

---

## 2. Sistema Tipográfico Disciplinado (Regla de 2 Familias)

Se deroga la importación de 8 fuentes simultáneas. La especificación restringe el sistema a exactamente 2 familias:

| Rol | Familia Tipográfica | Pesos Permitidos | Uso y Reglas de Formato |
| :--- | :--- | :--- | :--- |
| **Titular (Editorial)** | *Cormorant Garamond* o *Playfair Display* | `300` (Light), `400` (Regular), `400i` (Italic) | Encabezados `h1`, `h2`, nombres de platos en menú y títulos de secciones. Proporción monumental, `line-height: 1.05` a `1.15`. |
| **Micro-copy & Lectura** | *Inter* o *Montserrat* | `300` (Light), `400` (Regular), `600` (Semibold) | Navegación, botones, selectores de fecha, precios, alérgenos y cuerpo de texto. En navegación y botones: **mayúsculas con tracking amplio (`letter-spacing: 0.22em`) y tamaños 10px a 12px**. |

---

## 3. Contratos de Componentes UI (Especificación de Refactor)

### A. Componente Carta: `MenuItem`
* **Nombres de Platos:**
  - Tipografía Serif editorial (`1.35rem`, peso 400).
  - **Prohibido:** No se inyectarán emojis (`🐟`, `🥩`, `🌶️`, etc.) en el titular del plato.
* **Indicación de Alérgenos:**
  - Se mostrarán como micro-etiquetas tipográficas al pie de la descripción o como números índices sobrios:
    ```html
    <div class="menu-item-allergens">
      <span class="allergen-pill">PESCADO</span>
      <span class="allergen-pill">AJÍ LIMO</span>
    </div>
    ```
    *Estilo:* Fuente Sans de 9px, mayúsculas, color `--lux-text-muted`, sin fondos brillantes.
* **Trigger de Visualización de Foto:**
  - **Derogado:** Se elimina el botón píldora redondeado con animación *shiny* continua (`.item-photo-btn`).
  - **Nuevo Contrato:** Enlace minimalista editorial:
    ```html
    <button class="dish-photo-trigger" data-img="..." aria-label="Ver imagen del plato">
      <span>FOTOGRAFÍA</span>
      <span class="trigger-line"></span>
    </button>
    ```
    *Estilo:* Texto en 10px, color `--lux-gold-champagne`, con una línea inferior que se despliega con elegancia en hover (`transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1)`).

---

### B. Contenedor del Menú: `MenuContainer`
* **Derogación Arquitectónica:**
  - Se elimina el marco tosco de 80px (`border-width: 80px; border-color: #2e2620;`).
  - Se eliminan las figuras vectoriales embebidas en pseudo-elementos (monos, arañas, colibríes con drop-shadow amarillo).
* **Nuevo Contrato:**
  - Contenedor con fondo obsidiana puro y sutil veladura radial.
  - Borde fino *hairline* de 1px (`rgba(197, 168, 128, 0.18)`).
  - Espacio de respiración interno (`padding: clamp(3rem, 6vw, 6rem)`).

---

### C. Formulario de Reservas: `ConciergeReservationForm`
* **Concepto:** Recepción y conserjería privada, no un formulario burocrático.
* **Diseño de Campos:**
  - Fondo transparente.
  - Sin recuadro gris cerrado de 4 lados. Línea inferior sutil: `border: none; border-bottom: 1px solid var(--lux-border-hairline);`.
  - En estado `:focus`, la línea inferior transmuta a `--lux-gold-champagne` sin destellos ni sombras azules genéricas.
* **Botón de Envío:**
  - Botón de marco arquitectónico (`border: 1px solid var(--lux-gold-champagne); background: transparent; color: var(--lux-text-primary);`).
  - Texto en mayúsculas: `SOLICITAR RESERVA PRIVADA` (`letter-spacing: 0.25em`).
  - En hover: relleno suave en oro champán con texto en negro obsidiana.

---

### D. Identidad de Marca y Cabecera: `Header & Logo`
* **Paleta del Logotipo:**
  - Sustituir el rojo primario de comida rápida (`#e31e24`) por un carmín mineral profundo (`--lux-crimson-mineral: #8b1e22`) o por una presentación monocromática en blanco marfil y oro pálido.
* **Líneas decorativas:**
  - Grosor máximo de 0.5px a 1px con opacidad reducida (0.6).

---

## 4. Matriz de Conformidad y Prohibiciones (Do's and Don'ts)

| Elemento | ❌ Estrictamente Prohibido (Mediocre / Genérico) | ✅ Estándar Obligatorio (3 Estrellas Michelin) |
| :--- | :--- | :--- |
| **Bordes** | `border-radius: 20px;` (Píldoras de app móvil). | `border-radius: 0px` o máximo `2px` (Geometría limpia). |
| **Animaciones** | Botones parpadeantes con brillos reflectantes en bucle (`infinite`). | Transiciones de seda silenciosas (400ms a 700ms en interacción del usuario). |
| **Iconografía** | Emojis de colores (`🐟🦐🥩🌶️`) dentro de títulos de platos. | Micro-etiquetas tipográficas o índices numéricos sobrios. |
| **Decoración** | Marcos marrones de 80px con dibujos de animales en SVG. | Espacio negativo generoso y líneas hairline de 1px. |
| **Fuentes** | 8 familias tipográficas importadas a la vez. | 2 familias calibradas: Serif monumental + Sans de soporte. |
| **Colores** | Fondos blancos planos mezclados con cartas negras sin armonía. | Identidad tonal continua basada en Obsidiana, Alabastro y Champán. |
