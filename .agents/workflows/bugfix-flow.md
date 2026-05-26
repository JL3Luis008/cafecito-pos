# Workflow: Bugfix execution

Este flujo guía la resolución de errores reportados, priorizando la reproducción del fallo y la prevención de regresiones.

## Pasos

1. **Reproducción (QA Test Designer)**
   - Crear una prueba que falle (Unitario o E2E) para demostrar el bug.
2. **Análisis de Causa Raíz (Builder)**
   - Localizar el código problemático basándose en la prueba que falla.
3. **Draft de Spec de Bugfix (Spec Writer)**
   - Documentar el error, la causa y el plan de acción.
4. **Implementación de la solución (Builder)**
   - Corregir el código para que la prueba pase.
5. **Verificación de Regresión (QA Test Designer)**
   - Correr suite completa de tests relacionados.
6. **Revisión de Seguridad (Security Reviewer)**
   - Validar que el fix no introduce una vulnerabilidad (ej. bypass de auth).
7. **Cierre y Documentación (Docs Keeper)**
   - Cerrar spec y reportar lecciones aprendidas.

## Regla de Oro
"No fix without failing test first". Todo bug debe tener una prueba automatizada asociada.
