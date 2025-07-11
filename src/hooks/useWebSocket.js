// src/hooks/useWebSocket.js
import { useState, useEffect, useRef } from 'react';
import { websocketService } from '../services/websocketService';

export const useWebSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [connectionError, setConnectionError] = useState(null);
    const [sensorData, setSensorData] = useState({
        temperatura: null,
        presion: null,
        humedad: null,
        aceleracion: {
            x: null,
            y: null,
            z: null
        },
        giroscopio: {
            x: null,
            y: null,
            z: null
        }
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
            setLastMessage({
                ...data,
                timestamp: new Date().toISOString()
            });

            console.log('📨 Nuevos datos de sensores:', data);

            // Actualizar datos de sensores con la nueva estructura
            setSensorData(prevData => ({
                // Mantener datos anteriores y actualizar con nuevos
                ...prevData,

                // Mapear los nuevos campos directos
                temperatura: data.temperatura !== undefined ? data.temperatura : prevData.temperatura,
                presion: data.presion !== undefined ? data.presion : prevData.presion,
                humedad: data.humedad !== undefined ? data.humedad : prevData.humedad,

                // Mapear aceleración si existe
                aceleracion: {
                    x: data.aceleracion?.x !== undefined ? data.aceleracion.x : prevData.aceleracion.x,
                    y: data.aceleracion?.y !== undefined ? data.aceleracion.y : prevData.aceleracion.y,
                    z: data.aceleracion?.z !== undefined ? data.aceleracion.z : prevData.aceleracion.z
                },

                // Mapear giroscopio si existe
                giroscopio: {
                    x: data.giroscopio?.x !== undefined ? data.giroscopio.x : prevData.giroscopio.x,
                    y: data.giroscopio?.y !== undefined ? data.giroscopio.y : prevData.giroscopio.y,
                    z: data.giroscopio?.z !== undefined ? data.giroscopio.z : prevData.giroscopio.z
                }
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

    // Función para obtener datos simulados cuando no hay conexión (opcional)
    const getSimulatedData = () => {
        return {
            temperatura: 25.5 + Math.random() * 10,
            presion: 1013 + Math.random() * 50,
            humedad: 45 + Math.random() * 30,
            aceleracion: {
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2,
                z: (Math.random() - 0.5) * 2
            },
            giroscopio: {
                x: (Math.random() - 0.5) * 100,
                y: (Math.random() - 0.5) * 100,
                z: (Math.random() - 0.5) * 100
            }
        };
    };

    return {
        isConnected,
        lastMessage,
        connectionError,
        sensorData: isConnected ? sensorData : getSimulatedData(),
        reconnect,
        // Funciones auxiliares para verificar si hay datos
        hasTemperature: () => sensorData.temperatura !== null,
        hasAcceleration: () => sensorData.aceleracion.x !== null,
        hasGyroscope: () => sensorData.giroscopio.x !== null,
        // Función para obtener resumen de los datos
        getSensorSummary: () => ({
            connected: isConnected,
            dataPoints: {
                temperatura: sensorData.temperatura !== null,
                presion: sensorData.presion !== null,
                humedad: sensorData.humedad !== null,
                aceleracion: sensorData.aceleracion.x !== null,
                giroscopio: sensorData.giroscopio.x !== null
            },
            lastUpdate: lastMessage?.timestamp
        })
    };
};