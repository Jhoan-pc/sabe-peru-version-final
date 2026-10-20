---
name: sdd-architecture
description: >-
  Use this skill when designing, reviewing, or implementing systems using Spec-Driven Development (SDD). It provides guidelines for contract-first design, OpenAPI 3.1, JSON Schema, API governance, mock generation, type generation, and contract testing.
---

# Spec-Driven Development (SDD) Architecture Guide & Skill

Este skill proporciona la metodología, estándares y procedimientos para operar bajo **Spec-Driven Development (SDD)** en el proyecto.

---

## 1. Principios Fundamentales del SDD

1. **La Especificación es la Única Fuente de la Verdad (SSOT):**
   - Nunca escribir código de backend, frontend o base de datos sin un contrato previo acordado.
   - Cualquier cambio en la funcionalidad debe comenzar actualizando la especificación.

2. **Diseño Contract-First / API-First:**
   - La API se diseña desde la perspectiva del consumidor.
   - Usar estándares abiertos: OpenAPI 3.1 para HTTP REST, AsyncAPI para colas/eventos, JSON Schema para validación de datos.

3. **Mocks y Paralelismo:**
   - Una vez definida y aprobada la especificación, levantar mocks de inmediato (ej. Prism, MSW).
   - El equipo de frontend y clientes externos desarrollan contra los mocks sin bloquearse por el backend.

4. **Automatización de Tipos y Código:**
   - Generar interfaces TypeScript, schemas Zod, o modelos Pydantic directamente desde la especificación.
   - Evitar duplicar interfaces escritas a mano que puedan desincronizarse del contrato.

---

## 2. Flujo de Trabajo Operativo en 5 Pasos

### Paso 1: Definición del Modelo de Dominio y Requisitos
- Identificar entidades, atributos, estados y relaciones.
- Determinar operaciones requeridas (lecturas, mutaciones idempotentes, transacciones).
- Definir roles de acceso y políticas de seguridad (scopes, JWT, RBAC).

### Paso 2: Redacción del Contrato Formal
- Escribir la especificación en `docs/specs/` o `specs/` (OpenAPI 3.1 YAML/JSON).
- Estructurar esquemas reutilizables en `components/schemas`.
- Formato de errores estandarizado bajo **RFC 9457 / RFC 7807 (Problem Details)**:
  ```json
  {
    "type": "https://api.tuservicio.com/errors/invalid-reservation",
    "title": "Datos de reserva inválidos",
    "status": 422,
    "detail": "La fecha seleccionada no cuenta con disponibilidad de mesas.",
    "instance": "/reservas/12345",
    "invalid_params": [
      { "name": "fecha", "reason": "Horario fuera de servicio" }
    ]
  }
  ```
- Incluir encabezados de idempotencia (`Idempotency-Key`) en mutaciones críticas (pagos, órdenes).

### Paso 3: Auditoría y Linting del Contrato
- Ejecutar linter de especificaciones (Spectral o ESLint OpenAPI plugin).
- Verificar cumplimiento de:
  - Buenas prácticas RESTful (nombres de recursos en plural, verbos HTTP correctos).
  - Reglas de seguridad OWASP API Security.
  - Documentación de todos los códigos de respuesta esperados (200, 201, 400, 401, 403, 404, 409, 422, 500).

### Paso 4: Generación de Mocks y Tipos
- Generar tipos automáticamente para el frontend/backend:
  - `npx openapi-typescript ./specs/api.yaml -o ./src/types/api.ts`
- Levantar servidor de mocks interactivo:
  - `npx @stoplight/prism-cli mock ./specs/api.yaml -p 4010`

### Paso 5: Implementación y Pruebas de Conformidad
- Implementar controladores y rutas en el backend.
- Ejecutar pruebas automáticas de contrato (Schemathesis, Pact o Dredd) para certificar que la respuesta real del servidor respeta al 100% el esquema OpenAPI.

---

## 3. Checklist de Verificación SDD

Antes de dar por finalizada cualquier funcionalidad:
- [ ] ¿Existe una especificación técnica formal?
- [ ] ¿Están todos los campos tipados estrictamente (sin tipos `any` o genéricos ambiguos)?
- [ ] ¿Se han incluido ejemplos realistas (`examples`) en requests y responses?
- [ ] ¿Se modelaron los escenarios de error (4xx y 5xx)?
- [ ] ¿Se han generado los tipos de TypeScript/Zod desde la spec?
- [ ] ¿Los tests unitarios o de integración validan las respuestas contra el contrato?
