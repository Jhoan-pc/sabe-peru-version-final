# Handoff Report: Specification Mining for Milestone 3 (Carta y Alérgenos)

**Agente:** `m3_explorer_1` (M3 Spec Miner - Allergen Contracts & DOM Specs)  
**Destinatario:** `ed44eb6a-a075-4b06-a258-caefe2915195` (Orchestrator)  
**Tipo de Handoff:** Hard (Task complete)  
**Fecha:** 2026-10-13T13:40:00Z  

---

## 1. Observation

Direct observations from codebase inspection, specification documents, and test runner executions:

1. **Enum `AllergenTag` en OpenAPI 3.1 (`specs/openapi.yaml` L423-441):**
   ```yaml
   AllergenTag:
     type: string
     enum:
       - pescado
       - marisco
       - carne
       - pollo
       - picante
       - gluten-free
       - gluten
       - huevos
       - lacteos
       - soja
       - cacahuetes
       - mostaza
       - crustaceos
       - apio
       - moluscos
       - sesamo
   ```
   Exactamente 16 valores canónicos discretos en minúsculas kebab-case.

2. **Deuda Técnica y Reglas en `specs/SDD_MASTER.md`:**
   - Línea 52 (§3.2, 4): *"Regla de Precios: Los platos con precio numérico muestran `XX.XX€`. Los ítems con precio 0 delegan su descripción como indicación de precio especial ('Precio según mercado')."*
   - Líneas 69-70 (§4): *"Eliminación de emojis (`🐟🦐🥩🌶️`) en titulares de platos; sustitución por micro-etiquetas tipográficas monocromáticas. Eliminación del botón píldora animado `📸 Ver`; sustitución por un enlace editorial minimalista `FOTOGRAFÍA`."*
   - Línea 120 ([DT-03]): *"Contaminación Visual Anti-Lujo en la Carta: Inyección de emojis duros (`🐟`, `🥩`, `🌶️`, `🌾`) en títulos de platos y categorías, colisionando con la identidad 3 estrellas Michelin."*

3. **Contrato de Diseño en `specs/design-system-spec.md`:**
   - Líneas 61-67 (§3.A):
     ```html
     <div class="menu-item-allergens">
       <span class="allergen-pill">PESCADO</span>
       <span class="allergen-pill">AJÍ LIMO</span>
     </div>
     ```
     Estilo: Fuente Sans de 9px, mayúsculas, color `--lux-text-muted`, sin fondos brillantes.
   - Líneas 71-77 (§3.A):
     ```html
     <button class="dish-photo-trigger" data-img="..." aria-label="Ver imagen del plato">
       <span>FOTOGRAFÍA</span>
       <span class="trigger-line"></span>
     </button>
     ```
     Estilo: Texto en 10px, color `--lux-gold-champagne`, con una línea inferior animada en hover (`transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1)`).

4. **Estado Actual en `src/main.ts`:**
   - Líneas 303-320: Diccionario obsoleto `tagIcons` inyectando emojis con `<span class="menu-tag" tabindex="0" data-tooltip="...">🐟</span>`.
   - Líneas 339-343: Botón obsoleto `.item-photo-btn` inyectando `<span style="font-size: 1.1em; margin-right: 3px; pointer-events: none;">📸</span> Ver`.
   - Línea 348: Título de plato renderiza `<h3>${item.name}${icons}${photoBtn}</h3>` sin sanitización de emojis existentes en `item.name`.

