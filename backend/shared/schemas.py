from pydantic import BaseModel, Field
from typing import Dict, Optional, List
from datetime import datetime


class EmotionResult(BaseModel):
    """Resultado de análisis de una modalidad"""
    emotion: str = Field(..., description="Emoción dominante detectada")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confianza de la predicción")
    all_emotions: Dict[str, float] = Field(..., description="Distribución de todas las emociones")
    processing_time: float = Field(..., description="Tiempo de procesamiento en segundos")


class FacialAnalysisRequest(BaseModel):
    """Request para análisis facial"""
    # El archivo se envía como multipart/form-data


class FacialAnalysisResponse(EmotionResult):
    """Respuesta de análisis facial"""
    face_detected: bool = Field(..., description="Si se detectó un rostro")
    face_region: Optional[Dict[str, int]] = Field(None, description="Región del rostro detectado")


class VoiceAnalysisRequest(BaseModel):
    """Request para análisis de voz"""
    # El archivo de audio se envía como multipart/form-data


class VoiceAnalysisResponse(EmotionResult):
    """Respuesta de análisis de voz"""
    audio_duration: float = Field(..., description="Duración del audio en segundos")
    sample_rate: int = Field(..., description="Sample rate del audio")


class TextAnalysisRequest(BaseModel):
    """Request para análisis de texto"""
    text: str = Field(..., min_length=1, max_length=5000, description="Texto a analizar")
    language: Optional[str] = Field("auto", description="Idioma del texto (auto, es, en)")


class TextAnalysisResponse(EmotionResult):
    """Respuesta de análisis de texto"""
    text_length: int = Field(..., description="Longitud del texto")
    detected_language: str = Field(..., description="Idioma detectado")


class MultimodalAnalysisRequest(BaseModel):
    """Request para análisis multimodal"""
    # Los archivos se envían como multipart/form-data
    text: Optional[str] = None
    language: Optional[str] = "auto"


class MultimodalAnalysisResponse(BaseModel):
    """Respuesta de análisis multimodal fusionado"""
    final_emotion: str = Field(..., description="Emoción final tras fusión")
    final_confidence: float = Field(..., ge=0.0, le=1.0, description="Confianza final")
    all_emotions: Dict[str, float] = Field(..., description="Distribución final de emociones")
    
    # Resultados individuales
    facial_result: Optional[FacialAnalysisResponse] = None
    voice_result: Optional[VoiceAnalysisResponse] = None
    text_result: Optional[TextAnalysisResponse] = None
    
    # Metadata
    modalities_used: List[str] = Field(..., description="Modalidades utilizadas")
    fusion_method: str = Field(..., description="Método de fusión utilizado")
    total_processing_time: float = Field(..., description="Tiempo total de procesamiento")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class HealthResponse(BaseModel):
    """Respuesta de health check"""
    status: str = "healthy"
    service: str
    version: str = "1.0.0"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    """Respuesta de error"""
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
