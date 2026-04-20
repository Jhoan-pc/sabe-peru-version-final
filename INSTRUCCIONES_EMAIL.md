# Cómo Configurar Notificaciones por Correo (EmailJS)

Para que las reservas envíen un correo automático tanto al restaurante como al cliente, recomendamos usar **EmailJS** (es gratuito hasta 200 emails al mes y no requiere servidor backend).

## Paso 1: Crear Cuenta en EmailJS
1. Ve a [https://www.emailjs.com/](https://www.emailjs.com/) y crea una cuenta gratuita ("Sign Up Free").
2. En el panel, añade un **Email Service**:
   - Haz clic en "Add New Service".
   - Elige "Gmail" (o tu proveedor de correo).
   - Conecta tu cuenta.
   - Copia el **Service ID** (ej: `service_xim452`).

## Paso 2: Crear Plantilla de Correo
1. Ve a "Email Templates" y crea una nueva ("Create New Template").
2. Diseña el correo que quieres recibir. Puedes usar variables como `{{name}}`, `{{date}}`, etc.
   - Ejemplo de Asunto: `Nueva Reserva de {{name}}`
   - Ejemplo de Contenido:
     ```
     Hola,
     
     Se ha recibido una nueva solicitud de reserva:
     
     Cliente: {{name}}
     Email: {{email}}
     Fecha: {{date}} a las {{time}}
     Personas: {{people}}
     Ocasión: {{occasion}}
     
     Por favor, contactar para confirmar.
     ```
3. Guarda la plantilla y copia el **Template ID** (ej: `template_845xyz`).

## Paso 3: Obtener tu Public Key
1. Ve a "Account" (icono de usuario) -> "Public Key".
2. Copia tu **Public Key** (ej: `user_KC52...`).

## Paso 4: Integrar en el Código
Una vez tengas estos 3 datos (`Service ID`, `Template ID`, `Public Key`), avísame y los integraré en el código, o puedes hacerlo tú mismo editando `src/main.ts`.

### Código a añadir en `src/main.ts` (Yo puedo hacerlo):

1. Instalar la librería:
   `npm install @emailjs/browser`

2. Importar e Inicializar:
   ```typescript
   import emailjs from '@emailjs/browser';
   emailjs.init("TU_PUBLIC_KEY");
   ```

3. En la función de envío (dentro de `reservationForm.addEventListener`):
   ```typescript
   emailjs.send("TU_SERVICE_ID", "TU_TEMPLATE_ID", {
       name: reservation.customer_name,
       email: reservation.customer_email,
       date: reservation.reservation_date,
       time: reservation.reservation_time,
       people: reservation.number_of_people,
       occasion: reservation.occasion
   });
   ```

---

**Nota:** Por ahora, he implementado la redirección a **WhatsApp** que funciona de inmediato sin configuración extra. Al hacer clic en "Solicitar Reserva", se abrirá WhatsApp con los datos listos para enviar al restaurante.
