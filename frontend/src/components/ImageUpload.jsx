import React, { useRef, useState } from 'react';
import { ImageIcon, Upload, X, Camera } from 'lucide-react';
import './ImageUpload.css';

const ImageUpload = ({ image, onImageChange }) => {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageChange(file);
    } else {
      alert('Por favor selecciona un archivo de imagen válido');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageChange(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleRemove = () => {
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      
      // Esperar un momento para que el estado se actualice antes de asignar el stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(err => {
              console.error('Error al reproducir video:', err);
            });
          };
        }
      }, 100);
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      alert('No se pudo acceder a la cámara: ' + error.message + '\n\nAsegúrate de dar permisos de cámara al navegador.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `captured-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onImageChange(file);
        stopCamera();
      }, 'image/jpeg', 0.95);
    }
  };

  return (
    <div className="upload-card">
      <div className="upload-header">
        <ImageIcon size={24} />
        <h3>Imagen Facial</h3>
      </div>

      {!image && !isCameraActive ? (
        <>
          <div
            className="upload-area"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload size={48} className="upload-icon" />
            <p>Arrastra una imagen o haz clic para seleccionar</p>
            <small>PNG, JPG, JPEG (máx. 10MB)</small>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
          <button className="camera-btn" onClick={startCamera}>
            <Camera size={20} />
            Usar Cámara
          </button>
        </>
      ) : isCameraActive ? (
        <div className="camera-area">
          <video ref={videoRef} autoPlay playsInline className="camera-preview" />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="camera-controls">
            <button className="btn-capture" onClick={capturePhoto}>
              <Camera size={24} />
              Capturar
            </button>
            <button className="btn-cancel" onClick={stopCamera}>
              <X size={20} />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="preview-area">
          <img
            src={URL.createObjectURL(image)}
            alt="Preview"
            className="image-preview"
          />
          <button className="remove-btn" onClick={handleRemove}>
            <X size={20} />
          </button>
          <p className="file-name">{image.name}</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
