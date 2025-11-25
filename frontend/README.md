# Frontend - Emotion Recognition

Sistema de reconocimiento multimodal de emociones con React + Vite.

## Características

- 🎭 **Análisis Facial**: Sube una imagen y detecta emociones en rostros
- 🎤 **Análisis de Voz**: Analiza emociones en archivos de audio
- 💬 **Análisis de Texto**: Detecta emociones en texto escrito (español/inglés)
- 🔀 **Fusión Multimodal**: Combina múltiples modalidades para mayor precisión

## Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de producción
npm run preview
```

## Configuración

Crea un archivo `.env` en la raíz del frontend:

```env
VITE_API_URL=http://localhost:8004
```

## Estructura

```
src/
├── components/       # Componentes React
│   ├── ImageUpload.jsx
│   ├── AudioUpload.jsx
│   ├── TextInput.jsx
│   └── ResultsDisplay.jsx
├── services/        # Servicios API
│   └── api.js
├── App.jsx          # Componente principal
└── main.jsx         # Entry point
```

## Uso

1. Selecciona al menos una modalidad (imagen, audio o texto)
2. Haz clic en "Analizar Emociones"
3. Visualiza los resultados con gráficos y estadísticas

## Tecnologías

- React 18
- Vite
- Axios
- Lucide React (iconos)
- CSS3 (animaciones y gradientes)
