from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
from PIL import Image
import io
import time
import sys
import os

# Agregar el directorio padre al path para imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from shared.schemas import FacialAnalysisResponse, HealthResponse, ErrorResponse
from shared.utils import get_logger

logger = get_logger()

app = FastAPI(
    title="Facial Emotion Analysis Service",
    description="Microservicio para análisis de emociones faciales",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cargar modelo
emotion_classifier = None

def load_model():
    global emotion_classifier
    try:
        logger.info("Cargando modelo de reconocimiento facial de emociones...")
        # Modelo pre-entrenado específico para emociones en imágenes
        emotion_classifier = pipeline(
            "image-classification",
            model="dima806/facial_emotions_image_detection"
        )
        logger.info("Modelo facial cargado exitosamente")
    except Exception as e:
        logger.error(f"Error al cargar modelo: {str(e)}")
        emotion_classifier = None


@app.on_event("startup")
async def startup_event():
    """Cargar modelo al iniciar"""
    load_model()


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    model_status = "loaded" if emotion_classifier is not None else "not_loaded"
    return HealthResponse(
        status="healthy" if emotion_classifier else "degraded",
        service=f"facial-analysis (model: {model_status})"
    )


@app.post("/analyze/face", response_model=FacialAnalysisResponse)
async def analyze_face(file: UploadFile = File(...)):
    """
    Analiza emociones en una imagen facial
    
    Args:
        file: Imagen (jpg, png, etc.)
    
    Returns:
        Análisis de emociones faciales con confianza
    """
    start_time = time.time()
    
    if emotion_classifier is None:
        raise HTTPException(status_code=503, detail="Modelo no disponible")
    
    try:
        # Validar tipo de archivo
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")
        
        # Leer imagen
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        logger.info(f"Procesando imagen: {file.filename}")
        
        # Analizar con el modelo
        predictions = emotion_classifier(image)
        
        # Procesar resultados
        all_emotions = {}
        for pred in predictions:
            label = pred['label'].lower()
            score = pred['score']
            all_emotions[label] = score
        
        # Emoción dominante
        dominant_emotion = max(all_emotions, key=all_emotions.get)
        confidence = all_emotions[dominant_emotion]
        
        processing_time = time.time() - start_time
        
        logger.info(f"Emoción detectada: {dominant_emotion} ({confidence:.2f})")
        
        return FacialAnalysisResponse(
            emotion=dominant_emotion,
            confidence=confidence,
            all_emotions=all_emotions,
            processing_time=processing_time,
            face_detected=True,
            face_region=None
        )
        
    except Exception as e:
        logger.error(f"Error al analizar imagen: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar la imagen: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
