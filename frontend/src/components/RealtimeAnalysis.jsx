import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Square, Activity, TrendingUp } from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';
import './RealtimeAnalysis.css';

const FRAME_INTERVAL = 1000; // Analizar cada 1 segundo

const emotionColors = {
  happy: '#4CAF50',
  sad: '#2196F3',
  angry: '#F44336',
  neutral: '#9E9E9E',
  surprise: '#FF9800',
  fear: '#9C27B0',
  disgust: '#795548',
};

const emotionEmojis = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  neutral: '😐',
  surprise: '😮',
  fear: '😨',
  disgust: '🤢',
};

const emotionNames = {
  happy: 'Feliz',
  sad: 'Triste',
  angry: 'Enojado',
  neutral: 'Neutral',
  surprise: 'Sorprendido',
  fear: 'Miedo',
  disgust: 'Disgusto',
};

const RealtimeAnalysis = () => {
  const { isConnected, subscribe, sendMessage } = useWebSocket();
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const frameIntervalRef = useRef(null);
  
  const [isActive, setIsActive] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [fps, setFps] = useState(0);

  // Suscribirse a mensajes de facial
  useEffect(() => {
    const unsubscribe = subscribe('facial', (data) => {
      if (data.type === 'analysis_result') {
        const result = data.result;
        setCurrentEmotion(result.emotion);
        setConfidence(result.confidence);
        
        // Agregar al historial (mantener últimos 30)
        setEmotionHistory(prev => {
          const newHistory = [...prev, {
            emotion: result.emotion,
            confidence: result.confidence,
            timestamp: Date.now(),
            emotions: result.all_emotions
          }];
          return newHistory.slice(-30);
        });
      }
    });

    return unsubscribe;
  }, [subscribe]);

  // Iniciar cámara
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setIsActive(true);
      
      // Iniciar captura de frames
      frameIntervalRef.current = setInterval(() => {
        captureAndAnalyzeFrame();
      }, FRAME_INTERVAL);
      
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      alert('No se pudo acceder a la cámara: ' + error.message);
    }
  };

  // Capturar y analizar frame
  const captureAndAnalyzeFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0);
    
    // Convertir a base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Enviar a través de WebSocket compartido
    sendMessage({
      type: 'analyze_frame',
      image: imageData
    });
  };

  // Detener análisis
  const stopAnalysis = () => {
    // Detener cámara
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    
    // Detener interval
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }
    
    setIsActive(false);
  };

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopAnalysis();
    };
  }, []);

  return (
    <div className="realtime-container">
      <div className="realtime-header">
        <Activity size={28} />
        <h2>Análisis en Tiempo Real</h2>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </div>
      </div>

      <div className="realtime-content">
        {/* Video con overlay */}
        <div className="video-section">
          <div className="video-container">
            <video ref={videoRef} autoPlay playsInline muted className="video-feed" />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {/* Overlay de emoción */}
            {isActive && currentEmotion && (
              <div className="emotion-overlay">
                <div className="emotion-badge">
                  <span className="emotion-emoji">{emotionEmojis[currentEmotion]}</span>
                  <span className="emotion-text">{emotionNames[currentEmotion]}</span>
                  <span className="emotion-confidence">{(confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="video-controls">
            {!isActive ? (
              <button className="btn-start" onClick={startCamera}>
                <Camera size={24} />
                Iniciar Análisis en Tiempo Real
              </button>
            ) : (
              <button className="btn-stop" onClick={stopAnalysis}>
                <Square size={24} />
                Detener Análisis
              </button>
            )}
          </div>
        </div>

        {/* Panel de estadísticas */}
        <div className="stats-section">
          <div className="stats-card">
            <h3>
              <TrendingUp size={20} />
              Estadísticas en Vivo
            </h3>
            
            {emotionHistory.length > 0 && (
              <>
                {/* Distribución actual */}
                <div className="current-distribution">
                  <h4>Distribución Actual</h4>
                  {Object.entries(emotionHistory[emotionHistory.length - 1]?.emotions || {})
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([emotion, score]) => (
                      <div key={emotion} className="emotion-stat">
                        <div className="stat-label">
                          <span>{emotionEmojis[emotion]}</span>
                          <span>{emotionNames[emotion]}</span>
                        </div>
                        <div className="stat-bar-container">
                          <div
                            className="stat-bar"
                            style={{
                              width: `${score * 100}%`,
                              backgroundColor: emotionColors[emotion]
                            }}
                          />
                        </div>
                        <span className="stat-value">{(score * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                </div>

                {/* Historial mini */}
                <div className="emotion-timeline">
                  <h4>Historial Reciente</h4>
                  <div className="timeline-dots">
                    {emotionHistory.slice(-20).map((item, idx) => (
                      <div
                        key={idx}
                        className="timeline-dot"
                        style={{ backgroundColor: emotionColors[item.emotion] }}
                        title={`${emotionNames[item.emotion]} - ${(item.confidence * 100).toFixed(0)}%`}
                      />
                    ))}
                  </div>
                </div>

                {/* Métricas */}
                <div className="metrics">
                  <div className="metric">
                    <span className="metric-label">Frames Analizados</span>
                    <span className="metric-value">{emotionHistory.length}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Confianza Promedio</span>
                    <span className="metric-value">
                      {(emotionHistory.reduce((sum, item) => sum + item.confidence, 0) / emotionHistory.length * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </>
            )}

            {emotionHistory.length === 0 && isActive && (
              <div className="empty-state">
                <p>Esperando análisis...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeAnalysis;
