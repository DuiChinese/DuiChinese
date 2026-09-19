# Guía de Contribución a DuiChinese 🏮

¡Gracias por tu interés en contribuir a **DuiChinese**! Nuestro objetivo es crear la mejor herramienta libre y abierta para aprender caracteres chinos y dominar los tonos y la pronunciación desde cero.

---

## 🛠️ Entorno de Desarrollo Rápido

### Prerrequisitos
- Node.js >= 18
- Python >= 3.9
- Docker (opcional, para levantar PostgreSQL en un comando)

### Paso 1: Clonar y configurar

```bash
git clone https://github.com/TU_USUARIO/duichinese.git
cd duichinese
```

### Paso 2: Backend (Python FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Copiar variables de entorno
cp .env.example .env

# Iniciar servidor backend (con recarga en vivo)
uvicorn app.main:app --reload --port 8000
```
La documentación interactiva de la API estará disponible en `http://localhost:8000/docs`.

### Paso 3: Frontend (Vite + React)

En otra terminal:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
La interfaz estará lista en `http://localhost:5173`.

---

## 🧪 Ejecución de Tests (Mandatorio)

Antes de abrir cualquier Pull Request, todos los tests deben pasar:

```bash
# Tests de Backend
cd backend
pytest -v

# Tests de Frontend
cd frontend
npm run test:run
npm run build
```

---

## 📋 Reglas para Pull Requests

1. **Crea una rama descriptiva**: `git checkout -b feature/nombre-funcionalidad` o `git checkout -b fix/nombre-error`.
2. **Escribe tests**: Si agregas una función o endpoint, incluye sus pruebas correspondientes.
3. **Cero Secretos**: Jamás subas archivos `.env`, credenciales ni bases de datos.
4. **Respeta la paleta**: Rojo (`#960708`) y Oro (`#FECB6D`).
5. **Abre el PR** siguiendo la plantilla en `.github/pull_request_template.md`.

