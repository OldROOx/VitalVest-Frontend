// src/hooks/useWebSocket.js - CORREGIDO PARA TU BACKEND
import { useState, useEffect, useRef } from 'react';
import { websocketService } from '../services/websocketService';

export const useWebSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [connectionError, setConnectionError] = useState(null);
    const [sensorData, setSensorData] = useState({
        // BME280 - Datos ambientales (estructura de tu backend)
        temperatura: null,
        presion: null,
        humedad: null,

        // MPU6050 - Solo pasos según tu struct
        pasos: null,

        // MLX90614 - Temperatura corporal
        temperatura_ambiente: null,
        temp_objeto: null,

        // GSR - Porcentaje de hidratación
        porcentaje: null
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
            console.log('📨 Datos recibidos del WebSocket:', data);

            setLastMessage({
                ...data,
                timestamp: new Date().toISOString()
            });

            // Procesar datos según la estructura exacta de tu backend
            setSensorData(prevData => {
                const newData = { ...prevData };

                // Mapear datos del BME280 (estructura: bme280.temperatura, etc.)
                if (data.bme280) {
                    newData.temperatura = data.bme280.temperatura;
                    newData.presion = data.bme280.presion;
                    newData.humedad = data.bme280.humedad;
                }

                // Mapear datos del MPU6050 (estructura: mpu6050.pasos)
                if (data.mpu6050) {
                    newData.pasos = data.mpu6050.pasos;
                }

                // Mapear datos del MLX90614 (estructura: mlx90614.temperatura_ambiente, temp_objeto)
                if (data.mlx90614) {
                    newData.temperatura_ambiente = data.mlx90614.temperatura_ambiente;
                    newData.temp_objeto = data.mlx90614.temp_objeto;
                }

                // Mapear datos del GSR (estructura: GSR.porcentaje)
                if (data.GSR) {
                    newData.porcentaje = data.GSR.porcentaje;
                }

                console.log('🔄 Datos de sensores actualizados:', newData);
                return newData;
            });
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

    // Función para obtener datos simulados cuando no hay conexión
    const getSimulatedData = () => {
        return {
            temperatura: 25.5 + Math.random() * 10,
            presion: 1013 + Math.random() * 50,
            humedad: 45 + Math.random() * 30,
            pasos: Math.floor(Math.random() * 100),
            temperatura_ambiente: 22 + Math.random() * 5,
            temp_objeto: 36 + Math.random() * 2,
            porcentaje: Math.floor(Math.random() * 100)
        };
    };

    // Verificar si hay datos válidos
    const hasValidData = () => {
        return (
            sensorData.temperatura !== null ||
            sensorData.pasos !== null ||
            sensorData.temp_objeto !== null ||
            sensorData.porcentaje !== null
        );
    };

    return {
        isConnected,
        lastMessage,
        connectionError,
        sensorData: isConnected ? sensorData : getSimulatedData(),
        rawSensorData: sensorData, // Datos sin simulación
        reconnect,
        hasValidData,

        // Funciones auxiliares para verificar si hay datos específicos
        hasTemperature: () => sensorData.temperatura !== null,
        hasSteps: () => sensorData.pasos !== null,
        hasBodyTemperature: () => sensorData.temp_objeto !== null,
        hasHydration: () => sensorData.porcentaje !== null,

        // Función para obtener resumen de los datos
        getSensorSummary: () => ({
            connected: isConnected,
            dataPoints: {
                temperatura: sensorData.temperatura !== null,
                presion: sensorData.presion !== null,
                humedad: sensorData.humedad !== null,
                pasos: sensorData.pasos !== null,
                temp_objeto: sensorData.temp_objeto !== null,
                porcentaje: sensorData.porcentaje !== null
            },
            lastUpdate: lastMessage?.timestamp
        })
    };
};