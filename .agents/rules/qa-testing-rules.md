# Workspace Rule: QA Quality Gates & Browser Testing Checklist

Aplica estas directrices de aseguramiento de la calidad antes de dar por completada cualquier funcionalidad, ajuste o refactor en el proyecto:

1. **Cero Errores de Consola:**
   - La ejecución en el navegador no debe arrojar errores (`console.error`), advertencias no resueltas de scripts externos, ni excepciones no capturadas (`Uncaught Exception`).

2. **Validación de Formularios y Estados:**
   - Todo formulario debe deshabilitar su botón de envío durante el proceso asíncrono para evitar dobles clics / envíos duplicados.
   - Todo formulario debe proveer mensajes claros de éxito o error al usuario.
   - Los campos obligatorios deben tener validación nativa HTML5 (`required`, `type="email"`, etc.) y validación lógica antes de la mutación.

3. **Verificación de Enlaces y Recursos:**
   - Ninguna imagen, hoja de estilo o script debe responder con error 404 o timeout.
   - Las imágenes deben contar con fallback o manejo de error en caso de fallo en Cloudinary o Storage.

4. **Compatibilidad y Viewports Responsive:**
   - Verificar siempre que no exista desbordamiento horizontal (`overflow-x`) en resoluciones móviles estándar (360px a 414px).
   - Los elementos interactivos (botones, enlaces, selectores) deben tener un área mínima de contacto de al menos 44x44px en móviles.

5. **Pruebas de Regresión Obligatorias:**
   - Al modificar lógica en `main.ts`, `reservations.ts`, `experiencia.ts` o `admin.ts`, validar que los flujos adyacentes sigan funcionando correctamente.
