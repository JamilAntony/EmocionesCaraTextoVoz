# 📐 Documentación Técnica - Arquitectura

## Visión General del Sistema

Sistema distribuido de microservicios para análisis multimodal de emociones usando Deep Learning.

## Arquitectura de Microservicios

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│                     http://localhost:3000                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Fusion Service (FastAPI)                        │
│                  Port 8004 - Gateway                         │
└───┬──────────────────┬──────────────────┬──────────────────┘
    │                  │                  │
    ▼                  ▼                  ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Facial   │    │  Voice   │    │  Text    │
│ Service  │    │ Service  │    │ Service  │
│ Port 8001│    │ Port 8002│    │ Port 8003│
└────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │
     ▼               ▼               ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│ DeepFace │    │ Wav2Vec2 │    │   BERT   │
│  Models  │    │  Models  │    │  Models  │
└──────────┘    └──────────┘    └──────────┘
```

## Stack Tecnológico

### Backend
- **Framework**: FastAPI 0.104+
- **Servidor**: Uvicorn (ASGI)
- **Validación**: Pydantic
- **ML Framework**: TensorFlow 2.15, PyTorch 2.1
- **Librerías ML**:
  - `deepface`: Análisis facial
  - `transformers`: Modelos NLP
  - `librosa`: Procesamiento de audio

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5
- **HTTP Client**: Axios
- **UI**: CSS3 puro + Lucide Icons

### Infraestructura
- **Base de datos**: PostgreSQL 15
- **Cache**: Redis 7
- **Contenedores**: Docker + Docker Compose
- **Orquestación**: Kubernetes (opcional)

## Modelos de Machine Learning

### 1. Análisis Facial (DeepFace)
```python
# Backend: services/facial/main.py
DeepFace.analyze(
    img_path=image,
    actions=['emotion'],
    enforce_detection=True,
    detector_backend='opencv'
)
```

**Arquitectura**:
- Detector: OpenCV Haar Cascade
- Modelo base: VGG-Face / FaceNet
- Output: 7 emociones con probabilidades

**Emociones detectadas**:
- happy, sad, angry, fear, surprise, disgust, neutral

### 2. Análisis de Voz (Wav2Vec2)
```python
# Backend: services/voice/main.py
emotion_classifier = pipeline(
    "audio-classification",
    model="ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition"
)
```

**Arquitectura**:
- Preprocesamiento: Librosa (MFCC features)
- Sample rate: 16kHz
- Modelo: Wav2Vec2 Large (XLSR-53)
- Fine-tuned en: RAVDESS, CREMA-D, TESS

**Pipeline**:
1. Cargar audio → 2. Resample 16kHz → 3. Extraer features → 4. Clasificar

### 3. Análisis de Texto (BERT)
```python
# Backend: services/text/main.py
# Español
spanish_classifier = pipeline(
    "text-classification",
    model="finiteautomata/beto-sentiment-analysis"
)

# Inglés
multilingual_classifier = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base"
)
```

**Arquitectura**:
- BETO (español): BERT base español (110M params)
- DistilRoBERTa (inglés): RoBERTa destilado (66M params)
- Tokenización: WordPiece
- Max tokens: 512

**Detección de idioma**:
```python
def detect_language(text: str) -> str:
    # Heurística basada en palabras comunes
    spanish_words = {'el', 'la', 'de', 'que', 'y', ...}
    english_words = {'the', 'be', 'to', 'of', 'and', ...}
    # Retorna: 'es' o 'en'
```

### 4. Fusión Multimodal
```python
# Backend: services/fusion/main.py
def weighted_fusion(results: dict, weights: dict) -> dict:
    """
    Fusión ponderada por confianza
    
    weights adaptativo:
    w_i = confidence_i / Σ(confidence_j)
    
    emotion_score = Σ(w_i * score_i)
    """
    fused_emotions = {}
    for modality, result in results.items():
        weight = weights[modality]
        for emotion, score in result['all_emotions'].items():
            fused_emotions[emotion] += score * weight
    return fused_emotions
```

**Estrategias de fusión**:
1. **Early Fusion**: Concatenar features (no usado)
2. **Late Fusion**: Combinar predicciones (✓ implementado)
3. **Hybrid Fusion**: Combinación de ambas (futuro)

**Ponderación adaptativa**:
- Peso proporcional a la confianza de cada modalidad
- Normalización: suma de pesos = 1.0
- Emoción final: argmax(fused_emotions)

## API Endpoints

### Facial Service (8001)
```
POST /analyze/face
Content-Type: multipart/form-data

Request:
- file: Image (jpg, png)

