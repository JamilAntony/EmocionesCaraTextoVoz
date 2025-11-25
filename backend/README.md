# Backend - Sistema Multimodal de Reconocimiento de Emociones

Sistema de microservicios para análisis de emociones en múltiples modalidades: facial, voz y texto.

## Arquitectura

```
backend/
├── services/
│   ├── facial/          # Microservicio análisis facial (DeepFace)
│   ├── voice/           # Microservicio análisis de voz (Wav2Vec2)
│   ├── text/            # Microservicio análisis de texto (BERT)
│   └── fusion/          # Microservicio de fusión multimodal
├── shared/              # Código compartido
│   ├── database/        # Modelos SQLAlchemy
│   ├── schemas/         # Schemas Pydantic
│   └── utils/           # Utilidades comunes
└── docker/              # Configuración Docker
```

## Instalación

### 1. Crear entorno virtual (Python 3.12)

```bash
python -m venv venv
.\venv\Scripts\activate
```

### 2. Instalar dependencias

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### 4. Iniciar servicios

#### PostgreSQL y Redis con Docker:
```bash
docker-compose up -d postgres redis
```

#### Ejecutar microservicios:
```bash
# Terminal 1 - Facial
cd services/facial
uvicorn main:app --reload --port 8001

# Terminal 2 - Voice
cd services/voice
uvicorn main:app --reload --port 8002

# Terminal 3 - Text
cd services/text
uvicorn main:app --reload --port 8003

# Terminal 4 - Fusion
cd services/fusion
uvicorn main:app --reload --port 8004
```

## Endpoints

### Facial Service (Puerto 8001)
- `POST /analyze/face` - Analizar imagen facial

### Voice Service (Puerto 8002)
- `POST /analyze/voice` - Analizar audio

### Text Service (Puerto 8003)
- `POST /analyze/text` - Analizar texto

### Fusion Service (Puerto 8004)
- `POST /analyze/multimodal` - Análisis combinado

## Modelos Utilizados

- **Facial**: DeepFace (VGG-Face, FaceNet, OpenFace)
- **Voz**: Wav2Vec2 emotion recognition
- **Texto**: BETO (BERT español) / XLM-RoBERTa

## Testing

```bash
pytest tests/ -v
```
