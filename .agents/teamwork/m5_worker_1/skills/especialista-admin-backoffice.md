---
name: especialista-admin-backoffice
description: Especialista en Panel de Administración (Backoffice), pipeline multimedia de Cloudinary, gestión y operativa de reservas, control de carta y blindaje de formularios.
---

# Especialista en Panel de Administración y Backoffice

Este skill guía la gestión, blindaje y desarrollo del panel de control de administración (`admin.html` y `src/admin.ts`).

---

## Directrices Principales
1. **Cloudinary como Único Almacén:**
   - Todas las imágenes (platos, CMS y galería) se suben y gestionan exclusivamente a través de Cloudinary.
   - Prohibido mezclar o consultar Firebase Storage para la galería.
2. **Normalización de URLs:**
   - Todas las URLs se normalizan con `normalizeCloudinaryUrl()` para garantizar `f_auto,q_auto,w_800,c_limit` y evitar duplicaciones o parámetros sucios (`?v=`).
3. **Previsualizaciones en Tiempo Real:**
   - Uso de `URL.createObjectURL(file)` para previsualizar imágenes inmediatamente al seleccionarlas.
4. **Selector de Alérgenos por Chips:**
   - Selección visual basada en el catálogo oficial `AllergenTag` en lugar de texto libre con comas.
5. **Operativa de Reservas:**
   - Botones directos por fila: `Confirmar`, `Cancelar` y `WhatsApp Directo`.

Consulta la especificación técnica completa en [specs/admin-spec.md](file:///c:/Users/Martin/Documents/Trabajo/sabeaperu/specs/admin-spec.md).
