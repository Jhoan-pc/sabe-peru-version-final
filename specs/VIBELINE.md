# 🗺️ El "Vibeline" de Sabe a Perú: Pipeline de Desarrollo SDD

**Proyecto:** Sabe a Perú - Alta Gastronomía Peruana en Oviedo  
**Metodología:** Spec-Driven Development (SDD) & Zero-Trust Architecture  
**Estado:** `GATE 1 SUPERADO` (Especificación Certificada al 100% | Código en Disco Listo para Ejecución)

---

## 1. Diagrama de Flujo del Proceso ("The Vibeline")

```mermaid
flowchart TD
    subgraph FASE_0["🔍 FASE 0: INGENIERÍA INVERSA & DESCUBRIMIENTO"]
        A["Código Heredado<br>(Bugs, Doble Render, Marco 80px)"] --> B["📐 arquitecto_sdd<br>Deconstrucción de Datos y Endpoints"]
    end

    subgraph FASE_1["🎯 FASE 1: AUDITORÍAS MULTIDISCIPLINARES"]
        B --> C1["✨ disenador_web_lujo<br>Auditoría Michelin: Fuera marco, emojis y shiny"]
        B --> C2["⚡ especialista_rendimiento_web<br>Auditoría CWV: LCP, INP, fin al doble render"]
        B --> C3["🛠️ especialista_admin_backoffice<br>Auditoría Backoffice: Unificación 100% Cloudinary"]
    end

    subgraph FASE_2["📜 FASE 2: BLINDAJE CONTRACTUAL (SSOT en specs/)"]
        C1 & C2 & C3 --> D["specs/SDD_MASTER.md<br>(Fuente Única de la Verdad)"]
        D --> D1["specs/openapi.yaml<br>(Contrato API 3.1 & RFC 9457)"]
        D --> D2["specs/design-system-spec.md<br>(Tokens Quiet Luxury)"]
        D --> D3["specs/performance-spec.md<br>(SLA Core Web Vitals)"]
        D --> D4["specs/admin-spec.md<br>(Pipeline Cloudinary & Chips)"]
    end

    subgraph GATE_1["⚖️ CHECKPOINT 1: AUDITORÍA INQUISITORIAL"]
        D1 & D2 & D3 & D4 --> E{"⚖️ auditor_tirano_sdd<br>Juicio de la Especificación"}
        E -->|ESTADO ACTUAL| E1["🟢 ESPECIFICACIÓN: CERTIFICADA<br>⛔ CÓDIGO EN DISCO: VETADO (Pre-refactor)"]
    end

    subgraph FASE_3["🔨 FASE 3: IMPLEMENTACIÓN SECUENCIAL EN DISCO"]
        E1 -.->|ORDEN DEL USUARIO| F1["1. Saneamiento HTML & Performance<br>(Eliminar 10 fotos Supabase, Observer)"]
        F1 --> F2["2. Inyección de Tokens Luxury en CSS<br>(Obsidiana, Alabastro, Hairlines 1px)"]
        F2 --> F3["3. Refactor TypeScript de Carta<br>(Micro-etiquetas alérgenos, trigger minimalista)"]
        F3 --> F4["4. Blindaje del Backoffice en admin.ts<br>(Cloudinary unificado, normalizador URLs, chips)"]
        F4 --> F5["5. Formulario Conserjería de Reservas<br>(Inputs translúcidos, WhatsApp sin popup blocker)"]
        F5 --> F6["6. Pruebas E2E en Navegador<br>(🧪 especialista_qa_navegador valida fluidez y 0 errores)"]
    end

    subgraph GATE_2["🏆 CERTIFICACIÓN FINAL & DESPLIEGUE"]
        F6 --> G{"⚖️ auditor_tirano_sdd<br>Juicio Forense de Cierre"}
        G -->|Si hay evasiones/any/@ts-ignore| H["⛔ VETO: Corrección Obligatoria"]
        H --> F1
        G -->|tsc: 0, build: 0, CWV: OK| I["🟢 CERTIFICACIÓN PLENA<br>🚀 Despliegue a Producción"]
    end

    classDef spec fill:#1a1918,stroke:#c5a880,stroke-width:2px,color:#f5f2eb;
    classDef gate fill:#2e0b0e,stroke:#e63946,stroke-width:2px,color:#ffffff;
    classDef current fill:#3d2c00,stroke:#ffd700,stroke-width:3px,color:#fff;
    classDef success fill:#0d2818,stroke:#52b788,stroke-width:2px,color:#ffffff;

    class D,D1,D2,D3,D4 spec;
    class E,G gate;
    class E1 current;
    class I success;
```

---

## 2. Mapa del Ecosistema de Agentes Especialistas

| Comando / Subagente | Rol en el Vibeline | Entregable Canónico |
| :--- | :--- | :--- |
| **`/arquitecto-sdd`** | Gobernanza de contratos, ingeniería inversa y modelos de datos. | [`specs/openapi.yaml`](file:///c:/Users/Martin/Documents/Trabajo/sabeaperu/specs/openapi.yaml)<br>[`specs/SDD_MASTER.md`](file:///c:/Users/Martin/Documents/Trabajo/sabeaperu/specs/SDD_MASTER.md) |
| **`/disenador-web-lujo`** | Dirección de arte editorial, estética 3 estrellas Michelin (*Quiet Luxury*). | [`specs/design-system-spec.md`](file:///c:/Users/Martin/Documents/Trabajo/sabeaperu/specs/design-system-spec.md) |
| **`/especialista-rendimiento-web`** | Core Web Vitals, aceleración LCP/INP/CLS y optimización de assets. | [`specs/performance-spec.md`](file:///c:/Users/Martin/Documents/Trabajo/sabeaperu/specs/performance-spec.md) |
| **`/especialista-admin-backoffice`** | Blindaje del panel, unificación en Cloudinary, chips y gestión de reservas. | [`specs/admin-spec.md`](file:///c:/Users/Martin/Documents/Trabajo/sabeaperu/specs/admin-spec.md) |
| **`/especialista-qa-navegador`** | Automatización E2E, testing interactivo en navegador y control de errores. | Certificación de flujos en navegador |
| **`/tirano`** | Fiscal imparcial y juez de cumplimiento estricto. Emite VETO o CERTIFICACIÓN. | Dictamen Forense Independiente |

---

## 3. Estado de Ejecución y Próximos Pasos

### Fase Actual: `GATE 1 (ESPECIFICACIÓN CONCLUIDA)`
- [x] Ingeniería inversa completa.
- [x] Detección de cuellos de botella y bugs de raíz.
- [x] Contratos OpenAPI 3.1, Design Tokens, SLA de Rendimiento y Backoffice formalizados.
- [x] Auditoría forense del Tirano: **Especificación CERTIFICADA al 100%**.
- [ ] **Pendiente de Autorización:** Ejecución física de las 6 fases en disco.
