from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
import librosa
import numpy as np
import io
import time
import sys
import os
import soundfile as sf
import tempfile
from pathlib import Path
import subprocess
import shutil

# Agregar el directorio padre al path para imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from shared.schemas import VoiceAnalysisResponse, HealthResponse
from shared.utils import get_logger

logger = get_logger()

app = FastAPI(
    title="Voice Emotion Analysis Service",
    description="Microservicio para análisis de emociones en voz usando Wav2Vec2",
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

# Cargar modelo (se carga una vez al iniciar el servicio)
logger.info("Cargando modelo de reconocimiento de emociones en voz...")
emotion_classifier = None


def load_model():
    global emotion_classifier
    try:
        # Modelo pre-entrenado para reconocimiento de emociones en voz
        emotion_classifier = pipeline(
            "audio-classification",
            model="ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition"
        )
        logger.info("Modelo de voz cargado exitosamente")
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
        service=f"voice-analysis (model: {model_status})"
    )


@app.post("/analyze/voice", response_model=VoiceAnalysisResponse)
async def analyze_voice(file: UploadFile = File(...)):
    """
    Analiza emociones en un archivo de audio
    
    Args:
        file: Archivo de audio (wav, mp3, etc.)
    
    Returns:
        Análisis de emociones en voz con confianza
    """
    start_time = time.time()
    
    if emotion_classifier is None:
        raise HTTPException(status_code=503, detail="Modelo no disponible")
    
    try:
        # Validar tipo de archivo
        valid_types = ['audio/', 'video/webm']  # webm puede venir como video/webm
        if not any(file.content_type.startswith(t) for t in valid_types):
            raise HTTPException(status_code=400, detail="El archivo debe ser un audio válido")
        
        # Leer audio
        contents = await file.read()
        
        logger.info(f"Procesando audio: {file.filename}, tipo: {file.content_type}")
        
        # Para formatos que requieren FFmpeg (webm, mp3, etc), guardar temporalmente
        temp_file = None
        try:
            # Determinar extensión del archivo
            file_ext = Path(file.filename).suffix if file.filename else '.webm'
            if not file_ext:
                file_ext = '.webm' if 'webm' in file.content_type else '.wav'
            
            # Crear archivo temporal para el audio de entrada
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_input:
                temp_input.write(contents)
                temp_input_path = temp_input.name
            
            logger.info(f"Archivo temporal de entrada creado: {temp_input_path}")
            
            # Si es WebM, convertir a WAV usando FFmpeg directamente
            if 'webm' in file.content_type or file_ext == '.webm':
                # Crear archivo WAV temporal
                temp_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
                temp_wav_path = temp_wav.name
                temp_wav.close()
                
                logger.info(f"Convirtiendo WebM a WAV: {temp_wav_path}")
                
                # Buscar FFmpeg en el PATH
                ffmpeg_path = shutil.which('ffmpeg')
                if not ffmpeg_path:
                    # Intentar rutas comunes de instalación
                    possible_paths = [
                        r'C:\ProgramData\chocolatey\bin\ffmpeg.exe',
                        r'C:\Program Files\ffmpeg\bin\ffmpeg.exe',
                        r'C:\ffmpeg\bin\ffmpeg.exe',
                        'ffmpeg'  # Intentar sin ruta como último recurso
                    ]
                    for path in possible_paths:
                        if os.path.exists(path) or path == 'ffmpeg':
                            ffmpeg_path = path
                            break
                
                logger.info(f"Usando FFmpeg: {ffmpeg_path}")
                
                # Convertir con FFmpeg
                result = subprocess.run([
                    ffmpeg_path, '-i', temp_input_path,
                    '-ar', '16000',  # Sample rate 16kHz
                    '-ac', '1',      # Mono
                    '-y',            # Sobrescribir
                    temp_wav_path
                ], capture_output=True, text=True, creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)
                
                if result.returncode != 0:
                    logger.error(f"Error en FFmpeg: {result.stderr}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"FFmpeg no está instalado o no se puede ejecutar. Por favor instala FFmpeg: choco install ffmpeg"
                    )
                
                temp_path = temp_wav_path
            else:
                temp_path = temp_input_path
            
            # Cargar audio con librosa desde el archivo WAV
            audio, sample_rate = librosa.load(temp_path, sr=16000)
            duration = len(audio) / sample_rate
            
            logger.info(f"Audio cargado: {duration:.2f}s, {sample_rate}Hz")
            
        except Exception as e:
            logger.error(f"Error al cargar audio: {str(e)}")
            raise HTTPException(
                status_code=500, 
                detail=f"No se pudo procesar el archivo de audio: {str(e)}"
            )
        finally:
            # Limpiar archivos temporales
            try:
                if 'temp_input_path' in locals() and os.path.exists(temp_input_path):
                    os.unlink(temp_input_path)
                if 'temp_wav_path' in locals() and os.path.exists(temp_wav_path):
                    os.unlink(temp_wav_path)
            except Exception as cleanup_error:
                logger.warning(f"Error al limpiar archivos temporales: {cleanup_error}")
        
        logger.info(f"Audio cargado: {duration:.2f}s, {sample_rate}Hz")
        
        # Analizar con el modelo
        predictions = emotion_classifier(audio, sampling_rate=sample_rate)
        
        # Mapeo de emociones del modelo a nuestras categorías
        emotion_mapping = {
            'angry': 'angry',
            'disgust': 'disgust',
            'fear': 'fear',
            'happy': 'happy',
            'neutral': 'neutral',
            'sad': 'sad',
            'surprise': 'surprise'
        }
        
        # Procesar predicciones
        all_emotions = {}
        for pred in predictions:
            label = pred['label'].lower()
            score = pred['score']
            
            # Mapear emoción
            mapped_emotion = emotion_mapping.get(label, label)
            all_emotions[mapped_emotion] = score
        
        # Emoción dominante
        dominant_emotion = max(all_emotions, key=all_emotions.get)
        confidence = all_emotions[dominant_emotion]
        
        processing_time = time.time() - start_time
        
        logger.info(f"Emoción detectada: {dominant_emotion} ({confidence:.2f})")
        
        return VoiceAnalysisResponse(
            emotion=dominant_emotion,
            confidence=confidence,
            all_emotions=all_emotions,
            processing_time=processing_time,
            audio_duration=duration,
            sample_rate=sample_rate
        )
        
    except Exception as e:
        logger.error(f"Error al analizar audio: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar el audio: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
