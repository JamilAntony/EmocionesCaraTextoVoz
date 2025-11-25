import React, { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import AudioUpload from './components/AudioUpload';
import TextInput from './components/TextInput';
import ResultsDisplay from './components/ResultsDisplay';
import { analyzeMultimodal } from './services/api';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [audio, setAudio] = useState(null);
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('auto');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    // Validar que al menos una modalidad esté presente
    if (!image && !audio && !text.trim()) {
      setError('Por favor, proporciona al menos una modalidad (imagen, audio o texto)');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const result = await analyzeMultimodal({
        image,
        audio,
        text: text.trim() || null,
        language
      });
      
      setResults(result);
    } catch (err) {
      setError(err.message || 'Error al analizar las emociones');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setAudio(null);
    setText('');
    setLanguage('auto');
    setResults(null);
    setError(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎭 Reconocimiento Multimodal de Emociones</h1>
        <p>Analiza emociones a través de imagen facial, voz y texto usando IA</p>
      </header>

      <main className="app-main">
        <div className="upload-section">
          <div className="upload-grid">
            <ImageUpload image={image} onImageChange={setImage} />
            <AudioUpload audio={audio} onAudioChange={setAudio} />
            <TextInput 
              text={text} 
              onTextChange={setText}
              language={language}
              onLanguageChange={setLanguage}
            />
          </div>

          <div className="action-buttons">
            <button 
              className="btn btn-primary" 
              onClick={handleAnalyze}
              disabled={loading || (!image && !audio && !text.trim())}
            >
              {loading ? 'Analizando...' : '🔍 Analizar Emociones'}
            </button>
            
            <button 
              className="btn btn-secondary" 
              onClick={handleReset}
              disabled={loading}
            >
              🔄 Reiniciar
            </button>
          </div>

          {error && (
            <div className="error-message fade-in">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {results && (
          <ResultsDisplay results={results} />
        )}
      </main>

      <footer className="app-footer">
        <p>Sistema de Análisis de Emociones Multimodal - IA 2025</p>
        <p>🤖 Powered by DeepFace, Wav2Vec2 & BERT</p>
      </footer>
    </div>
  );
}

export default App;
