import React, { useRef, useState } from 'react';
import { Mic, Upload, X, Square } from 'lucide-react';
import './AudioUpload.css';

const AudioUpload = ({ audio, onAudioChange }) => {
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      onAudioChange(file);
    } else {
      alert('Por favor selecciona un archivo de audio válido');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      onAudioChange(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleRemove = () => {
    onAudioChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `recorded-${Date.now()}.webm`, { type: 'audio/webm' });
        onAudioChange(file);
        stream.getTracks().forEach(track => track.stop());
        setRecordingTime(0);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      alert('No se pudo acceder al micrófono: ' + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="upload-card">
      <div className="upload-header">
        <Mic size={24} />
        <h3>Audio de Voz</h3>
      </div>

      {!audio && !isRecording ? (
        <>
          <div
            className="upload-area"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload size={48} className="upload-icon" />
            <p>Arrastra un audio o haz clic para seleccionar</p>
            <small>WAV, MP3, OGG (máx. 10MB)</small>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
          <button className="record-btn" onClick={startRecording}>
            <Mic size={20} />
            Grabar Audio
          </button>
        </>
      ) : isRecording ? (
        <div className="recording-area">
          <div className="recording-indicator">
            <div className="pulse-dot"></div>
            <span className="recording-text">Grabando...</span>
          </div>
          <div className="recording-time">{formatTime(recordingTime)}</div>
          <button className="stop-btn" onClick={stopRecording}>
            <Square size={24} />
            Detener Grabación
          </button>
        </div>
      ) : (
        <div className="preview-area">
          <div className="audio-preview">
            <Mic size={64} className="audio-icon" />
            <audio controls className="audio-player">
              <source src={URL.createObjectURL(audio)} type={audio.type} />
              Tu navegador no soporta el elemento de audio.
            </audio>
          </div>
          <button className="remove-btn" onClick={handleRemove}>
            <X size={20} />
          </button>
          <p className="file-name">{audio.name}</p>
        </div>
      )}
    </div>
  );
};

export default AudioUpload;
