# SSDLC: Secure Software Development Life Cycle

Este flujo es el estándar maestro del proyecto para cualquier intervención técnica.

## Fases y Entregables

| Fase | Objetivo | Subagentes | Entregable |
|---|---|---|---|
| **0. Lectura** | Alineación con el proyecto | Orchestrator | OK / Reporte de Gaps |
| **1. STRIDE** | Modelado de amenazas | Spec Writer / Security | Matriz de Riesgos |
| **2. Historia SMART** | Definición de meta clara | Spec Writer | Historia SMART |
| **3. Spec Design** | Arquitectura y plan | Spec Writer | `docs/specs/*.md` |
| **4. Git Flow** | Gestión de ramas | Orchestrator | Rama creada |
| **5. Skill Audit** | Chequeo de capacidades | Orchestrator / Anti-Hallucination | Package.json verificado |
| **6. Implementación** | Codificación segura | FE/BE Builder | Código + Tests |
| **7. Quality Gates** | Validación de criterios | QA / Security | Reporte de QA |
| **8. Prueba Funcional** | Evidencia de usuario | QA Test Designer | Screenshots / Logs |
| **9. Pull Request** | Revisión por pares | Code Reviewer | PR Aprobado |
| **10. Cierre Doc** | Memoria y Backlog | Docs Keeper | Spec DONE + Backlog |

## Protocolos Obligatorios
- **Mandato de Spec:** No se toca código sin spec `IN PROGRESS`.
- **Independencia en QA:** El implementador no aprueba sus propios tests funcionales.
- **Evidencia Estricta:** Un ticket sin evidencia no se considera terminado.
- **Cierre Documental:** No hay tarea finalizada sin derivación de backlog.
