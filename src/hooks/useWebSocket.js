// src/hooks/useWebSocket.js - CORREGIDO PARA DATOS REALES
import { useState, useEffect, useRef } from 'react';
import { websocketService } from '../services/websocketService';

export const useWebSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [connectionError, setConnectionError] = useState(null);
    const [sensorData, setSensorData] = useState({
        // Estructura basada en tu backend
        temperatura: null,
        presion: null,
        humedad: null,
        pasos: null,
        temperatura_ambiente: null,
        temperatura_objeto: null,
        conductancia: null,
        estado_hidratacion: null
    });

    const retryTimeoutRef = useRef(null);

    useEffect(() => {
        // Configurar callbacks del WebSocket
        websocketService.onOpen(() => {
            setIsConnected(true);
            setConnectionError(null);
            console.log('✅ WebSocket conectado desde React');
        });

        websocketService.onMessage((data) => {
            console.log('📨 Datos recibidos del WebSocket:', data);

            setLastMessage({
                ...data,
                timestamp: new Date().toISOString()
            });

            // Procesar datos según tu estructura de WebSocket
            setSensorData(prevData => {
                const newData = { ...prevData };

                // Estructura esperada de tu WebSocket:
                // {
                //   "bme280": { "temperatura": X, "presion": Y, "humedad": Z },
                //   "mpu6050": { "pasos": N },
                //   "mlx90614": { "temperatura_ambiente": X, "temp_objeto": Y },
                //   "GSR": { "porcentaje": P }
                // }

                if (data.bme280) {
                    newData.temperatura = data.bme280.temperatura;
                    newData.presion = data.bme280.presion;
                    newData.humedad = data.bme280.humedad;
                }

                if (data.mpu6050) {
                    newData.pasos = data.mpu6050.pasos;
                }

                if (data.mlx90614) {
                    newData.temperatura_ambiente = data.mlx90614.temperatura_ambiente;
                    newData.temperatura_objeto = data.mlx90614.temp_objeto;
                }

                if (data.GSR) {
                    // Convertir porcentaje a conductancia simulada para compatibilidad
                    newData.conductancia = data.GSR.porcentaje / 100;
                    newData.estado_hidratacion = data.GSR.porcentaje > 70 ? 'Bien hidratado' :
                        data.GSR.porcentaje > 50 ? 'Moderadamente hidratado' :
                            'Deshidratado';
                }

                return newData;
            });
        });

        websocketService.onClose(() => {
            setIsConnected(false);
            console.log('🔴 WebSocket desconectado');
        });

        websocketService.onError((error) => {
            setConnectionError(error);
            setIsConnected(false);
            console.error('❌ Error WebSocket:', error);
        });

        // Conectar WebSocket
        websocketService.connect();

        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            websocketService.disconnect();
        };
    }, []);

    // Función para reconectar manualmente
    const reconnect = () => {
        console.log('🔄 Intentando reconectar...');
        websocketService.disconnect();
        setTimeout(() => {
            websocketService.connect();
        }, 1000);
    };

    // Verificar si hay datos válidos
    const hasValidData = () => {
        return (
            sensorData.temperatura !== null ||
            sensorData.pasos !== null ||
            sensorData.temperatura_objeto !== null ||
            sensorData.conductancia !== null
        );
    };

    return {
        isConnected,
        lastMessage,
        connectionError,
        sensorData, // Datos del WebSocket
        rawSensorData: sensorData,
        reconnect,
        hasValidData,

        // Funciones auxiliares para verificar datos específicos
        hasTemperature: () => sensorData.temperatura !== null,
        hasSteps: () => sensorData.pasos !== null,
        hasBodyTemperature: () => sensorData.temperatura_objeto !== null,
        hasHydration: () => sensorData.conductancia !== null,

        // Función para obtener resumen de los datos
        getSensorSummary: () => ({
            connected: isConnected,
            dataPoints: {
                temperatura: sensorData.temperatura !== null,
                presion: sensorData.presion !== null,
                humedad: sensorData.humedad !== null,
                pasos: sensorData.pasos !== null,
                temperatura_objeto: sensorData.temperatura_objeto !== null,
                conductancia: sensorData.conductancia !== null
            },
            lastUpdate: lastMessage?.timestamp
        }),

        // Función para enviar datos (si necesitas enviar algo al WebSocket)
        sendData: (data) => {
            websocketService.send(data);
        },

        // Obtener estadísticas de conexión
        getConnectionStats: () => {
            return websocketService.getStats();
        }
    };
};