# 🚀 Pipeline de Desarrollo y Calidad SDD (Sabe a Perú)

Este documento define el **Pipeline Operativo, Técnico y Automatizado** del proyecto **Sabe a Perú**, estructurado bajo la metodología **Spec-Driven Development (SDD)** y gobernado por el equipo de agentes especialistas.

---

## 1. Arquitectura Visual del Pipeline

```mermaid
flowchart TD
    subgraph S1["1. ESPECIFICACIÓN & CONTRATO (SSOT)"]
        A["specs/SDD_MASTER.md"] --> B["specs/openapi.yaml"]
        A --> C["specs/design-system-spec.md"]
        A --> D["specs/performance-spec.md"]
        A --> E["specs/admin-spec.md"]
    end

    subgraph S2["2. GATE INQUISITORIAL (TIRANO)"]
        B & C & D & E --> F{"⚖️ Check de Contrato<br>(auditor-tirano-sdd)"}
        F -->|VETO| A
        F -->|APROBADO| G["🟢 Especificación Sellada"]
    end

    subgraph S3["3. DESARROLLO & REFACTOR SECUENCIAL"]
        G --> H1["Fase 1: Rendimiento & HTML<br>(especialista-rendimiento-web)"]
        H1 --> H2["Fase 2: Estilos Ultra-Lujo CSS<br>(disenador-web-lujo)"]
        H2 --> H3["Fase 3: Lógica TypeScript & Carta<br>(disenador-web-lujo)"]
        H3 --> H4["Fase 4: Backoffice & Cloudinary<br>(especialista-admin-backoffice)"]
        H4 --> H5["Fase 5: Formulario de Reservas<br>(disenador-web-lujo)"]
    end

    subgraph S4["4. TESTING AUTOMATIZADO & VERIFICACIÓN"]
        H5 --> I1["🧪 Pruebas E2E en Navegador<br>(especialista-qa-navegador)"]
        I1 --> I2["npm run pipeline<br>(tsc --noEmit && vite build)"]
    end

    subgraph S5["5. CERTIFICACIÓN FINAL & DESPLIEGUE"]
        I2 --> J{"⚖️ Veredicto Forense Final"}
        J -->|Fallo o Evasión de Tipos| K["⛔ VETO: Bloqueo de Despliegue"]
        K --> H1
        J -->|100% Conforme| L["🟢 CERTIFICACIÓN PLENA<br>🚀 Despliegue a Producción"]
    end

    classDef spec fill:#141414,stroke:#c5a880,stroke-width:2px,color:#f5f2eb;
    classDef gate fill:#2a080c,stroke:#e63946,stroke-width:2px,color:#ffffff;
    classDef success fill:#0b2518,stroke:#52b788,stroke-width:2px,color:#ffffff;
    classDef step fill:#1c1b1a,stroke:#858076,stroke-width:1px,color:#f5f2eb;

    class A,B,C,D,E spec;
    class F,J gate;
    class G,L success;
    class H1,H2,H3,H4,H5,I1,I2 step;
```

---

## 2. Los Comandos Oficiales del Pipeline

Para ejecutar y validar el pipeline en local:

| Comando | Acción del Pipeline | Criterio de Éxito |
| :--- | :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local con recarga rápida (HMR). | Servidor listo en `http://localhost:5173/` |
| `npx tsc --noEmit` | Valida el tipado estricto de TypeScript en todo el proyecto. | `Exit code 0` (0 errores de tipos) |
| `npm run build` | Compila los paquetes de producción de Vite y optimiza bundles. | Generación de la carpeta `dist/` |
| `npm run pipeline` | **Ejecuta la validación completa de punta a punta** (Tipos + Build). | Certificación mecánica para el Tirano |

---

## 3. Matriz de Agentes del Ecosistema

| Agente / Comando | Rol en el Pipeline | Archivo de Especificación |
| :--- | :--- | :--- |
| **`/arquitecto-sdd`** | Gobernanza de contratos y SSOT. | [`specs/openapi.yaml`](specs/openapi.yaml) |
| **`/disenador-web-lujo`** | Dirección de arte 3 estrellas Michelin (*Quiet Luxury*). | [`specs/design-system-spec.md`](specs/design-system-spec.md) |
| **`/especialista-rendimiento-web`** | Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1). | [`specs/performance-spec.md`](specs/performance-spec.md) |
| **`/especialista-admin-backoffice`** | Blindaje del panel, Cloudinary y operativa de reservas. | [`specs/admin-spec.md`](specs/admin-spec.md) |
| **`/especialista-qa-navegador`** | Automatización E2E en navegador real y headless. | Pruebas de navegación |
| **`/tirano`** | Fiscal imparcial: emite **VETO** o **CERTIFICACIÓN PLENA**. | Dictamen Forense |

---

## 4. Estado Actual del Pipeline

* **Fase 1 (Especificación & SSOT):** `🟢 COMPLETADA Y CERTIFICADA`
* **Fase 2 (Gate Inquisitorial & Auditoría):** `🟢 SUPERADO CON ÉXITO (382/382 pruebas PASS)`
* **Fase 3 (Implementación en Disco - M1 a M6):** `🟢 COMPLETADA Y CERTIFICADA (Exit Code 0)`
* **Fase 4 (Control de Calidad E2E & Regresión):** `🟢 CERTIFICACIÓN PLENA (0 fallos)`
* **Fase 5 (Despliegue a Producción):** `🟢 SINCRONIZADO EN REPOSITORIO REMOTO (Branch main)`
