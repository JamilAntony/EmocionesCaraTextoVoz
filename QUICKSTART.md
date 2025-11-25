# 🚀 Guía Rápida de Inicio

## Instalación Automática (Recomendado)

```powershell
# Ejecutar el script de instalación
.\setup.ps1
```

Este script:
- ✅ Verifica Python y Node.js
- ✅ Crea el entorno virtual
- ✅ Instala todas las dependencias
- ✅ Configura archivos .env

## Iniciar Todos los Servicios

### Opción 1: Script Automático (Recomendado)

```powershell
.\start-services.ps1
```

Esto abrirá 5 ventanas con:
- Facial Service (puerto 8001)
- Voice Service (puerto 8002)
- Text Service (puerto 8003)
- Fusion Service (puerto 8004)
- Frontend React (puerto 3000)

### Opción 2: Docker Compose

```powershell
cd backend
docker-compose up --build
```

Luego en otra terminal:

```powershell
cd frontend
npm run dev
```

## Iniciar Servicios Individualmente

```powershell
.\start-dev.ps1
```

Menú interactivo para iniciar servicios uno por uno.

## URLs Importantes

| Servicio | URL | Documentación |
|----------|-----|---------------|
| Frontend | http://localhost:3000 | - |
| Facial API | http://localhost:8001 | /docs |
| Voice API | http://localhost:8002 | /docs |
| Text API | http://localhost:8003 | /docs |
| Fusion API | http://localhost:8004 | /docs |

## Instalación Manual

### Backend

```powershell
# 1. Crear entorno virtual
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar variables de entorno
Copy-Item .env.example .env

# 4. Iniciar servicios (4 terminales)
# Terminal 1
cd services/facial
uvicorn main:app --reload --port 8001

# Terminal 2
cd services/voice
uvicorn main:app --reload --port 8002

# Terminal 3
cd services/text
uvicorn main:app --reload --port 8003

# Terminal 4
cd services/fusion
uvicorn main:app --reload --port 8004
```

### Frontend

```powershell
# 1. Instalar dependencias
cd frontend
npm install

# 2. Configurar variables de entorno
Copy-Item .env.example .env

# 3. Iniciar servidor de desarrollo
npm run dev
```

## Probar la Aplicación

1. Abre http://localhost:3000 en tu navegador
2. Selecciona una o más opciones:
   - 📸 Sube una imagen con un rostro
   - 🎤 Sube un archivo de audio con voz
   - ✍️ Escribe un texto
3. Haz clic en "Analizar Emociones"
4. Visualiza los resultados

## Archivos de Prueba

### Imágenes
- Usa cualquier foto con un rostro visible
- Formatos: JPG, PNG
- Tamaño máximo: 10MB

### Audio
- Archivos con voz clara
- Formatos: WAV, MP3, OGG
- Duración recomendada: 3-10 segundos

### Texto
- Cualquier texto en español o inglés
- Mínimo 10 caracteres
- Máximo 5000 caracteres

## Solución de Problemas

### Error: Modelo no disponible

**Causa**: El modelo aún se está descargando

**Solución**: Espera 2-3 minutos. Los modelos se descargan automáticamente la primera vez.

### Error: No se puede conectar con el servidor

**Causa**: Los servicios backend no están iniciados

**Solución**: Verifica que los 4 microservicios estén corriendo:
```powershell
# Ver procesos de uvicorn
Get-Process | Where-Object { $_.ProcessName -like "*python*" }
```

### Error: Puerto en uso

**Causa**: Otro servicio está usando el puerto

**Solución**: 
```powershell
# Detener el proceso en el puerto 8001 (ejemplo)
$process = Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
Stop-Process -Id $process -Force
```

### Frontend no carga

**Causa**: Node.js o dependencias no instaladas

**Solución**:
```powershell
cd frontend
npm install
npm run dev
```

## Detener Servicios

### Script automático
Cierra todas las ventanas de PowerShell abiertas

### Docker
```powershell
cd backend
docker-compose down
```

### Manual
Presiona `Ctrl+C` en cada terminal

## Logs

### Backend
Cada servicio muestra logs en su terminal
- Logs también se guardan en `backend/logs/`

### Frontend
Los logs se muestran en la consola del navegador (F12)

## Próximos Pasos

1. Lee el [README.md](README.md) completo
2. Explora la documentación de la API en `/docs`
3. Revisa los modelos en `backend/services/`
4. Personaliza los componentes en `frontend/src/components/`

## Soporte

- 📧 Para dudas, revisa el código fuente
- 📚 Documentación: Swagger UI en cada servicio
- 🐛 Issues: Usa el sistema de control de versiones

---

**¡Listo! Tu sistema de reconocimiento de emociones está funcionando.** 🎉
