# Original User Request

## 2026-10-09T17:42:05Z

Saneamiento integral de la deuda técnica catalogada ([DT-01] a [DT-13]) y ejecución secuencial de las 6 fases de refactorización del proyecto "Sabe a Perú" según las especificaciones formales aprobadas en `specs/`.

Working directory: c:\Users\Martin\Documents\Trabajo\sabeaperu
Integrity mode: development

## Reference Materials
- Especificación Maestra y Deuda Técnica: `specs/SDD_MASTER.md`
- Contrato OpenAPI 3.1: `specs/openapi.yaml`
- Sistema de Diseño Quiet Luxury: `specs/design-system-spec.md`
- Especificación de Rendimiento y CWV: `specs/performance-spec.md`
- Especificación de Backoffice y Cloudinary: `specs/admin-spec.md`
- Script del Pipeline CI/CD: `package.json` (`npm run pipeline`)

---

## Requirements

### R1. Rendimiento Web y Saneamiento de Assets (Fase 1)
- Erradicar el doble renderizado en `index.html` eliminando las 10 etiquetas `<img>` residuales de Supabase en `#main-gallery-grid`.
- Reemplazar el `@import` síncrono en `src/style.css` por etiquetas `<link rel="preconnect">` asíncronas en el `<head>` de los archivos HTML.
- Asignar `fetchpriority="high"` y `loading="eager"` a la imagen LCP del Hero principal.
- Refactorizar todos los listeners `window.addEventListener('scroll')` pesados en `src/main.ts` a un único `IntersectionObserver` pasivo.

### R2. Sistema de Diseño Quiet Luxury (Fase 2)
- Implementar los tokens oficiales CSS en `src/style.css` (Negro Obsidiana `#0b0b0b`, Carbón Pizarra `#141414`, Oro Champán `#c5a880`, Marfil `#f5f2eb`).
- Derogar el marco exterior marrón de 80px y los gráficos vectoriales antiestéticos.
- Eliminar la animación reflectante continua (*shiny button loop*) de las fotos de los platos.
- Estandarizar la tipografía a las 2 familias oficiales (Serif editorial para títulos y Sans-Serif geométrica con tracking amplio para micro-copy).

### R3. Lógica TypeScript de Carta y Alérgenos (Fase 3)
- Modificar `src/main.ts` para eliminar los emojis duros (`🐟`, `🥩`, `🌶️`, `🌾`) en los títulos de platos y categorías.
- Inyectar micro-etiquetas tipográficas sobrias basadas en el enum oficial `AllergenTag` de `specs/openapi.yaml`.
- Mantener la resiliencia de precios duales (precio numérico vs precio de mercado cuando `price == 0`).

### R4. Blindaje del Backoffice y Unificación en Cloudinary (Fase 4)
- Implementar en `src/admin.ts` la función pura `normalizeCloudinaryUrl` para garantizar transformaciones `f_auto,q_auto,w_800,c_limit` y erradicar parámetros sucios `?v=`.
- Unificar la galería en la colección Firestore `gallery_items` (eliminando cualquier referencia residual a Firebase Storage).
- Reemplazar el input de texto libre de alérgenos por un selector de chips interactivo basado en `AllergenTag`.
- Incorporar botones de acción operativa en la tabla de reservas (`Confirmar`, `Cancelar`, `WhatsApp`).

### R5. Conserjería de Reservas y Anti-Bloqueo de WhatsApp (Fase 5)
- Sustituir el `window.open` automático por un flujo de dos pasos: registro en Firebase + tarjeta de confirmación con localizador único (`SP-XXXX`) y botón de apertura voluntaria de WhatsApp.
- Validar las dos bandas de aforo: grupos ordinarios (1 a 6) contra el cupo de 4 mesas, y aviso para grupos especiales (> 6).
- Mapear cualquier error a notificaciones toast según RFC 9457 (prohibido `alert()` nativo).

---

## Acceptance Criteria

### Compilación y Calidad de Código
- [ ] El comando `npm run pipeline` ejecuta `tsc --noEmit && vite build` y termina con **Exit Code 0** sin errores de tipado.
- [ ] No existen referencias activas a dependencias o endpoints de Supabase en el código de producción de `src/`.
- [ ] No existen etiquetas `<img>` con fuentes rotas o URLs repetidas en la galería inicial.

### Coherencia Funcional y Visual
- [ ] La carta digital en `carta.html` y `index.html` renderiza correctamente los platos desde Firestore sin emojis en sus titulares.
- [ ] Todas las URLs generadas o guardadas hacia Cloudinary cumplen con el formato normalizado (`f_auto,q_auto,w_800,c_limit`).
- [ ] El flujo de reservas genera un código localizador y previene el bloqueo de popups en dispositivos móviles.
- [ ] El panel de administración permite cambiar el estado de reservas y subir fotografías con previsualización inmediata.


## Follow-up — 2026-10-13T13:09:52Z

[Resume Execution Directive]
El sistema se ha reanudado tras el reinicio del servidor.
Estado actual del disco y del proyecto:
- Milestone 1 (Rendimiento Web y Saneamiento) está 100% completado y certificado.
- Milestone 2 (Diseño Quiet Luxury) tiene los tokens y limpiezas visuales aplicados en src/style.css.
- El pipeline maestro `npm run pipeline` compila limpiamente con Exit Code 0.
- La suite de pruebas automatizadas `npm run test:all` pasa 87/87 pruebas sin fallos.

Por favor, reanuda la orquestación del enjambre multiagente:
1. Concluye el gate de revisión/auditoría del Hito 2 si aplica.
2. Procede de inmediato con el Hito 3 (Fase 3: Lógica TypeScript de Carta y Alérgenos en src/main.ts sin emojis).
3. Continúa secuencialmente con el Hito 4 (Fase 4: Backoffice y Cloudinary en src/admin.ts), Hito 5 (Fase 5: Conserjería de Reservas y Anti-bloqueo de WhatsApp) y Hito 6 (Certificación Final).
4. Restablece los crons de progreso y liveness para continuar reportando al llamador.
