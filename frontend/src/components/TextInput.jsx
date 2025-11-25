import React from 'react';
import { MessageSquare } from 'lucide-react';
import './TextInput.css';

const TextInput = ({ text, onTextChange, language, onLanguageChange }) => {
  return (
    <div className="upload-card">
      <div className="upload-header">
        <MessageSquare size={24} />
        <h3>Texto Escrito</h3>
      </div>

      <div className="text-input-area">
        <textarea
          className="text-input"
          placeholder="Escribe un texto para analizar las emociones... (mínimo 10 caracteres)"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          rows={6}
          maxLength={5000}
        />
        
        <div className="text-controls">
          <div className="language-selector">
            <label htmlFor="language">Idioma:</label>
            <select
              id="language"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="language-select"
            >
              <option value="auto">Detectar automáticamente</option>
              <option value="es">Español</option>
              <option value="en">Inglés</option>
            </select>
          </div>
          
          <div className="char-counter">
            {text.length} / 5000 caracteres
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextInput;
