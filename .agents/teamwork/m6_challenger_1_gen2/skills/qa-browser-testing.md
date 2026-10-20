---
name: qa-browser-testing
description: >-
  Standard procedures, automated test execution, and guidelines for Quality Assurance (QA) and browser-based testing (E2E, Playwright, Puppeteer, user journey simulation, visual regression, form verification, and console error monitoring). Use when planning, writing, or executing QA tests on developed web products.
---

# QA & Browser Testing Standards and Procedures

Este skill define la metodología, herramientas y procedimientos para ejecutar pruebas de calidad de producto con capacidad de interacción en navegador (*Browser Testing*).

---

## 1. Pirámide de Calidad del Producto

1. **Pruebas End-to-End en Navegador (E2E):** Validan flujos completos de punta a punta simulando un usuario de carne y hueso (ej. seleccionar fecha en calendario -> elegir hora disponible -> rellenar formulario -> confirmar -> verificar redirección/mensaje).
2. **Pruebas de Integración y Red:** Verifican que las mutaciones y consultas a Firestore, Cloudinary o APIs externas devuelvan datos coherentes y manejen caídas de conexión con elegancia.
3. **Pruebas de Regresión Visual:** Verifican que cambios de CSS o HTML no rompan la composición, tipografía ni generen saltos visuales en resoluciones móviles o de escritorio.

---

## 2. Herramientas y Ejecución de Pruebas Tipo Browser

### A. Uso de Playwright para Pruebas en Navegador
Playwright es el estándar recomendado para testing en navegadores (Chromium, Firefox, WebKit).

#### Configuración Rápida en el Proyecto:
```bash
npm install -D @playwright/test
npx playwright install --with-deps
```

#### Ejemplo de Test E2E para Flujo de Reserva (`tests/reservation.spec.ts`):
```typescript
import { test, expect } from '@playwright/test';

test.describe('Flujo de Reservas', () => {
  test('debe permitir consultar horas y enviar una reserva válida', async ({ page }) => {
    // 1. Navegar a la página principal
    await page.goto('http://localhost:5173/');

    // 2. Verificar que no haya errores críticos en consola
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Error en consola detectado: "${msg.text()}"`);
      }
    });

    // 3. Completar formulario de reserva
    await page.locator('input[name="date"]').fill('2026-11-20');
    
    // Esperar a que el selector de horas cargue
    const timeSelect = page.locator('select[name="time"]');
    await expect(timeSelect).toBeVisible();

    await page.locator('input[name="name"]').fill('Juan Pérez');
    await page.locator('input[name="email"]').fill('juan.perez@example.com');
    await page.locator('select[name="people"]').selectOption('2');

    // 4. Enviar formulario
    await page.locator('#reservation-form button[type="submit"]').click();

    // 5. Verificar mensaje de confirmación
    const message = page.locator('#form-message');
    await expect(message).toContainText('Reserva');
  });
});
```

### B. Pruebas Rápidas con Headless Puppeteer / Playwright CLI
Para auditorías rápidas de consola, errores de red y capturas de pantalla:
```bash
npx playwright screenshot --viewport-size="375,667" http://localhost:5173/ mobile-preview.png
```

---

## 3. Matriz de Cobertura de Pruebas (Test Matrix)

| Módulo / Funcionalidad | Escenarios Críticos a Probar | Métricas de Aprobación |
| :--- | :--- | :--- |
| **Reservas Web** | Selección de fechas pasadas bloqueada; cálculo de horas disponibles según día; validación de email; feedback tras envío. | Cero excepciones no controladas; confirmación visible en pantalla. |
| **Carta / Menú** | Filtrado por categorías (`comida`, `coctel`); filtrado por etiquetas/alérgenos; apertura y cierre del modal de fotos. | Platos renderizados ordenados por `sort_order`; modal cierra con clic fuera o botón `X`. |
| **Galería** | Carga de imágenes/videos; navegación táctil y con botones; lazy-loading en fotos no visibles. | Cero errores 404 de assets; drag-to-scroll fluido sin parpadeos. |
| **Panel Admin** | Acceso con credenciales correctas; bloqueo ante contraseña errónea; altas, bajas y modificaciones de platos reflejadas en la tabla. | Toast notifications de éxito/error; formulario reset tras guardar. |
| **Responsive UI** | Mobile (375px), Tablet (768px), Desktop (1440px). | Ausencia de scroll horizontal indeseado (`overflow-x: hidden`); botones accesibles en pantallas táctiles (`min-height: 44px`). |

---

## 4. Estructura de un Reporte de Calidad (QA Bug Report)

Cuando el agente detecte un fallo, debe documentarlo con la siguiente estructura:

```markdown
### 🐞 [QA Bug] Título descriptivo del problema
- **Severidad:** Bloqueante | Alta | Media | Baja
- **Entorno:** Chrome / Safari / Edge - Mobile (375px) / Desktop (1440px)
- **Ruta / URL:** `/` o `/carta.html`
- **Pasos para reproducir:**
  1. Ir a ...
  2. Hacer clic en ...
  3. Ingresar el valor ...
- **Resultado Esperado:** Lo que la especificación o el diseño dictamina.
- **Resultado Actual:** Lo que ocurrió realmente (pantalla en blanco, salto visual, etc.).
- **Logs / Errores de Consola:**
  ```text
  Uncaught TypeError: Cannot read properties of undefined...
  ```
- **Recomendación de Fix:** Sugerencia técnica concreta para el desarrollador.
```
