# ⚖️ DICTAMEN DE AUDITORÍA FORENSE INDEPENDIENTE: MILESTONE 3 (ITERATION 2)

* **Interventor**: `m3_auditor_2` (M3 Forensic Auditor Iteration 2 / Auditor Tirano SDD)
* **Fecha & Hora**: 2026-10-14T10:09:00Z
* **Entregable Auditado**: Milestone 3 Remediation (Fase 3: Lógica TypeScript de Carta, Alérgenos, Polish Visual y Remediación de Defectos)
* **Archivos Principales**: `src/main.ts`, `src/style.css`, `tests/tier5-m3-challenger.test.mjs`, `tests/tier5-m3-challenger-gen2.test.mjs`
* **Modo de Integridad**: Development (SSOT: `ORIGINAL_REQUEST.md`)
* **Veredicto Final**: **CLEAN / 🟢 CERTIFICACIÓN PLENA**
* **Índice de Rigor Contractual**: **100%**

---

## 1. Salida Determinística de Consola (Exit Codes)

- **Compilador de Tipos y Build**: `npm run pipeline` (`tsc --noEmit && vite build`) -> **EXIT 0** (0 errores de tipado, 34 módulos transformados, compilado en 1.84s).
- **Suite de Pruebas Nativa**: `npm test` (`node --test tests/**/*.test.mjs`) -> **EXIT 0** (**202 pruebas pasadas / 0 fallidas / 0 omitidas / 0 canceladas** en 53 suites, duración: 8.95s).
- **Suite de Pruebas E2E (Tiers 1–4)**: `npm run test:all` (`node tests/test-runner.mjs`) -> **EXIT 0** (**87 pruebas pasadas / 0 fallidas / 0 omitidas**, duración: 7.86s).
- **Suite Challenger Invariantes M3**: `node --test tests/tier5-m3-challenger.test.mjs` -> **EXIT 0** (**26/26 pruebas pasadas**, duración: 151ms).
- **Suite Gen2 Verificación de Remediación**: `node --test tests/tier5-m3-challenger-gen2.test.mjs` -> **EXIT 0** (**17/17 pruebas pasadas**, duración: 344ms).
- **Suite Empírica Autónoma del Auditor**: `node .agents/teamwork/m3_auditor_2/verify-behavior.mjs` -> **EXIT 0** (100% de payloads tóxicos y aserciones de DOM verificadas limpiamente).

---

## 2. Infracciones Críticas & Falsos Positivos Detectados