5. **Estado de CSS en `src/style.css`:**
   - Líneas 621-639: Ya define `.menu-item-price` (oro, sans, uppercase) y `.menu-item-price.dual` (italic, 0.85rem, #a8a095).
   - Líneas 641-663: Ya define `.menu-item-allergens` y `.allergen-pill` (9px, uppercase, letter-spacing 0.18em, border hairline).
   - Líneas 1400-1434: Ya define `.dish-photo-trigger` y `.dish-photo-trigger .trigger-line` (10px, oro champán, animación de ancho al hover).

6. **Suite de Pruebas Automatizadas (`tests/`):**
   - Ejecución de `npm run test:all`:
     `RESULT: ALL TEST SUITES PASSED (Duration: 5.85s)`
     `Tier 1: Pipeline & Hygiene [PASS]`, `Tier 2: Boundary & Domain Invariants [PASS]`, `Tier 3: DOM Transitions & Pairwise [PASS]`, `Tier 4: Real-World Scenarios [PASS]`
     87 pruebas ejecutadas, 87 exitosas, 0 fallos.
   - Ejecución de `npm run pipeline`:
     `tsc --noEmit && vite build` terminó con **Exit Code 0** en 1.22s.

---

## 2. Logic Chain

1. **Extracción y Validación de Alérgenos:**
   - De la Observación 1 (`specs/openapi.yaml`), se extraen los 16 identificadores canónicos: `pescado`, `marisco`, `carne`, `pollo`, `picante`, `gluten-free`, `gluten`, `huevos`, `lacteos`, `soja`, `cacahuetes`, `mostaza`, `crustaceos`, `apio`, `moluscos`, `sesamo`.
   - La suite Tier 2 (`T2.4.1` a `T2.4.5`) y Tier 3 (`T3.2.1` a `T3.2.5`) exige que sólo estos 16 tags sean considerados válidos, rechazando tags como `nuez` o `vegano`.
   - La renderización tipográfica exige la clase `.allergen-pill`, el atributo `data-allergen="[tag]"` y texto en mayúsculas `[TAG.toUpperCase()]`.

2. **DOM y Estilo de Micro-Pills:**
   - De la Observación 3 y 5, las micro-píldoras residen en `<div class="menu-item-allergens">`.
   - Si un plato no tiene alérgenos (`tags: []`), el contenedor se omite en su totalidad (`T3.2.4`).
   - El estilo requiere tipografía Sans de 9px, `--lux-text-muted` (`#858076`), borde hairline `rgba(245, 242, 235, 0.08)`, y micro-hover suave a `--lux-border-gold-subtle`.

3. **Sustitución del Botón de Foto por Trigger Editorial:**
   - De la Observación 2, 3, 4 y 5, se erradica `.item-photo-btn` con `📸 Ver` en favor de `.dish-photo-trigger` con `<span>FOTOGRAFÍA</span><span class="trigger-line"></span>`.
   - El evento click debe continuar abriendo `#menu-photo-modal`, normalizando la URL en Cloudinary (`f_auto,q_auto,w_800,c_limit`), bloqueando el scroll de página y cerrándose de forma accesible con botón, backdrop o `Escape`.
   - Si el plato no tiene `image_url`, el trigger no se renderiza.

4. **Resiliencia de Precios Duales:**
   - De la Observación 2 y 6, cuando `price === 0` o no es un número positivo válido, la función pura `formatMenuItemPrice` conmuta a `isMarketPrice: true`, asignando la clase `.menu-item-price.dual` y utilizando `description` (o `"Precio según mercado"`).
   - Cuando `price > 0`, formatea el valor a 2 decimales con símbolo de euro (`XX.XX€`) con la clase `.menu-item-price`.
   - Para evitar duplicidad visual, cuando se activa el precio dual, la descripción no se repite en el bloque inferior `<div class="menu-item-info">`.

5. **Higienización de Titulares:**
   - De la Observación 2 y 4, la base de datos o entradas del CMS pueden contener emojis en `name` o `subcategory`.
   - La función pura `sanitizeDishName` debe ejecutarse antes de renderizar para eliminar cualquier pictograma Unicode mientras preserva caracteres españoles (`á, é, í, ó, ú, ñ`).

---

## 3. Caveats

- **No Caveats:** Todas las especificaciones requeridas se encuentran alineadas entre el contrato OpenAPI 3.1, la especificación de diseño visual, el código existente de `src/style.css` y las pruebas automatizadas de Tier 1 a Tier 4.

---

## 4. Conclusion

Se ha elaborado y publicado el blueprint integral de especificación para Milestone 3 en:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m3_explorer_1\plan.md`

El blueprint define exhaustivamente:
1. El enum de 16 alérgenos canónicos y sus interfaces TypeScript.
2. La estructura DOM y tokens CSS para `.allergen-pill` y `.menu-item-allergens`.
3. La estructura DOM, estilos y ciclo de vida de interacción para `.dish-photo-trigger` y `#menu-photo-modal`.
4. Las reglas matemáticas y lógicas de resiliencia de precios duales (`formatMenuItemPrice`).
5. La función sanitizadora pura de titulares (`sanitizeDishName`).
6. El código de integración propuesto para reemplazar `renderMenuItem` en `src/main.ts`.

---

## 5. Verification Method

1. **Inspección de Blueprint y Documentos:**
   - Leer `c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m3_explorer_1\plan.md`.
   - Verificar correspondencia con `specs/openapi.yaml` L423-441 y `specs/design-system-spec.md` §3.A.
2. **Ejecución de Pruebas de Contrato Existentes:**
   - `npm run test:tier2` (verifica enum de 16 alérgenos y precios duales).
   - `npm run test:tier3` (verifica renderizado DOM, ausencia de emojis, píldoras y triggers).
   - `npm run test:all` (ejecuta los 87 tests del runner maestro).
3. **Compilación del Pipeline:**
   - `npm run pipeline` (`tsc --noEmit && vite build`), validando ausencia de errores tipográficos en TypeScript.
