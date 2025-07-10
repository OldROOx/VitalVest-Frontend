// src/hooks/useWebSocket.js
import { useState, useEffect, useRef } from 'react';
import { websocketService } from '../services/websocketService';

export const useWebSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [connectionError, setConnectionError] = useState(null);
    const [sensorData, setSensorData] = useState({
        BME: null,
        GSR: null,
        MLX: null,
        MPU: null
    });

    const retryTimeoutRef = useRef(null);

    useEffect(() => {
        // Configurar callbacks del WebSocket
        websocketService.onOpen(() => {
            setIsConnected(true);
            setConnectionError(null);
            console.log('🟢 WebSocket conectado desde React');
        });

        websocketService.onMessage((data) => {
            setLastMessage(data);
            console.log('📨 Nuevos datos de sensores:', data);

            // Actualizar datos de sensores
            setSensorData(prevData => ({
                ...prevData,
                ...data
            }));
        });

        websocketService.onClose(() => {
            setIsConnected(false);
            console.log('🔴 WebSocket desconectado desde React');
        });

        websocketService.onError((error) => {
            setConnectionError(error);
            setIsConnected(false);
            console.error('❌ Error WebSocket desde React:', error);
        });

        // Iniciar conexión
        websocketService.connect();

        // Cleanup al desmontar el componente
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            websocketService.disconnect();
        };
    }, []);

    // Función para reconectar manualmente
    const reconnect = () => {
        websocketService.disconnect();
        setTimeout(() => {
            websocketService.connect();
        }, 1000);
    };

    return {
        isConnected,
        lastMessage,
        connectionError,
        sensorData,
        reconnect
    };
};