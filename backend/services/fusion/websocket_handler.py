"""
WebSocket handler para análisis en tiempo real
"""
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
import asyncio
import json
import httpx
from datetime import datetime
import base64
import io
from PIL import Image

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from shared.config import get_settings
from shared.utils import get_logger

logger = get_logger()
settings = get_settings()


class ConnectionManager:
    """Administrador de conexiones WebSocket"""
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Nueva conexión WebSocket. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"Conexión cerrada. Total: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass


manager = ConnectionManager()


async def analyze_frame_realtime(image_data: str) -> dict:
    """
    Analiza un frame de imagen en tiempo real
    
    Args:
        image_data: Imagen en base64
    
    Returns:
        Resultado del análisis facial
    """
    try:
        # Decodificar imagen base64
        image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            files = {"file": ("frame.jpg", image_bytes, "image/jpeg")}
            response = await client.post(
                f"{settings.facial_service_url}/analyze/face",
                files=files
            )
            response.raise_for_status()
            return response.json()
    
    except Exception as e:
        logger.error(f"Error en análisis de frame: {str(e)}")
        return None


async def analyze_audio_realtime(audio_data: str) -> dict:
    """
    Analiza un chunk de audio en tiempo real
    
    Args:
        audio_data: Audio en base64
    
    Returns:
        Resultado del análisis de voz
    """
    try:
        # Decodificar audio base64
        audio_bytes = base64.b64decode(audio_data.split(',')[1] if ',' in audio_data else audio_data)
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            files = {"file": ("audio_chunk.webm", audio_bytes, "audio/webm")}
            response = await client.post(
                f"{settings.voice_service_url}/analyze/voice",
                files=files
            )
            response.raise_for_status()
            return response.json()
    
    except Exception as e:
        logger.error(f"Error en análisis de audio: {str(e)}")
        return None


async def analyze_text_realtime(text: str, language: str = "auto") -> dict:
    """
    Analiza texto en tiempo real
    
    Args:
        text: Texto a analizar
        language: Idioma del texto
    
    Returns:
        Resultado del análisis de texto
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.text_service_url}/analyze/text",
                json={"text": text, "language": language}
            )
            response.raise_for_status()
            return response.json()
    
    except Exception as e:
        logger.error(f"Error en análisis de texto: {str(e)}")
        return None


async def handle_websocket_message(websocket: WebSocket, data: dict):
    """
    Maneja mensajes entrantes del WebSocket
    
    Args:
        websocket: Conexión WebSocket
        data: Datos del mensaje
    """
    message_type = data.get("type")
    
    if message_type == "analyze_frame":
        # Análisis de frame de video
        image_data = data.get("image")
        if image_data:
            result = await analyze_frame_realtime(image_data)
            if result:
                await manager.send_personal_message({
                    "type": "analysis_result",
                    "modality": "facial",
                    "result": result,
                    "timestamp": datetime.utcnow().isoformat()
                }, websocket)
    
    elif message_type == "analyze_audio":
        # Análisis de audio en tiempo real
        audio_data = data.get("audio")
        if audio_data:
            logger.info("Procesando análisis de audio en tiempo real...")
            result = await analyze_audio_realtime(audio_data)
            if result:
                logger.info(f"Enviando resultado de audio: {result.get('emotion')} ({result.get('confidence'):.2f})")
                await manager.send_personal_message({
                    "type": "analysis_result",
                    "modality": "voice",
                    "result": result,
                    "timestamp": datetime.utcnow().isoformat()
                }, websocket)
            else:
                logger.warning("No se obtuvo resultado del análisis de audio")
                await manager.send_personal_message({
                    "type": "error",
                    "modality": "voice",
                    "message": "Error al analizar audio",
                    "timestamp": datetime.utcnow().isoformat()
                }, websocket)
    
    elif message_type == "analyze_text":
        # Análisis de texto en tiempo real
        text = data.get("text")
        language = data.get("language", "auto")
        if text and len(text.strip()) > 5:
            result = await analyze_text_realtime(text, language)
            if result:
                await manager.send_personal_message({
                    "type": "analysis_result",
                    "modality": "text",
                    "result": result,
                    "timestamp": datetime.utcnow().isoformat()
                }, websocket)
    
    elif message_type == "ping":
        # Keepalive
        await manager.send_personal_message({
            "type": "pong",
            "timestamp": datetime.utcnow().isoformat()
        }, websocket)


async def websocket_endpoint(websocket: WebSocket):
    """
    Endpoint principal de WebSocket para análisis en tiempo real
    
    Args:
        websocket: Conexión WebSocket
    """
    await manager.connect(websocket)
    
    try:
        # Enviar mensaje de bienvenida
        await manager.send_personal_message({
            "type": "connected",
            "message": "Conectado al servicio de análisis en tiempo real",
            "timestamp": datetime.utcnow().isoformat()
        }, websocket)
        
        # Loop de recepción de mensajes
        while True:
            # Recibir datos
            data = await websocket.receive_json()
            
            # Procesar mensaje
            await handle_websocket_message(websocket, data)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Cliente desconectado")
    
    except Exception as e:
        logger.error(f"Error en WebSocket: {str(e)}")
        manager.disconnect(websocket)
