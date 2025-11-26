import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Activity } from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';
import './TextInputRealtime.css';

const DEBOUNCE_DELAY = 1500; // Esperar 1.5s después de dejar de escribir

const emotionEmojis = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  neutral: '😐',
  surprise: '😮',
  fear: '😨',
  disgust: '🤢',
  positive: '😊',
  negative: '😢',
  NEU: '😐',
  POS: '😊',
  NEG: '😢'
};

const emotionNames = {
  happy: 'Feliz',
  sad: 'Triste',
  angry: 'Enojado',
  neutral: 'Neutral',
  surprise: 'Sorprendido',
  fear: 'Miedo',
  disgust: 'Disgusto',
  positive: 'Positivo',
  negative: 'Negativo',
  NEU: 'Neutral',
  POS: 'Positivo',
  NEG: 'Negativo'
};

const TextInputRealtime = () => {
  const { isConnected, subscribe, sendMessage } = useWebSocket();
  
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('auto');
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const debounceTimerRef = useRef(null);

  // Suscribirse a mensajes de texto
  useEffect(() => {
    const unsubscribe = subscribe('text', (data) => {
      if (data.type === 'analysis_result') {
        const result = data.result;
        setCurrentEmotion(result.emotion);
        setConfidence(result.confidence);
        setIsAnalyzing(false);
      }
    });

    return unsubscribe;
  }, [subscribe]);

  // Analizar texto con debounce
  useEffect(() => {
    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Si el texto es muy corto, no analizar
    if (text.trim().length < 10) {
      setCurrentEmotion(null);
      return;
    }

    // Indicar que está esperando
    setIsAnalyzing(true);

    // Nuevo timer
    debounceTimerRef.current = setTimeout(() => {
      console.log('Enviando texto para análisis:', text.substring(0, 50) + '...');
      sendMessage({
        type: 'analyze_text',
        text: text,
        language: language
      });
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [text, language, sendMessage]);

  return (
    <div className="text-realtime-card">
      <div className="text-realtime-header">
        <MessageSquare size={24} />
        <h3>Texto en Tiempo Real</h3>
        {isConnected && (
          <div className="realtime-badge">
            <Activity size={16} />
            <span>En vivo</span>
          </div>
        )}
      </div>

      <div className="text-realtime-content">
        <textarea
          className="text-realtime-input"
          placeholder="Escribe para analizar emociones en tiempo real... (mínimo 10 caracteres)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          maxLength={5000}
        />
        
        <div className="text-realtime-footer">
          <div className="language-selector">
            <label htmlFor="language-realtime">Idioma:</label>
            <select
              id="language-realtime"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="language-select"
            >
              <option value="auto">Auto</option>
              <option value="es">Español</option>
              <option value="en">Inglés</option>
            </select>
          </div>
          
          <div className="char-counter">
            {text.length} / 5000
          </div>
        </div>

        {/* Resultado en tiempo real */}
        {currentEmotion && !isAnalyzing && (
          <div className="text-emotion-result">
            <div className="result-emoji">{emotionEmojis[currentEmotion] || '😐'}</div>
            <div className="result-info">
              <div className="result-emotion">{emotionNames[currentEmotion] || currentEmotion}</div>
              <div className="result-confidence">{(confidence * 100).toFixed(0)}% confianza</div>
            </div>
          </div>
        )}

        {isAnalyzing && text.trim().length >= 10 && (
          <div className="analyzing-indicator">
            <div className="spinner"></div>
            <span>Analizando...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextInputRealtime;
