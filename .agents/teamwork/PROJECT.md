# Project: Sabe a Perú — Saneamiento Integral de Deuda Técnica (v2.0.0-SDD)

## Architecture
- **Ecosystem**: Vite Multi-Page Application (MPA) in Vanilla TypeScript (`index.html`, `carta.html`, `admin.html`, `experiencia.html`).
- **Database SSOT**: Google Cloud Firebase Firestore (`menu_items`, `reservations`, `site_content`, `gallery_items`).
- **Media CDN**: Cloudinary exclusively (preset `sabeaperu_firm`, normalized `f_auto,q_auto,w_{width},c_limit`).
- **Styling Architecture**: Quiet Luxury CSS Design System (`src/style.css`, `--lux-*` tokens, 2 Google Font families: *Cormorant Garamond* / *Playfair Display* & *Inter* / *Montserrat*).
- **Error Architecture**: RFC 9457 Problem Details (`type`, `title`, `status`, `detail`, `instance`) displayed via Quiet Luxury toast UI.
- **Testing Architecture**: Dual-track automated testing (Node.js native test runner `node:test` for Tiers 1-3, Playwright/headless browser verification for Tier 4, Challenger stress suite for Tier 5).

---

## Feature Inventory
Every feature from the Survey phase appears here with its assigned milestone. No feature is left unassigned.

| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | Erradicación de Doble Render (Ghost Loading) | Eliminar 10 tags `<img>` de Supabase en `#main-gallery-grid` e inicializar con contenedor de dimensiones reservadas (55vh / 400px) | M1 | SDD_MASTER [DT-10], performance-spec | DONE |
| 2 | Carga Asíncrona de Fuentes & Critical CSS | Sustituir `@import` síncrono en `src/style.css` por `<link rel="preconnect">` y `<link rel="stylesheet">` con `display=swap` en `<head>` | M1 | SDD_MASTER [DT-08], performance-spec | DONE |
| 3 | Prioridad LCP en Hero Slide | Configurar `#img-hero-1` con `fetchpriority="high"`, `loading="eager"`, `decoding="async"`; `loading="lazy"` en diapositivas 2..4 | M1 | performance-spec §4, ORIGINAL_REQUEST R1 | DONE |
| 4 | Scroll Desacoplado con IntersectionObserver | Reemplazar listeners `scroll` continuos en `src/main.ts` por un único `IntersectionObserver` pasivo con `unobserve` tras activación | M1 | SDD_MASTER [DT-09], performance-spec §2 | DONE |
| 5 | Pausa Inteligente de Bucles/Timers | Pausar intervalos `setInterval` de slideshow y autoscroll cuando `document.visibilityState === 'hidden'` | M1 | performance-spec §3 | DONE |
| 6 | Purga de Residuos de Supabase en Producción | Erradicar referencias activas a Supabase en `src/` (aislar `src/supabase.ts`, 0 imports en bundle de producción) | M1 | SDD_MASTER [DT-06], ORIGINAL_REQUEST R1 | DONE |
| 7 | Paleta Cromática "Quiet Luxury" | Implementar tokens oficiales CSS en `src/style.css` (`--lux-bg-obsidian`, `--lux-bg-charcoal`, `--lux-gold-champagne`, `--lux-text-primary`, `--lux-crimson-mineral`) | M2 | design-system-spec §1, ORIGINAL_REQUEST R2 | PLANNED |
| 8 | Supresión de Marco Marrón 80px y Figuras Nazca | Derogar `border: 80px solid #2e2620` y pseudoelementos con SVGs de animales en `.page-carta .section-container`; sustituir por hairline 1px | M2 | design-system-spec §4, ORIGINAL_REQUEST R2 | PLANNED |
| 9 | Eliminación de Bucle Reflectante (*Shiny Button*) | Derogar animación `.item-photo-btn::after` en `src/style.css`; sustituir por enlace editorial minimalista | M2 | design-system-spec §4, ORIGINAL_REQUEST R2 | PLANNED |
| 10 | Estandarización a 2 Familias Tipográficas | Restringir tipografía exclusivamente a Serif editorial (Cormorant Garamond/Playfair Display) y Sans-Serif geométrica (Inter/Montserrat) | M2 | design-system-spec §2, ORIGINAL_REQUEST R2 | PLANNED |
| 11 | Erradicación de Emojis en Titulares de Carta | Eliminar emojis (`🐟`, `🥩`, `🌶️`, `🌾`, etc.) en nombres de platos y títulos de subcategorías en `src/main.ts` | M3 | SDD_MASTER [DT-03], ORIGINAL_REQUEST R3 | PLANNED |
| 12 | Micro-Etiquetas Sobrias de Alérgenos | Inyectar micro-etiquetas tipográficas sobrias (`.allergen-pill`, 9px uppercase) según el enum oficial `AllergenTag` de `specs/openapi.yaml` | M3 | openapi.yaml, ORIGINAL_REQUEST R3 | PLANNED |
| 13 | Resiliencia de Precios Duales | Platos con `price > 0` muestran `XX.XX€`; platos con `price == 0` muestran indicación de mercado (`description`) | M3 | SDD_MASTER §6, ORIGINAL_REQUEST R3 | PLANNED |
| 14 | Trigger Editorial Minimalista de Foto | Enlace accesible `dish-photo-trigger` (`FOTOGRAFÍA`) con apertura modal limpia y bloqueo de scroll | M3 | design-system-spec §4 | PLANNED |
| 15 | Desacoplamiento de Semillas JSON Locales | Consumir exclusivamente la colección Firestore `menu_items`; aislar `backup_menu_items.json` | M3 | SDD_MASTER [DT-07] | PLANNED |
| 16 | Función Pura `normalizeCloudinaryUrl` | Normalización determinista de URLs Cloudinary: inyectar `f_auto,q_auto,w_{width},c_limit` y erradicar parámetros `?v=` | M4 | admin-spec §2, ORIGINAL_REQUEST R4 | PLANNED |
| 17 | Unificación de Galería en Firestore `gallery_items` | Migración de galería a Firestore `gallery_items` (eliminar consultas/borrados a Firebase Storage `restaurante-assets/`) | M4 | admin-spec §3, ORIGINAL_REQUEST R4 | PLANNED |
| 18 | Selector de Alérgenos por Chips Interactivos | Reemplazar `<input type="text">` libre por panel interactivo de botones chip con los 16 valores de `AllergenTag` | M4 | admin-spec §4, ORIGINAL_REQUEST R4 | PLANNED |
| 19 | Previsualización Instantánea en Admin | Renderizado inmediato de imagen seleccionada con `URL.createObjectURL(file)` y validación estricta de 10 MB | M4 | admin-spec §3 | PLANNED |
| 20 | Botones Operativos en Tabla de Reservas Admin | Agregar botones `Confirmar` (`confirmed`), `Cancelar` (`cancelled` con modal) y `WhatsApp` (chat directo) por fila | M4 | admin-spec §5, ORIGINAL_REQUEST R4 | PLANNED |
| 21 | Filtros de Sala en Tabla de Reservas Admin | Pestañas de filtrado rápido en cabecera: `Pendientes` (default), `Hoy` (fecha actual), `Todas` (histórico) | M4 | admin-spec §5 | PLANNED |
| 22 | Flujo Anti-Bloqueo de WhatsApp en Reservas | Prohibir `window.open` asíncrono; flujo de 2 pasos: registro Firestore + tarjeta de confirmación con botón voluntario WhatsApp | M5 | SDD_MASTER [DT-11], ORIGINAL_REQUEST R5 | PLANNED |
| 23 | Generación de Localizador Único `SP-XXXX` | Generar código localizador alfanumérico único para cada reserva, visible en tarjeta y mensaje prellenado de WhatsApp | M5 | SDD_MASTER [DT-12], ORIGINAL_REQUEST R5 | PLANNED |
| 24 | Validación de Aforo Ordinario (< 4 Mesas) | Validar máximo 4 reservas activas por franja horaria de 30 minutos en `KITCHEN_HOURS` | M5 | SDD_MASTER §6, openapi.yaml | PLANNED |
| 25 | Validación de Grupos Especiales (> 6 Comensales) | Separación de flujo: 1..6 automático; >6 advertencia de mesa imperial y solicitud de confirmación con maître (máx 20) | M5 | SDD_MASTER §6, ORIGINAL_REQUEST R5 | PLANNED |
| 26 | Manejo Formal de Errores RFC 9457 (Toasts) | Erradicar `alert()` nativo; mapear errores a Problem Details (`title`, `detail`, `status`) en toasts flotantes con tokens Quiet Luxury | M5 | SDD_MASTER §6, openapi.yaml | PLANNED |
| 27 | Suite de Pruebas E2E (Tiers 1-4) | Diseñar y ejecutar suite de pruebas automatizadas que valide todos los requisitos sin depender de internals | E2E-TRACK | SDD_MASTER §7, QA testing | DONE |
| 28 | Verificación E2E y Endurecimiento Adversarial (Tier 5) | Validación de 100% de tests Tiers 1-4, stress testing adversarial y certificación de `npm run pipeline` con exit code 0 | M6 | ORIGINAL_REQUEST Acceptance Criteria | PLANNED |

---

## Milestones

