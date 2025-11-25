# 🎭 Sistema Multimodal de Reconocimiento de Emociones

Sistema completo de reconocimiento de emociones usando Deep Learning con arquitectura de microservicios.

## 🚀 Características

- **Análisis Facial**: Detección de emociones en imágenes usando DeepFace
- **Análisis de Voz**: Clasificación de emociones en audio con Wav2Vec2
- **Análisis de Texto**: NLP para detectar emociones en español/inglés con BERT
- **Fusión Multimodal**: Combina múltiples modalidades con ponderación adaptativa
- **API REST**: FastAPI con documentación automática (Swagger)
- **Frontend Moderno**: React + Vite con UI intuitiva

## 🏗️ Arquitectura

```
Emotions/
├── backend/              # Microservicios Python
│   ├── services/
│   │   ├── facial/      # Análisis facial (puerto 8001)
│   │   ├── voice/       # Análisis de voz (puerto 8002)
│   │   ├── text/        # Análisis de texto (puerto 8003)
│   │   └── fusion/      # Fusión multimodal (puerto 8004)
│   ├── shared/          # Código compartido
│   ├── docker/          # Dockerfiles
│   └── requirements.txt
│
└── frontend/            # Aplicación React
    ├── src/
    │   ├── components/
    │   └── services/
    └── package.json
```

## 📋 Requisitos

- Python 3.12+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (opcional)

## 🛠️ Instalación

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
.\venv\Scripts\activate

# Instalar dependencias
python -m pip install --upgrade pip
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env

# Iniciar bases de datos (Docker)
docker-compose up -d postgres redis
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

## 🚀 Ejecución

### Opción 1: Docker Compose (Recomendado)

```bash
cd backend
docker-compose up --build
```

### Opción 2: Ejecución Manual

**Backend** (4 terminales):

```bash
# Terminal 1 - Facial
cd backend/services/facial
uvicorn main:app --reload --port 8001

# Terminal 2 - Voice
cd backend/services/voice
uvicorn main:app --reload --port 8002

# Terminal 3 - Text
cd backend/services/text
uvicorn main:app --reload --port 8003

# Terminal 4 - Fusion
cd backend/services/fusion
uvicorn main:app --reload --port 8004
```

**Frontend**:

```bash
cd frontend
npm run dev
```

## 📡 Endpoints API

### Servicios Individuales

- **Facial**: `POST http://localhost:8001/analyze/face`
- **Voice**: `POST http://localhost:8002/analyze/voice`
- **Text**: `POST http://localhost:8003/analyze/text`

### Servicio de Fusión

- **Multimodal**: `POST http://localhost:8004/analyze/multimodal`

### Documentación

- Swagger UI: `http://localhost:800X/docs`
- ReDoc: `http://localhost:800X/redoc`

## 🧪 Uso

1. Abre `http://localhost:3000` en tu navegador
2. Selecciona una o más modalidades:
   - 📸 Sube una imagen facial
   - 🎤 Sube un archivo de audio
   - ✍️ Escribe un texto
3. Haz clic en "Analizar Emociones"
4. Visualiza los resultados con gráficos interactivos

## 🤖 Modelos Utilizados

| Modalidad | Modelo | Descripción |
|-----------|--------|-------------|
| Facial | DeepFace | VGG-Face, OpenFace, FaceNet |
| Voz | Wav2Vec2 | `ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition` |
| Texto (ES) | BETO | `finiteautomata/beto-sentiment-analysis` |
| Texto (EN) | DistilRoBERTa | `j-hartmann/emotion-english-distilroberta-base` |

## 📊 Emociones Detectadas

- 😊 Feliz (Happy)
- 😢 Triste (Sad)
- 😠 Enojado (Angry)
- 😐 Neutral (Neutral)
- 😮 Sorprendido (Surprise)
- 😨 Miedo (Fear)
- 🤢 Disgusto (Disgust)

## 🐳 Docker

### Construir imágenes

```bash
cd backend
docker-compose build
```

### Iniciar todos los servicios

```bash
docker-compose up
```

### Detener servicios

```bash
docker-compose down
```

## 🔧 Configuración

### Backend (.env)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/emotions_db
REDIS_HOST=localhost
REDIS_PORT=6379
FACIAL_SERVICE_URL=http://localhost:8001
VOICE_SERVICE_URL=http://localhost:8002
TEXT_SERVICE_URL=http://localhost:8003
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8004
```

## 📝 Licencia

Proyecto educativo - IA 2025

## 👥 Autor

Ciclo 8 - Ingeniería en Inteligencia Artificial

---

**Nota**: La primera ejecución puede tardar varios minutos mientras se descargan los modelos pre-entrenados.