Response:
{
  "emotion": "happy",
  "confidence": 0.87,
  "all_emotions": {"happy": 0.87, "neutral": 0.10, ...},
  "face_detected": true,
  "processing_time": 0.45
}
```

### Voice Service (8002)
```
POST /analyze/voice
Content-Type: multipart/form-data

Request:
- file: Audio (wav, mp3)

Response:
{
  "emotion": "sad",
  "confidence": 0.75,
  "all_emotions": {"sad": 0.75, "neutral": 0.15, ...},
  "audio_duration": 3.2,
  "sample_rate": 16000,
  "processing_time": 1.2
}
```

### Text Service (8003)
```
POST /analyze/text
Content-Type: application/json

Request:
{
  "text": "Me siento muy feliz hoy",
  "language": "auto"  // "es", "en", "auto"
}

Response:
{
  "emotion": "happy",
  "confidence": 0.92,
  "all_emotions": {"happy": 0.92, "neutral": 0.05, ...},
  "text_length": 25,
  "detected_language": "es",
  "processing_time": 0.15
}
```

### Fusion Service (8004)
```
POST /analyze/multimodal
Content-Type: multipart/form-data

Request:
- image: Image (optional)
- audio: Audio (optional)
- text: string (optional)
- language: string (default: "auto")

Response:
{
  "final_emotion": "happy",
  "final_confidence": 0.85,
  "all_emotions": {"happy": 0.85, "neutral": 0.10, ...},
  "facial_result": {...},
  "voice_result": {...},
  "text_result": {...},
  "modalities_used": ["facial", "text"],
  "fusion_method": "weighted_by_confidence",
  "total_processing_time": 1.8,
  "timestamp": "2025-11-25T10:30:00Z"
}
```

## Flujo de Datos

### Análisis Multimodal Completo

1. **Frontend**: Usuario sube imagen + audio + texto
2. **Fusion Service**: Recibe request multimodal
3. **Parallel Processing**:
   ```
   ┌─→ Facial Service → DeepFace → emotion_1
   ├─→ Voice Service  → Wav2Vec2 → emotion_2
   └─→ Text Service   → BERT     → emotion_3
   ```
4. **Fusion Algorithm**:
   ```python
   weights = {
       'facial': conf_1,
       'voice': conf_2,
       'text': conf_3
   }
   final_emotion = weighted_average(emotions, weights)
   ```
5. **Response**: Retorna resultado fusionado al frontend

## Optimizaciones

### Cache (Redis)
```python
# Futuro: Cache de predicciones
@cache.memoize(timeout=3600)
def predict_emotion(image_hash):
    return model.predict(image)
```

### Batch Processing
```python
# Futuro: Procesar múltiples inputs
async def analyze_batch(images: List[Image]):
    predictions = await model.predict_batch(images)
    return predictions
```

### Model Loading
```python
# Carga lazy al inicio
@app.on_event("startup")
async def load_models():
    global emotion_classifier
    emotion_classifier = pipeline("audio-classification", ...)
```

## Seguridad

### Validaciones
- Tamaño máximo de archivos: 10MB
- Tipos MIME validados
- Rate limiting (futuro)
- Authentication (futuro)

### CORS
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Performance

### Tiempos de Respuesta
- Facial: ~0.3-0.8s
- Voice: ~1.0-2.0s
- Text: ~0.1-0.3s
- Multimodal: ~1.5-3.0s (paralelo)

### Optimizaciones Futuras
- [ ] TensorRT para inferencia GPU
- [ ] Quantización de modelos
- [ ] Kubernetes horizontal scaling
- [ ] Load balancing con Nginx

## Monitoreo

### Health Checks
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "facial-analysis",
        "model_loaded": model is not None
    }
```

### Logging
```python
from loguru import logger

logger.add(
    "logs/app_{time}.log",
    rotation="500 MB",
    retention="10 days"
)
```

## Deployment

### Docker
```bash
docker-compose up --build
```

### Kubernetes (futuro)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: facial-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: facial-service
  template:
    spec:
      containers:
      - name: facial
        image: emotions/facial:latest
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
```

## Testing

### Unit Tests
```bash
cd backend
pytest tests/ -v
```

### Integration Tests
```python
async def test_multimodal_analysis():
    response = await client.post(
        "/analyze/multimodal",
        files={"image": image, "audio": audio},
        data={"text": "test"}
    )
    assert response.status_code == 200
    assert "final_emotion" in response.json()
```

## Referencias

- [DeepFace](https://github.com/serengil/deepface)
- [Wav2Vec2](https://huggingface.co/docs/transformers/model_doc/wav2vec2)
- [BERT](https://huggingface.co/docs/transformers/model_doc/bert)
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
