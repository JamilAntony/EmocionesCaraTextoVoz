import React from 'react';
import { Smile, Frown, Meh, Angry, AlertCircle } from 'lucide-react';
import './ResultsDisplay.css';

const emotionIcons = {
  happy: { icon: Smile, color: '#4CAF50', emoji: '😊' },
  sad: { icon: Frown, color: '#2196F3', emoji: '😢' },
  angry: { icon: Angry, color: '#F44336', emoji: '😠' },
  neutral: { icon: Meh, color: '#9E9E9E', emoji: '😐' },
  surprise: { icon: AlertCircle, color: '#FF9800', emoji: '😮' },
  fear: { icon: Frown, color: '#9C27B0', emoji: '😨' },
  disgust: { icon: Frown, color: '#795548', emoji: '🤢' },
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

const ResultsDisplay = ({ results }) => {
  const getEmotionInfo = (emotion) => {
    return emotionIcons[emotion] || emotionIcons.neutral;
  };

  const sortedEmotions = Object.entries(results.all_emotions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="results-container fade-in">
      <h2 className="results-title">📊 Resultados del Análisis</h2>

      {/* Emoción Principal */}
      <div className="main-emotion">
        <div className="emotion-icon-large">
          {getEmotionInfo(results.final_emotion).emoji}
        </div>
        <h3 className="emotion-name">
          {emotionNames[results.final_emotion] || results.final_emotion}
        </h3>
        <div className="confidence-badge">
          Confianza: {(results.final_confidence * 100).toFixed(1)}%
        </div>
      </div>

      {/* Distribución de Emociones */}
      <div className="emotions-chart">
        <h4>Distribución de Emociones</h4>
        {sortedEmotions.map(([emotion, score]) => {
          const info = getEmotionInfo(emotion);
          return (
            <div key={emotion} className="emotion-bar">
              <div className="emotion-label">
                <span className="emotion-emoji">{info.emoji}</span>
                <span>{emotionNames[emotion] || emotion}</span>
              </div>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{
                    width: `${score * 100}%`,
                    background: info.color,
                  }}
                />
              </div>
              <span className="emotion-score">{(score * 100).toFixed(1)}%</span>
            </div>
          );
        })}
      </div>

      {/* Resultados por Modalidad */}
      <div className="modalities-results">
        <h4>Resultados por Modalidad</h4>
        <div className="modalities-grid">
          {results.facial_result && (
            <div className="modality-card">
              <h5>🎭 Análisis Facial</h5>
              <p className="modality-emotion">
                {emotionNames[results.facial_result.emotion] || results.facial_result.emotion}
              </p>
              <p className="modality-confidence">
                {(results.facial_result.confidence * 100).toFixed(1)}% confianza
              </p>
              <small>{results.facial_result.processing_time.toFixed(2)}s</small>
            </div>
          )}

          {results.voice_result && (
            <div className="modality-card">
              <h5>🎤 Análisis de Voz</h5>
              <p className="modality-emotion">
                {emotionNames[results.voice_result.emotion] || results.voice_result.emotion}
              </p>
              <p className="modality-confidence">
                {(results.voice_result.confidence * 100).toFixed(1)}% confianza
              </p>
              <small>{results.voice_result.processing_time.toFixed(2)}s</small>
            </div>
          )}

          {results.text_result && (
            <div className="modality-card">
              <h5>💬 Análisis de Texto</h5>
              <p className="modality-emotion">
                {emotionNames[results.text_result.emotion] || results.text_result.emotion}
              </p>
              <p className="modality-confidence">
                {(results.text_result.confidence * 100).toFixed(1)}% confianza
              </p>
              <small>{results.text_result.processing_time.toFixed(2)}s</small>
            </div>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="analysis-metadata">
        <p>
          <strong>Método de fusión:</strong> {results.fusion_method}
        </p>
        <p>
          <strong>Tiempo total:</strong> {results.total_processing_time.toFixed(2)}s
        </p>
        <p>
          <strong>Modalidades usadas:</strong> {results.modalities_used.join(', ')}
        </p>
      </div>
    </div>
  );
};

export default ResultsDisplay;
