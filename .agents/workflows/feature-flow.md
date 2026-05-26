# Workflow: Feature Development

Este flujo guía la creación de nuevas funcionalidades, asegurando que pasen por todas las capas de validación del SSDLC.

## Pasos

1. **Lectura de contexto (Orchestrator)**
   - Revisar repo, `task.md` y `MANUAL_OPERATIVO.md`.
2. **Clasificación y STRIDE (Spec Writer + Security Reviewer)**
   - Identificar impacto en seguridad.
3. **Draft de Spec (Spec Writer)**
   - Crear el archivo en `docs/specs/`.
4. **Validación de Spec (Usuario / Orchestrator)**
   - El spec debe ser aprobado antes de seguir.
5. **Skill Audit (Orchestrator)**
   - Confirmar stack y herramientas necesarias.
6. **Implementación (Builder - FE/BE)**
   - Escribir código y tests unitarios.
7. **Verificación Realidad (Anti-Hallucination Reviewer)**
   - Validar que no se inventaron dependencias.
8. **Diseño de Pruebas (QA Test Designer)**
   - Crear plan de pruebas funcional.
9. **QA y Quality Gates (QA Test Designer + Security Reviewer)**
   - Ejecutar pruebas y validar seguridad.
10. **Pull Request (Builder)**
    - Crear PR y disparar revisión.
11. **Code Review (Code Reviewer)**
    - Revisar diff y aprobar/solicitar cambios.
12. **Cierre Documental (Docs Keeper)**
    - Cerrar spec y derivar backlog.

## Regla de Oro
Ningún paso puede saltarse sin justificación en el ADR o acuerdo con el Tech Lead.
