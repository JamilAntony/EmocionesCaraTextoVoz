from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
import time
import sys
import os

# Agregar el directorio padre al path para imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from shared.schemas import TextAnalysisRequest, TextAnalysisResponse, HealthResponse
from shared.utils import get_logger

logger = get_logger()

app = FastAPI(
    title="Text Emotion Analysis Service",
    description="Microservicio para análisis de emociones en texto usando BERT",
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

# Modelos (se cargan al iniciar)
spanish_classifier = None
multilingual_classifier = None


def load_models():
    global spanish_classifier, multilingual_classifier
    try:
        logger.info("Cargando modelos de análisis de texto...")
        
        # Modelo BETO para español
        spanish_classifier = pipeline(
            "text-classification",
            model="finiteautomata/beto-sentiment-analysis",
            top_k=None
        )
        
        # Modelo multilingüe (alternativo)
        multilingual_classifier = pipeline(
            "text-classification",
            model="j-hartmann/emotion-english-distilroberta-base",
            top_k=None
        )
        
        logger.info("Modelos de texto cargados exitosamente")
    except Exception as e:
        logger.error(f"Error al cargar modelos: {str(e)}")


@app.on_event("startup")
async def startup_event():
    """Cargar modelos al iniciar"""
    load_models()


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    model_status = "loaded" if spanish_classifier and multilingual_classifier else "not_loaded"
    return HealthResponse(
        status="healthy" if spanish_classifier and multilingual_classifier else "degraded",
        service=f"text-analysis (models: {model_status})"
    )


def detect_language(text: str) -> str:
    """Detección simple de idioma"""
    spanish_words = {'el', 'la', 'de', 'que', 'y', 'es', 'en', 'un', 'por', 'para', 'con', 'no', 'una', 'su', 'se'}
    english_words = {'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with'}
    
    words = set(text.lower().split())
    
    spanish_count = len(words.intersection(spanish_words))
    english_count = len(words.intersection(english_words))
    
    if spanish_count > english_count:
        return "es"
    elif english_count > spanish_count:
        return "en"
    else:
        return "en"  # Default a inglés


def map_emotion(label: str, score: float) -> tuple[str, dict]:
    """Mapea las etiquetas del modelo a nuestras categorías de emociones"""
    # Mapeo de sentimientos a emociones
    emotion_mapping = {
        'POS': 'happy',
        'NEG': 'sad',
        'NEU': 'neutral',
        'joy': 'happy',
        'anger': 'angry',
        'sadness': 'sad',
        'fear': 'fear',
        'surprise': 'surprise',
        'disgust': 'disgust',
        'neutral': 'neutral'
    }
    
    return emotion_mapping.get(label.lower(), 'neutral')


@app.post("/analyze/text", response_model=TextAnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
    """
    Analiza emociones en texto
    
    Args:
        request: Texto a analizar y configuración
    
    Returns:
        Análisis de emociones en texto con confianza
    """
    start_time = time.time()
    
    if not spanish_classifier or not multilingual_classifier:
        raise HTTPException(status_code=503, detail="Modelos no disponibles")
    
    try:
        text = request.text
        language = request.language
        
        # Detectar idioma si es automático
        if language == "auto":
            language = detect_language(text)
        
        logger.info(f"Analizando texto ({language}): {text[:50]}...")
        
        # Seleccionar modelo según idioma
        if language == "es":
            predictions = spanish_classifier(text)[0]
        else:
            predictions = multilingual_classifier(text)[0]
        
        # Procesar predicciones
        all_emotions = {}
        for pred in predictions:
            label = pred['label']
            score = pred['score']
            
            # Mapear a emoción
            emotion = map_emotion(label, score)
            
            # Acumular si ya existe
            if emotion in all_emotions:
                all_emotions[emotion] += score
            else:
                all_emotions[emotion] = score
        
        # Normalizar si es necesario
        total = sum(all_emotions.values())
        if total > 1.0:
            all_emotions = {k: v / total for k, v in all_emotions.items()}
        
        # Emoción dominante
        dominant_emotion = max(all_emotions, key=all_emotions.get)
        confidence = all_emotions[dominant_emotion]
        
        processing_time = time.time() - start_time
        
        logger.info(f"Emoción detectada: {dominant_emotion} ({confidence:.2f})")
        
        return TextAnalysisResponse(
            emotion=dominant_emotion,
            confidence=confidence,
            all_emotions=all_emotions,
            processing_time=processing_time,
            text_length=len(text),
            detected_language=language
        )
        
    except Exception as e:
        logger.error(f"Error al analizar texto: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar el texto: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
