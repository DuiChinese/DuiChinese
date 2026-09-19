# Directrices Mandatorias para Asistentes de IA (AI Guidelines)

Este documento es de **lectura obligatoria y cumplimiento estricto** para cualquier modelo de lenguaje, asistente de IA (Cursor, Antigravity, GitHub Copilot, Claude Code, etc.) o agente autónomo que intervenga en el repositorio **DuiChinese**.

---

## 1. Regla de Oro de Testing (Test-Driven & Verification)

1. **Creación Obligatoria de Pruebas**:
   - **Toda nueva funcionalidad** (endpoint en FastAPI, componente interactivo en React, hook personalizado o utilidad) **debe ir acompañada de sus tests correspondientes**.
   - Si una funcionalidad preexistente se modifica y no contaba con tests, la IA debe crear la suite de pruebas antes o durante la modificación.
2. **Ejecución y Verificación Antes de Finalizar**:
   - **Bajo ninguna circunstancia** se dará una tarea por completada sin haber ejecutado la suite de tests correspondiente y comprobado que pasan en verde:
     - Backend: `pytest` (en la carpeta `backend/`)
     - Frontend: `npm test` o `npm run test:run` (en la carpeta `frontend/`)
   - Si algún test falla, debe solucionarse antes de entregar la respuesta al usuario.

---

## 2. Seguridad y Fugas de Secretos (Zero Secrets Policy)

1. **Protección Absoluta de Credenciales**:
   - **Nunca** escribas ni agregues contraseñas reales, tokens de API, cadenas de conexión privadas ni claves de producción en el código fuente.
   - Utiliza siempre variables de entorno gestionadas a través de plantillas `.env.example`.
2. **Respeto a `.gitignore`**:
   - Nunca intentes forzar el versionado (`git add -f`) de archivos `.env`, bases de datos locales (`*.sqlite`, `*.db`, dumps SQL), o carpetas de dependencias (`node_modules/`, `venv/`).

---

## 3. Documentación Exhaustiva y Proactiva

1. **Actualización Constante**:
   - Si se añade un nuevo endpoint en el backend, debe reflejarse en `backend/README.md` o `docs/API.md` y disponer de tipado Pydantic que alimente la documentación OpenAPI automática (`/docs`).
   - Si se añade una nueva pantalla o funcionalidad visual, debe documentarse su uso en el `README.md` principal.
2. **Calidad y Autoexplicación**:
   - Comentarios descriptivos (docstrings en Python, JSDoc en JavaScript/React) en funciones con lógica compleja (ej. cálculo de similitud fonética o manejo de Web Speech API).

---

## 4. Identidad Visual y Diseño Responsive

1. **Paleta Oficial**:
   - Color Primario: `#960708` (Rojo chino / Carmesí)
   - Color Secundario / Acento: `#FECB6D` (Oro cálido / Ámbar)
2. **Adaptabilidad**:
   - Todos los componentes visuales deben diseñarse con enfoque Mobile-First y soportar Container Queries / layouts fluidos para pantallas móviles, tablets y escritorio.

---

## 5. Resumen de Comandos de Verificación para la IA

```bash
# Verificación Backend
cd backend && pytest -v

# Verificación Frontend
cd frontend && npm run test:run && npm run build
```

