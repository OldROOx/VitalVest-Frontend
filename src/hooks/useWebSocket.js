// src/hooks/useWebSocket.js - VERSIÓN CORREGIDA
import { useState, useEffect, useRef } from 'react';
import { websocketService } from '../services/websocketService';

export const useWebSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [connectionError, setConnectionError] = useState(null);
    const [sensorData, setSensorData] = useState({
        // BME280 - Datos ambientales
        temperatura: null,
        presion: null,
        humedad: null,

        // MPU6050 - Aceleración y giroscopio
        aceleracion: {
            x: null,
            y: null,
            z: null
        },
        giroscopio: {
            x: null,
            y: null,
            z: null
        },

        // MLX90614 - Temperatura corporal
        temperatura_ambiente: null,
        temp_objeto: null
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

            // Procesar datos según la estructura del backend
            setSensorData(prevData => {
                const newData = { ...prevData };

                // Mapear datos del BME280
                if (data.bme280) {
                    newData.temperatura = data.bme280.temperatura;
                    newData.presion = data.bme280.presion;
                    newData.humedad = data.bme280.humedad;
                }

                // Mapear datos del MPU6050
                if (data.mpu6050) {
                    if (data.mpu6050.aceleracion) {
                        newData.aceleracion = {
                            x: data.mpu6050.aceleracion.x,
                            y: data.mpu6050.aceleracion.y,
                            z: data.mpu6050.aceleracion.z
                        };
                    }
                    if (data.mpu6050.giroscopio) {
                        newData.giroscopio = {
                            x: data.mpu6050.giroscopio.x,
                            y: data.mpu6050.giroscopio.y,
                            z: data.mpu6050.giroscopio.z
                        };
                    }
                }

                // Mapear datos del MLX90614
                if (data.mlx90614) {
                    newData.temperatura_ambiente = data.mlx90614.temperatura_ambiente;
                    newData.temp_objeto = data.mlx90614.temp_objeto;
                }

                // Soporte para datos directos (por si envías estructura plana)
                if (data.temperatura !== undefined) newData.temperatura = data.temperatura;
                if (data.presion !== undefined) newData.presion = data.presion;
                if (data.humedad !== undefined) newData.humedad = data.humedad;
                if (data.aceleracion) newData.aceleracion = data.aceleracion;
                if (data.giroscopio) newData.giroscopio = data.giroscopio;

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
            aceleracion: {
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2,
                z: (Math.random() - 0.5) * 2
            },
            giroscopio: {
                x: (Math.random() - 0.5) * 100,
                y: (Math.random() - 0.5) * 100,
                z: (Math.random() - 0.5) * 100
            },
            temperatura_ambiente: 22 + Math.random() * 5,
            temp_objeto: 36 + Math.random() * 2
        };
    };

    // Verificar si hay datos válidos
    const hasValidData = () => {
        return (
            sensorData.temperatura !== null ||
            sensorData.aceleracion.x !== null ||
            sensorData.temp_objeto !== null
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
        hasAcceleration: () => sensorData.aceleracion.x !== null,
        hasGyroscope: () => sensorData.giroscopio.x !== null,
        hasBodyTemperature: () => sensorData.temp_objeto !== null,

        // Función para obtener resumen de los datos
        getSensorSummary: () => ({
            connected: isConnected,
            dataPoints: {
                temperatura: sensorData.temperatura !== null,
                presion: sensorData.presion !== null,
                humedad: sensorData.humedad !== null,
                aceleracion: sensorData.aceleracion.x !== null,
                giroscopio: sensorData.giroscopio.x !== null,
                temp_objeto: sensorData.temp_objeto !== null
            },
            lastUpdate: lastMessage?.timestamp
        })
    };
};