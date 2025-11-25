# 🛠️ Comandos Útiles - Cheatsheet

## Setup Inicial

```powershell
# Instalación completa automática
.\setup.ps1

# Iniciar todos los servicios
.\start-services.ps1

# Iniciar servicio individual (menú interactivo)
.\start-dev.ps1
```

## Backend - Python

### Entorno Virtual

```powershell
# Crear entorno virtual
python -m venv venv

# Activar (PowerShell)
.\venv\Scripts\Activate.ps1

# Activar (CMD)
.\venv\Scripts\activate.bat

# Desactivar
deactivate
```

### Dependencias

```powershell
# Instalar todas las dependencias
pip install -r requirements.txt

# Instalar dependencia específica
pip install fastapi

# Actualizar dependencia
pip install --upgrade transformers

# Ver dependencias instaladas
pip list

# Generar requirements.txt
pip freeze > requirements.txt
```

### Ejecutar Servicios

```powershell
# Desde la raíz del proyecto
cd backend

# Facial Service
cd services\facial
..\..\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8001

# Voice Service
cd services\voice
..\..\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8002

# Text Service
cd services\text
..\..\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8003

# Fusion Service
cd services\fusion
..\..\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8004

# Sin reload (producción)
uvicorn main:app --host 0.0.0.0 --port 8001
```

## Frontend - React

### NPM Comandos

```powershell
cd frontend

# Instalar dependencias
npm install

# Instalar dependencia específica
npm install axios

# Actualizar dependencias
npm update

# Ver dependencias instaladas
npm list

# Servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview de producción
npm run preview

# Limpiar cache
npm cache clean --force
```

## Docker

### Docker Compose

```powershell
cd backend

# Iniciar todos los servicios
docker-compose up

# Iniciar en background
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f facial_service

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Rebuild imágenes
docker-compose build

# Rebuild y reiniciar
docker-compose up --build

# Solo bases de datos
docker-compose up -d postgres redis
```

### Docker Comandos

```powershell
# Listar contenedores activos
docker ps

# Listar todos los contenedores
docker ps -a

# Listar imágenes
docker images

# Eliminar contenedor
docker rm container_id

# Eliminar imagen
docker rmi image_id

# Ver logs de contenedor
docker logs container_id

# Entrar a contenedor
docker exec -it container_id /bin/bash

# Limpiar sistema
docker system prune -a
```

## Base de Datos

### PostgreSQL

```powershell
# Conectar a PostgreSQL
docker exec -it emotions_postgres psql -U postgres -d emotions_db

# Dentro de psql:
\l              # Listar bases de datos
\dt             # Listar tablas
\d table_name   # Describir tabla
\q              # Salir
```

### Redis

```powershell
# Conectar a Redis
docker exec -it emotions_redis redis-cli

# Comandos Redis:
PING            # Test conexión
KEYS *          # Ver todas las keys
GET key         # Obtener valor
DEL key         # Eliminar key
FLUSHALL        # Limpiar todo
```

## Testing y Debugging

### Backend Testing

```powershell
cd backend
.\venv\Scripts\Activate.ps1

# Ejecutar todos los tests
pytest

# Tests con verbose
pytest -v

# Tests específicos
pytest tests/test_facial.py

# Tests con coverage
pytest --cov=services tests/
```

### Frontend Testing

```powershell
cd frontend

# Ejecutar tests (si hay)
npm test

# Lint
npm run lint
```

### API Testing con curl

```powershell
# Health check
curl http://localhost:8001/health

# Test facial (Windows)
curl -X POST http://localhost:8001/analyze/face `
  -F "file=@image.jpg"

# Test text
curl -X POST http://localhost:8003/analyze/text `
  -H "Content-Type: application/json" `
  -d '{"text": "Estoy muy feliz", "language": "es"}'
```

### API Testing con Swagger

```
http://localhost:8001/docs  # Facial
http://localhost:8002/docs  # Voice
http://localhost:8003/docs  # Text
http://localhost:8004/docs  # Fusion
```

