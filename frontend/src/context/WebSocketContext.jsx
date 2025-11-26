import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const WebSocketContext = createContext(null);

const WEBSOCKET_URL = 'ws://localhost:8004/ws/realtime';

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const listenersRef = useRef({
    facial: [],
    voice: [],
    text: [],
    connected: [],
    error: []
  });

  useEffect(() => {
    const connectWebSocket = () => {
      // Si ya hay una conexión activa, no crear otra
      if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
        console.log('WebSocket ya está conectado o conectando, reutilizando conexión');
        return;
      }

      try {
        const ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
          console.log('WebSocket conectado (compartido)');
          setIsConnected(true);
          
          // Notificar a listeners de conexión
          listenersRef.current.connected.forEach(callback => callback());
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket mensaje recibido:', data);

            // Distribuir mensaje a los listeners apropiados
            if (data.type === 'analysis_result') {
              const modality = data.modality;
              if (listenersRef.current[modality]) {
                listenersRef.current[modality].forEach(callback => callback(data));
              }
            } else if (data.type === 'connected') {
              console.log('Conexión establecida:', data.message);
              listenersRef.current.connected.forEach(callback => callback(data));
            } else if (data.type === 'error') {
              console.error('Error del servidor:', data);
              listenersRef.current.error.forEach(callback => callback(data));
            }
          } catch (error) {
            console.error('Error procesando mensaje WebSocket:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
          listenersRef.current.error.forEach(callback => callback(error));
        };

        ws.onclose = () => {
          console.log('WebSocket desconectado');
          setIsConnected(false);
          wsRef.current = null;
          
          // Limpiar timeout anterior si existe
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          // Reintentar conexión después de 3 segundos
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Reintentando conexión WebSocket...');
            connectWebSocket();
          }, 3000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Error al conectar WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      // Limpiar timeout de reconexión
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Cerrar conexión WebSocket
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const subscribe = (modality, callback) => {
    if (listenersRef.current[modality]) {
      listenersRef.current[modality].push(callback);
    }

    // Retornar función de limpieza
    return () => {
      if (listenersRef.current[modality]) {
        listenersRef.current[modality] = listenersRef.current[modality].filter(
          cb => cb !== callback
        );
      }
    };
  };

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.error('WebSocket no está conectado');
      return false;
    }
  };

  const value = {
    isConnected,
    subscribe,
    sendMessage,
    ws: wsRef.current
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket debe ser usado dentro de WebSocketProvider');
  }
  return context;
};
