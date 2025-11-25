# Instalación de FFmpeg para Soporte de WebM

El sistema necesita FFmpeg para procesar archivos de audio WebM grabados desde el navegador.

## Windows

### Opción 1: Usando Chocolatey (Recomendado)
```powershell
choco install ffmpeg
```

### Opción 2: Manual
1. Descargar FFmpeg desde: https://www.gyan.dev/ffmpeg/builds/
2. Extraer el archivo ZIP
3. Agregar la carpeta `bin` al PATH del sistema:
   - Buscar "Variables de entorno" en Windows
   - Agregar la ruta `C:\ffmpeg\bin` a la variable PATH
4. Reiniciar PowerShell

### Verificar instalación
```powershell
ffmpeg -version
```

## Alternativa: Usar formatos sin FFmpeg

Si no puedes instalar FFmpeg, modifica el frontend para grabar en formato WAV nativo:

En `AudioUpload.jsx`, cambia:
```javascript
const mediaRecorder = new MediaRecorder(stream, { 
  mimeType: 'audio/webm' 
});
```

Por:
```javascript
const mediaRecorder = new MediaRecorder(stream, { 
  mimeType: 'audio/wav' 
});
```

## Nota
Librosa usa FFmpeg internamente para decodificar formatos como WebM, MP3, etc.
Sin FFmpeg, solo funcionarán archivos WAV sin comprimir.