## Git

```powershell
# Inicializar repositorio
git init

# Agregar archivos
git add .

# Commit
git commit -m "Initial commit: Sistema multimodal de emociones"

# Ver estado
git status

# Ver historial
git log --oneline

# Crear branch
git checkout -b feature/nueva-funcionalidad

# Cambiar branch
git checkout main

# Ver branches
git branch
```

## Mantenimiento

### Limpiar Cache de Modelos

```powershell
# Backend
Remove-Item -Recurse -Force backend\models_cache\*
Remove-Item -Recurse -Force backend\.deepface\*

# También en user home
Remove-Item -Recurse -Force $env:USERPROFILE\.deepface\*
Remove-Item -Recurse -Force $env:USERPROFILE\.cache\huggingface\*
```

### Ver Puertos en Uso

```powershell
# Ver todos los puertos
Get-NetTCPConnection | Select-Object LocalPort, State | Sort-Object LocalPort

# Ver puerto específico
Get-NetTCPConnection -LocalPort 8001

# Matar proceso en puerto
$process = Get-NetTCPConnection -LocalPort 8001 | Select-Object -ExpandProperty OwningProcess
Stop-Process -Id $process -Force
```

### Logs

```powershell
# Ver logs del backend
Get-Content backend\logs\app_*.log -Tail 50 -Wait

# Limpiar logs
Remove-Item backend\logs\*.log
```

## Monitoreo

### Recursos del Sistema

```powershell
# CPU y Memoria
Get-Process python | Select-Object Name, CPU, WS

# Espacio en disco
Get-PSDrive C | Select-Object Used, Free

# Procesos de Python
Get-Process | Where-Object { $_.ProcessName -like "*python*" }
```

### Performance

```powershell
# Tiempo de respuesta de API
Measure-Command { 
    Invoke-RestMethod -Uri "http://localhost:8001/health" 
}
```

## Troubleshooting

### Reinstalar Dependencias

```powershell
# Backend
cd backend
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Frontend
cd frontend
Remove-Item -Recurse -Force node_modules
npm install
```

### Reset Completo

```powershell
# Detener servicios
docker-compose down -v

# Limpiar Docker
docker system prune -a

# Limpiar cache
Remove-Item -Recurse -Force backend\models_cache
Remove-Item -Recurse -Force backend\venv
Remove-Item -Recurse -Force frontend\node_modules
Remove-Item -Recurse -Force frontend\dist

# Reinstalar todo
.\setup.ps1
```

## Variables de Entorno

### Backend (.env)

```env
# Base de datos
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Servicios
FACIAL_SERVICE_URL=http://localhost:8001
VOICE_SERVICE_URL=http://localhost:8002
TEXT_SERVICE_URL=http://localhost:8003
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8004
```

## Comandos Productivos

### Build para Producción

```powershell
# Backend - crear imagen Docker
cd backend
docker build -f docker/Dockerfile.facial -t emotions/facial:latest .

# Frontend - build estático
cd frontend
npm run build
# Archivos en: dist/
```

### Deploy Local

```powershell
# Todo el stack
docker-compose -f docker-compose.prod.yml up -d

# Solo backend
docker-compose up -d facial_service voice_service text_service fusion_service

# Frontend servido por Nginx o similar
```

## Shortcuts Útiles

```powershell
# Alias útiles (agregar a $PROFILE)
function Start-Backend { 
    cd backend; .\venv\Scripts\Activate.ps1 
}

function Start-Frontend { 
    cd frontend; npm run dev 
}

function Logs-Backend {
    Get-Content backend\logs\app_*.log -Tail 50 -Wait
}

# Recargar perfil
. $PROFILE
```

## Recursos

- Documentación API: http://localhost:8004/docs
- ReDoc: http://localhost:8004/redoc
- Frontend: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

**Tip**: Guarda este archivo como referencia rápida durante el desarrollo.