- **[x] Trampas de Test / Test Skips**: **0 detectadas**. Búsqueda de `.skip`, `xit`, `xdescribe`, `test.only`, `describe.only` arrojó 0 coincidencias en `tests/`.
- **[x] Supresiones de Compilador / Linter**: **0 detectadas**. Búsqueda de `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `eslint-disable` arrojó 0 coincidencias en `src/`.
- **[x] Implementaciones Fachada / Mock Stubs**: **0 detectadas**. Todas las funciones de carta (`sanitizeDishName`, `isValidAllergenTag`, `renderAllergenPill`, `formatMenuItemPrice`, `renderMenuItemHtml`, `loadMenu`) implementan lógica de cómputo y transformación real sobre tipos de TypeScript.
- **[x] Artefactos Pre-Poblados**: **0 detectados**. No existen archivos de resultados simulados ni logs pre-fabricados en el repositorio.
- **[x] Evasión de Tipos (`any`)**: **0 detectadas** en el ámbito del Hito 3 (`src/main.ts` líneas 1–525).

---

## 3. Observation

Inspección física y empírica directa sobre el código fuente y el árbol de pruebas:

### 3.1 Verificación de Remediación Genuina de los 5 Defectos

1. **Defecto 1: Dismissal del Modal de Fotos con tecla Escape (`src/main.ts:414–418`)**:
   - *Código en Disco*:
     ```typescript
     document.addEventListener('keydown', (e: KeyboardEvent) => {
       if (e.key === 'Escape' && photoModal.classList.contains('active')) {
         closePhotoModal();
       }
     });
     ```
   - *Evidencia*: `closePhotoModal()` elimina la clase `active`, vacía `modalImg.src = ''` y restablece `document.body.style.overflow = ''`. Teclas distintas a `Escape` no alteran el estado. Verificado empíricamente en `GEN2.M3.1` a `GEN2.M3.5` y en `verify-behavior.mjs`.

2. **Defecto 2: Desacoplamiento de Listeners del Modal para Evitar Acumulación (`src/main.ts:397–419`)**:
   - *Código en Disco*:
     Los listeners de `closeModalBtn`, backdrop de `photoModal` y `keydown` de `Escape` se registran **una sola vez** en el bloque externo `if (menuGrid)`, en las líneas 409–419, previo a la declaración de `async function loadMenu(...)` (línea 421).
   - *Evidencia*: 50 transiciones consecutivas de categoría entre `comida`, `bebida` y `coctel` conservan exactamente 1 único listener activo en los elementos persistentes del modal. Verificado en `T5.M3.23` y `GEN2.M3.6`.

3. **Defecto 3: Resiliencia Defensiva ante `item.tags` no-Array en Firestore (`src/main.ts:101, 438`)**:
   - *Código en Disco*:
     - En `renderMenuItemHtml`:
       ```typescript
       const pillsHtml = (Array.isArray(item.tags) ? item.tags : [])
         .filter(isValidAllergenTag)
         .map(renderAllergenPill)
         .join('');
       ```
     - En `loadMenu`:
       ```typescript
       if (tagFilter) {
         data = data.filter((d: MenuItem) => (Array.isArray(d.tags) ? d.tags : []).includes(tagFilter as AllergenTag));
       }
       ```
   - *Evidencia*: Inyección de 10 payloads venenosos (`null`, `undefined`, `"pescado"`, `123`, `true`, `false`, `{}`, array-like objects, closures, symbols) no produce ningún `TypeError: .filter is not a function`. Verificado en `T5.M3.24`, `GEN2.M3.8–11` y `verify-behavior.mjs`.

4. **Defecto 4: Escape de Comillas Dobles en Atributos HTML (`src/main.ts:106–113`)**:
   - *Código en Disco*:
     ```typescript
     const escapedName = cleanName.replace(/"/g, '&quot;');
     const escapedDesc = (item.description || '').replace(/"/g, '&quot;');
     ```
   - *Evidencia*: Strings con comillas dobles (p. ej. `Solomillo al estilo "Chifa"`) generan `data-name="Solomillo al estilo &quot;Chifa&quot;"`. En la lectura por DOM (`getAttribute('data-desc')`), la cadena completa se recupera íntegra sin truncamientos ni inyección de atributos falsos (`onclick`, `data-fake`). Verificado en `T5.M3.25`, `GEN2.M3.12–15` y `verify-behavior.mjs`.

5. **Defecto 5: Envoltorio Flexible en Cabecera para Precios Duales Extensos (`src/style.css:515–521`)**:
   - *Código en Disco*:
     ```css
     .menu-item-header {
       display: flex;
       justify-content: space-between;
       align-items: baseline;
       flex-wrap: wrap;
       gap: 8px 16px;
     }
     ```
   - *Evidencia*: Descripciones de mercado de más de 150 caracteres se alojan en `<span class="menu-item-price dual">` envolviéndose naturalmente sin superponerse al título ni provocar desbordamiento horizontal en pantallas móviles (320px–480px). Verificado en `T5.M3.26` y `GEN2.M3.16`.

---

### 3.2 Re-Verificación de los Invariantes Principales del Hito 3

1. **Cero Emojis en la Carta Digital**:
   - Escaneo con regex `/\p{Extended_Pictographic}/u` en el ámbito de carta (`src/main.ts` líneas 1–525): **0 coincidencias**.
   - Presencia de `tagIcons`: **0 coincidencias** (erradicado 100%).
   - Botón legacy `📸 Ver`: Erradicado 100%, sustituido por `.dish-photo-trigger` (`<span>FOTOGRAFÍA</span><span class="trigger-line"></span>`).
   - Función `sanitizeDishName`: Activa y probada; elimina pictographs y variation selectors preservando tildes y diacríticos en español (`Ají`, `Maíz`).

2. **16 Pastillas de Alérgenos `AllergenTag` en Mayúsculas**:
   - Enum canónico de `specs/openapi.yaml` (16 valores) coincide exactamente con `OFFICIAL_ALLERGEN_TAGS` en `src/main.ts:13–30`.
   - Salida HTML: `<span class="allergen-pill" data-allergen="pescado">PESCADO</span>` con micro-tipografía Quiet Luxury (`9px`, `uppercase`, `letter-spacing: 0.18em`).
   - Platos con 0 tags omiten de forma limpia el contenedor `.menu-item-allergens`.

3. **Resiliencia de Precios Duales (`.menu-item-price.dual`)**:
   - `formatMenuItemPrice` implementa distinción estricta: `price > 0` genera `${numericPrice.toFixed(2)}€` con `.menu-item-price`; `price <= 0`, `NaN` o cadenas vacías activan `.menu-item-price.dual` delegando la descripción o `"Precio según mercado"`.

4. **Cero URLs Raster de Wikimedia**:
   - `upload.wikimedia.org` en `src/style.css`, `src/main.ts`, `carta.html`, `index.html`: **0 coincidencias**.
   - Borde marrón de 80px (`#2e2620`) y SVGs de animales Nazca: **0 coincidencias** (sustituidos por hairline 1px).

5. **Tipado Estricto de TypeScript**:
   - `"erasableSyntaxOnly": true` y `"strict": true` en `tsconfig.json`.
   - Cero `: any` en el código de carta (`src/main.ts` líneas 1–525).

---

## 4. Logic Chain

1. **Premisa 1**: `ORIGINAL_REQUEST.md` (R3) y `PROJECT.md` (M3) exigen erradicación total de emojis en la carta, inyección sobria de los 16 `AllergenTag` en mayúsculas, y resiliencia determinística de precios duales con `.menu-item-price.dual`.
2. **Observación 1**: Los chequeos automatizados de código fuente confirman 0 emojis en el controlador de la carta, paridad 16/16 con OpenAPI, y formateo matemático puro de precios duales.
3. **Premisa 2**: La auditoría adversarial de `m3_challenger_2` detectó 5 vulnerabilidades (ausencia de Escape en modal, acumulación de listeners en switches de categoría, caída por tags no-array, escape de comillas en atributos HTML, y apiñamiento de cabecera en móvil).
4. **Observación 2**: La inspección física y empírica de `src/main.ts:101, 106-113, 397-419, 438` y `src/style.css:515-521` demuestra que los 5 defectos fueron remediados directamente en código de producción, sin trampas, stubs ni supresiones de tipos.
5. **Premisa 3**: El estándar Zero-Trust de `auditor-tirano-sdd` y el perfil de desarrollo exigen ejecución reproducible de `npm run pipeline`, `npm test` y `npm run test:all` con Exit Code 0 y cero pruebas omitidas.
6. **Observación 3**:
   - `npm run pipeline` finalizó con Exit Code 0 en 1.84s.
   - `npm test` ejecutó 202 pruebas con 0 fallos, 0 omitidas y Exit Code 0.
   - `npm run test:all` ejecutó 87 pruebas con 0 fallos y Exit Code 0.
   - La suite independiente del auditor (`verify-behavior.mjs`) confirmó la integridad de todos los casos de borde.
7. **Conclusión**: El trabajo entregado en el Hito 3 satisface la totalidad de los requisitos contractuales y de integridad forense.

---

## 5. Caveats

1. **Emojis de la Plantilla de WhatsApp de Reservas**: Líneas 803–807 en `src/main.ts` contienen emojis de calendario/reloj (`📅`, `⏰`, `👤`, `📝`, `🎉`). Corresponden exclusivamente al alcance del Hito 5 (Conserjería de Reservas [DT-11], [DT-12], [DT-13]) y no pertenecen al ámbito de la carta del Hito 3.
2. **Tipos `: any` en `loadGallery()`**: Líneas 542, 567, 568 y 602 de `src/main.ts` contienen `: any` dentro de la función legada de galería de Firebase Storage, cuyo refactor hacia Firestore `gallery_items` está programado formalmente para el Hito 4.
3. **No existen más salvedades**: Todos los requerimientos del Hito 3 y sus 5 remediaciones se encuentran 100% operativos y verificados en disco.

---

## 6. Conclusion

**Veredicto Final: CLEAN / 🟢 CERTIFICACIÓN PLENA**

El Hito 3 (Fase 3: Lógica TypeScript de Carta, Alérgenos y Remediación de Defectos) queda **OFICIALMENTE CERTIFICADO**:
- Cero emojis en la carta digital y en sus disparadores.
- 16 pastillas `AllergenTag` en mayúsculas conformes con OpenAPI 3.1.
- Resiliencia de precios duales con `.menu-item-price.dual`.
- Cero assets o referencias raster a Wikimedia.
- Las 5 remediaciones de comportamiento (tecla Escape, desacoplamiento de listeners, blindaje ante tags no-array, escape de comillas en atributos HTML y header flex-wrap) son auténticas, robustas y libres de trampas.
- Suite completa de 202 pruebas en verde (Exit Code 0).

---

## 7. Verification Method

Para reproducir independientemente este dictamen forense:

1. **Compilación de Producción y Verificación de Tipos**:
   ```powershell
   npm run pipeline
   ```
   *Resultado comprobado*: Exit Code 0, 0 errores en `tsc --noEmit`, build Vite completado en 1.84s.

2. **Ejecución de la Suite Completa de Pruebas**:
   ```powershell
   npm test
   ```
   *Resultado comprobado*: 202 pruebas pasadas, 53 suites, 0 fallos, 0 omitidas (Exit Code 0).

3. **Ejecución del Test Runner E2E (Tiers 1 a 4)**:
   ```powershell
   npm run test:all
   ```
   *Resultado comprobado*: 87 pruebas pasadas en 4 tiers (Exit Code 0).

4. **Verificación de Invariantes del Auditor**:
   ```powershell
   node .agents/teamwork/m3_auditor_2/verify-invariants.mjs
   node .agents/teamwork/m3_auditor_2/verify-behavior.mjs
   ```
   *Resultado comprobado*: Exit Code 0, confirmación de 0 emojis en menú, 16 tags, precios duales y resistencia a 10 payloads tóxicos.

---

## 8. Mandato Perentorio

**MANDATO: CERTIFICACIÓN PLENA CONCEDIDA.**  
El Hito 3 queda formalmente aprobado y cerrado. Se autoriza el desbloqueo y la transición inmediata al **Hito 4 (Fase 4: Blindaje del Backoffice y Unificación en Cloudinary en `src/admin.ts`)**.
