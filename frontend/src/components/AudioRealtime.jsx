import React, { useRef, useState, useEffect } from 'react';
import { Mic, Square, Activity } from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';
import './AudioRealtime.css';

const CHUNK_DURATION = 6000; // Grabar chunks de 6 segundos (mejor para análisis de voz)
const MIN_AUDIO_SIZE = 50000; // Tamaño mínimo en bytes para procesar

const emotionEmojis = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  neutral: '😐',
  fear: '😨',
  disgust: '🤢',
};

const emotionNames = {
  happy: 'Feliz',
  sad: 'Triste',
  angry: 'Enojado',
  neutral: 'Neutral',
  fear: 'Miedo',
  disgust: 'Disgusto',
};

const emotionColors = {
  happy: '#4CAF50',
  sad: '#2196F3',
  angry: '#F44336',
  neutral: '#9E9E9E',
  fear: '#9C27B0',
  disgust: '#795548',
};

const AudioRealtime = () => {
  const { isConnected, subscribe, sendMessage } = useWebSocket();
  
  const [isRecording, setIsRecording] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const chunkIntervalRef = useRef(null);

  // Suscribirse a mensajes de voz
  useEffect(() => {
    const unsubscribe = subscribe('voice', (data) => {
      if (data.type === 'analysis_result') {
        const result = data.result;
        console.log('Resultado de audio:', result);
        
        setCurrentEmotion(result.emotion);
        setConfidence(result.confidence);
        setIsAnalyzing(false);

        // Agregar al historial
        setEmotionHistory(prev => {
          const newHistory = [...prev, {
            emotion: result.emotion,
            confidence: result.confidence,
            timestamp: Date.now()
          }];
          return newHistory.slice(-20); // Mantener últimos 20
        });
      }
    });

    return unsubscribe;
  }, [subscribe]);

  // Iniciar grabación continua
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Cuando se detiene, procesar el chunk acumulado
        if (chunksRef.current.length > 0) {
          sendAudioChunk();
        }
        chunksRef.current = [];
        
        // Reiniciar grabación si sigue activo
        if (mediaRecorderRef.current && mediaRecorderRef.current.stream.active) {
          try {
            mediaRecorderRef.current.start();
          } catch (e) {
            console.error('Error al reiniciar grabación:', e);
          }
        }
      };

      // Iniciar grabación con timeslice para capturar datos periódicamente
      mediaRecorder.start();
      setIsRecording(true);

      // Solicitar datos cada X segundos (esto no detiene la grabación)
      chunkIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, CHUNK_DURATION);

    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
      alert('No se pudo acceder al micrófono: ' + error.message);
    }
  };

  // Enviar chunk de audio
  const sendAudioChunk = () => {
    if (chunksRef.current.length === 0) {
      console.log('No hay chunks disponibles');
      return;
    }

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    console.log(`Tamaño del chunk de audio: ${blob.size} bytes`);
    
    // Validar tamaño mínimo del audio antes de enviar
    if (blob.size < MIN_AUDIO_SIZE) {
      console.log(`Audio chunk too small (${blob.size} bytes), skipping analysis`);
      return;
    }
    
    // Convertir a base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result;
      console.log('Enviando audio chunk al WebSocket...');
      
      setIsAnalyzing(true);
      const sent = sendMessage({
        type: 'analyze_audio',
        audio: base64data
      });
      
      if (sent) {
        console.log('Audio chunk enviado');
      } else {
        console.error('No se pudo enviar el audio chunk');
        setIsAnalyzing(false);
      }
    };
    reader.onerror = (error) => {
      console.error('Error al leer el blob de audio:', error);
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(blob);
  };

  // Detener grabación
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
    }

    setIsRecording(false);
    chunksRef.current = [];
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  return (
    <div className="audio-realtime-card">
      <div className="audio-realtime-header">
        <Mic size={24} />
        <h3>Audio en Tiempo Real</h3>
        {isConnected && (
          <div className="realtime-badge">
            <Activity size={16} />
            <span>En vivo</span>
          </div>
        )}
      </div>

      <div className="audio-realtime-content">
        {/* Visualización de estado */}
        <div className={`recording-visualizer ${isRecording ? 'active' : ''}`}>
          {isRecording ? (
            <>
              <div className="pulse-ring"></div>
              <Mic size={48} className="mic-icon pulsing" />
              <p className="status-text">Escuchando y analizando...</p>
            </>
          ) : (
            <>
              <Mic size={48} className="mic-icon" />
              <p className="status-text">Haz clic para iniciar</p>
            </>
          )}
        </div>

        {/* Controles */}
        <div className="audio-controls">
          {!isRecording ? (
            <button className="btn-start-audio" onClick={startRecording}>
              <Mic size={24} />
              Iniciar Análisis de Voz
            </button>
          ) : (
            <button className="btn-stop-audio" onClick={stopRecording}>
              <Square size={24} />
              Detener
            </button>
          )}
        </div>

        {/* Resultado actual */}
        {currentEmotion && (
          <div className="audio-emotion-result">
            <div 
              className="result-emoji-large"
              style={{ color: emotionColors[currentEmotion] }}
            >
              {emotionEmojis[currentEmotion]}
            </div>
            <div className="result-info">
              <div className="result-emotion-name">
                {emotionNames[currentEmotion]}
              </div>
              <div className="result-confidence-bar">
                <div 
                  className="confidence-fill"
                  style={{ 
                    width: `${confidence * 100}%`,
                    backgroundColor: emotionColors[currentEmotion]
                  }}
                />
              </div>
              <div className="result-confidence-text">
                {(confidence * 100).toFixed(0)}% confianza
              </div>
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="analyzing-audio">
            <div className="spinner"></div>
            <span>Analizando audio...</span>
          </div>
        )}

        {/* Historial */}
        {emotionHistory.length > 0 && (
          <div className="audio-history">
            <h4>Historial de Emociones</h4>
            <div className="history-timeline">
              {emotionHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="history-dot"
                  style={{ backgroundColor: emotionColors[item.emotion] }}
                  title={`${emotionNames[item.emotion]} - ${(item.confidence * 100).toFixed(0)}%`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioRealtime;