| # | Name | Scope | Dependencies | Status | Output / Key Results |
|---|------|-------|-------------|--------|----------------------|
| E2E | E2E Testing Track | Test suite infra, test cases Tiers 1-4, publish `TEST_READY.md` | none | DONE | 87 tests passing, TEST_READY.md published |
| M1 | Fase 1: Rendimiento Web y Saneamiento de Assets | [DT-01], [DT-04], [DT-06], [DT-08], [DT-09], [DT-10] (Ghost loading, font preconnect, Hero LCP, IntersectionObserver, Supabase purge) | none | DONE | 119 tests passing, pipeline clean in 1.75s, certified by auditor |
| M2 | Fase 2: Sistema de Diseño Quiet Luxury | [DT-05], [DT-06], [DT-07] (Tokens CSS, derogación marco 80px Nazca, derogación shiny loop, estandarización 2 fuentes) | M1 | DONE | 159 tests passing, pipeline clean in 1.2s, CSS 24.74 kB, certified by auditor |
| M3 | Fase 3: Lógica TypeScript de Carta y Alérgenos | [DT-02], [DT-03], [DT-07], [DT-09] (0 emojis, 16 AllergenTag pills, trigger FOTOGRAFÍA, dual pricing, Firestore menu_items) | M2 | IN_PROGRESS | |
| M4 | Fase 4: Blindaje del Backoffice y Unificación en Cloudinary | [DT-04], [DT-05], [DT-10], [DT-11], [DT-12], [DT-13] (`normalizeCloudinaryUrl`, gallery_items, allergen chips, live preview, action buttons) | M3 | PLANNED | |
| M5 | Fase 5: Conserjería de Reservas y Anti-Bloqueo de WhatsApp | [DT-11], [DT-12], [DT-13] (2-step flow, SP-XXXX locator, capacity 4 tables/slot, >6 pax warning, RFC 9457 toasts, 0 alerts) | M4 | PLANNED | |
| M6 | Fase 6: E2E Verification & Adversarial Coverage Hardening | Phase 1: 100% pass on Tiers 1-4; Phase 2: Tier 5 adversarial hardening; final pipeline `npm run pipeline` Exit Code 0 | M5, E2E | PLANNED | |

---

## Interface Contracts

### 1. `normalizeCloudinaryUrl(url: string, width?: number): string`
- Location: `src/admin.ts` (exported pure function)
- Signature:
  ```typescript
  export function normalizeCloudinaryUrl(url: string, width = 800): string
  ```
- Invariants:
  - Return `url` unchanged if null, empty, or not containing `cloudinary.com`.
  - Strip any query parameters (e.g. `?v=...`).
  - Normalize transform segment to `f_auto,q_auto,w_{width},c_limit`.
  - Never nest or duplicate transform directives.

### 2. `AllergenTag` Enum
- Location: `specs/openapi.yaml` (mirrored in `src/types.ts` or module headers)
- Values:
  `pescado | marisco | carne | pollo | picante | gluten-free | gluten | huevos | lacteos | soja | cacahuetes | mostaza | crustaceos | apio | moluscos | sesamo`

### 3. `Reservation` Locator & Capacity
- Locator format: `^SP-[A-Z0-9]{4}$`
- Capacity limits:
  - `number_of_people`: integer, min 1, max 20.
  - Active bookings per 30m slot in `KITCHEN_HOURS`: max 4 (`status !== 'cancelled'`).
  - Groups > 6: Trigger Imperial Table advisory.

### 4. RFC 9457 Problem Details
- Structure:
  ```typescript
  export interface ProblemDetails {
    type: string;
    title: string;
    status: number;
    detail?: string;
    instance?: string;
    invalid_params?: Array<{ name: string; reason: string }>;
  }
  ```
- Display: Rendered exclusively via floating Quiet Luxury toasts; native `alert()` is forbidden.

---

## Code Layout

- `index.html`: Home page (Hero, Story, Summary Menu, Gallery `#main-gallery-grid`, Reservation section).
- `carta.html`: Full digital menu with categorized dishes, allergen filters, photo triggers.
- `admin.html`: Backoffice management panel (Dishes, CMS, Gallery upload, Reservation operations).
- `experiencia.html`: Gastronomic experience story and tasting menu.
- `src/style.css`: Unified CSS stylesheet with `:root` `--lux-*` design tokens and responsive rules.
- `src/main.ts`: Main customer-facing application controller (Hero, Observers, Menu render, Reservation submission).
- `src/admin.ts`: Backoffice application controller (`normalizeCloudinaryUrl`, Gallery Firestore, Chips, Reservation actions).
- `src/reservations.ts`: Reservation domain logic (slots, capacity checks, locator generation).
- `specs/`: Formal specifications (SSOT).
- `tests/`: Automated test suite for E2E Testing Track (Tiers 1-4, Tier 5).
