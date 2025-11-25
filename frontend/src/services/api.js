import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8004';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeMultimodal = async ({ image, audio, text, language = 'auto' }) => {
  try {
    const formData = new FormData();

    if (image) {
      formData.append('image', image);
    }

    if (audio) {
      formData.append('audio', audio);
    }

    if (text) {
      formData.append('text', text);
      formData.append('language', language);
    }

    const response = await api.post('/analyze/multimodal', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || 'Error del servidor');
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor');
    } else {
      throw new Error('Error al procesar la solicitud');
    }
  }
};

export default api;
