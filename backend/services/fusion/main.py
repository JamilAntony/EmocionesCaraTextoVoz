from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
from typing import Optional
import time
from datetime import datetime
import sys
import os

# Agregar el directorio padre al path para imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from shared.schemas import (
    MultimodalAnalysisResponse,
    FacialAnalysisResponse,
    VoiceAnalysisResponse,
    TextAnalysisResponse,
    HealthResponse
)
from shared.config import get_settings
from shared.utils import get_logger

logger = get_logger()
settings = get_settings()

app = FastAPI(
    title="Multimodal Fusion Service",
    description="Microservicio para fusión de análisis multimodal de emociones",
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


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        service="fusion"
    )


def weighted_fusion(results: dict, weights: dict = None) -> dict:
    """
    Fusión ponderada de resultados de múltiples modalidades
    
    Args:
        results: Dict con resultados de cada modalidad
        weights: Pesos para cada modalidad (default: iguales)
    
    Returns:
        Distribución de emociones fusionada
    """
    if weights is None:
        # Pesos iguales por defecto
        n_modalities = len(results)
        weights = {k: 1.0 / n_modalities for k in results.keys()}
    
    # Normalizar pesos
    total_weight = sum(weights.values())
    weights = {k: v / total_weight for k, v in weights.items()}
    
    # Fusionar emociones
    fused_emotions = {}
    
    for modality, result in results.items():
        weight = weights[modality]
        
        for emotion, score in result['all_emotions'].items():
            if emotion not in fused_emotions:
                fused_emotions[emotion] = 0.0
            fused_emotions[emotion] += score * weight
    
    return fused_emotions


@app.post("/analyze/multimodal", response_model=MultimodalAnalysisResponse)
async def analyze_multimodal(
    image: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    language: Optional[str] = Form("auto")
):
    """
    Análisis multimodal de emociones con fusión de resultados
    
    Args:
        image: Imagen facial (opcional)
        audio: Archivo de audio (opcional)
        text: Texto a analizar (opcional)
        language: Idioma del texto (auto, es, en)
    
    Returns:
        Resultado fusionado de todas las modalidades
    """
    start_time = time.time()
    
    # Validar que al menos una modalidad esté presente
    if not any([image, audio, text]):
        raise HTTPException(
            status_code=400,
            detail="Debe proporcionar al menos una modalidad (imagen, audio o texto)"
        )
    
    results = {}
    modalities_used = []
    
    # Resultados individuales
    facial_result = None
    voice_result = None
    text_result = None
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        
        # Análisis facial
        if image:
            try:
                logger.info("Enviando imagen para análisis facial...")
                image_bytes = await image.read()
                files = {"file": (image.filename, image_bytes, image.content_type)}
                
                response = await client.post(
                    f"{settings.facial_service_url}/analyze/face",
                    files=files
                )
                response.raise_for_status()
                
                facial_result = FacialAnalysisResponse(**response.json())
                results['facial'] = facial_result.dict()
                modalities_used.append("facial")
                logger.info(f"Análisis facial completado: {facial_result.emotion}")
                
            except Exception as e:
                logger.error(f"Error en análisis facial: {str(e)}")
                logger.exception(e)  # Traceback completo
        
        # Análisis de voz
        if audio:
            try:
                logger.info("Enviando audio para análisis de voz...")
                audio_bytes = await audio.read()
                files = {"file": (audio.filename, audio_bytes, audio.content_type)}
                
                response = await client.post(
                    f"{settings.voice_service_url}/analyze/voice",
                    files=files
                )
                response.raise_for_status()
                
                voice_result = VoiceAnalysisResponse(**response.json())
                results['voice'] = voice_result.dict()
                modalities_used.append("voice")
                logger.info(f"Análisis de voz completado: {voice_result.emotion}")
                
            except Exception as e:
                logger.error(f"Error en análisis de voz: {str(e)}")
                logger.exception(e)  # Traceback completo
        
        # Análisis de texto
        if text and text.strip():
            try:
                logger.info("Enviando texto para análisis...")
                
                response = await client.post(
                    f"{settings.text_service_url}/analyze/text",
                    json={"text": text, "language": language}
                )
                response.raise_for_status()
                
                text_result = TextAnalysisResponse(**response.json())
                results['text'] = text_result.dict()
                modalities_used.append("text")
                logger.info(f"Análisis de texto completado: {text_result.emotion}")
                
            except Exception as e:
                logger.error(f"Error en análisis de texto: {str(e)}")
                logger.exception(e)  # Traceback completo
    
    # Validar que al menos un análisis fue exitoso
    if not results:
        error_msg = "No se pudo completar ningún análisis. Verifica los logs de los servicios individuales."
        logger.error(error_msg)
        raise HTTPException(
            status_code=500,
            detail=error_msg
        )
    
    # Fusión de resultados
    logger.info(f"Fusionando resultados de {len(results)} modalidades...")
    
    # Pesos adaptativos basados en confianza
    weights = {}
    for modality, result in results.items():
        weights[modality] = result['confidence']
    
    # Fusionar emociones
    fused_emotions = weighted_fusion(results, weights)
    
    # Emoción final
    final_emotion = max(fused_emotions, key=fused_emotions.get)
    final_confidence = fused_emotions[final_emotion]
    
    total_time = time.time() - start_time
    
    logger.info(f"Emoción final: {final_emotion} ({final_confidence:.2f})")
    
    return MultimodalAnalysisResponse(
        final_emotion=final_emotion,
        final_confidence=final_confidence,
        all_emotions=fused_emotions,
        facial_result=facial_result,
        voice_result=voice_result,
        text_result=text_result,
        modalities_used=modalities_used,
        fusion_method="weighted_by_confidence",
        total_processing_time=total_time,
        timestamp=datetime.utcnow()
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
