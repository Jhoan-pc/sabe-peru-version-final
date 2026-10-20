# Skill: especialista-admin-backoffice (Local Copy)
Source: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\especialista-admin-backoffice\SKILL.md

Especialista en Panel de Administración (Backoffice), pipeline multimedia de Cloudinary, gestión y operativa de reservas, control de carta y blindaje de formularios.

## Directrices Principales
1. Cloudinary como Único Almacén: Todas las imágenes (platos, CMS y galería) se suben y gestionan exclusivamente a través de Cloudinary. Prohibido mezclar o consultar Firebase Storage para la galería.
2. Normalización de URLs: Todas las URLs se normalizan con `normalizeCloudinaryUrl()` para garantizar `f_auto,q_auto,w_800,c_limit` y evitar duplicaciones o parámetros sucios (`?v=`).
3. Previsualizaciones en Tiempo Real: Uso de `URL.createObjectURL(file)` para previsualizar imágenes inmediatamente al seleccionarlas.
4. Selector de Alérgenos por Chips: Selección visual basada en el catálogo oficial `AllergenTag` en lugar de texto libre con comas.
5. Operativa de Reservas: Botones directos por fila: `Confirmar`, `Cancelar` y `WhatsApp Directo`.
