// src/hooks/useWebSocket.js - FIX PARA PORCENTAJE CON MAYÚSCULA
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
        conductancia: null,           // Mantener para compatibilidad con frontend
        porcentaje: null,             // Nuevo campo que envía la API
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

                // FIX: GSR maneja tanto "Porcentaje" (mayúscula) como "porcentaje" (minúscula)
                if (data.GSR) {
                    // Buscar el campo porcentaje en diferentes formatos
                    const porcentajeValue = data.GSR.Porcentaje || data.GSR.porcentaje || data.GSR.PORCENTAJE;

                    console.log('🔧 GSR Raw data:', data.GSR);
                    console.log('🔧 Porcentaje encontrado:', porcentajeValue);

                    if (porcentajeValue !== undefined && porcentajeValue !== null) {
                        // La API envía "Porcentaje", lo guardamos en ambos campos para compatibilidad
                        newData.porcentaje = porcentajeValue;
                        newData.conductancia = porcentajeValue / 100; // Convertir a decimal para compatibilidad

                        console.log('🔧 GSR Datos procesados:', {
                            porcentaje_original: porcentajeValue,
                            porcentaje_guardado: newData.porcentaje,
                            conductancia_calculada: newData.conductancia
                        });

                        // Clasificar nivel de hidratación basado en porcentaje
                        if (porcentajeValue >= 80) {
                            newData.estado_hidratacion = 'Muy bien hidratado';
                        } else if (porcentajeValue >= 60) {
                            newData.estado_hidratacion = 'Bien hidratado';
                        } else if (porcentajeValue >= 30) {
                            newData.estado_hidratacion = 'Moderadamente hidratado';
                        } else {
                            newData.estado_hidratacion = 'Deshidratado';
                        }

                        console.log('🔧 Estado hidratación calculado:', newData.estado_hidratacion);
                    } else {
                        console.warn('⚠️ No se encontró campo porcentaje en GSR:', data.GSR);
                    }
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
            sensorData.conductancia !== null ||
            sensorData.porcentaje !== null
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
        hasHydration: () => sensorData.conductancia !== null || sensorData.porcentaje !== null,

        // Función para obtener resumen de los datos
        getSensorSummary: () => ({
            connected: isConnected,
            dataPoints: {
                temperatura: sensorData.temperatura !== null,
                presion: sensorData.presion !== null,
                humedad: sensorData.humedad !== null,
                pasos: sensorData.pasos !== null,
                temperatura_objeto: sensorData.temperatura_objeto !== null,
                conductancia: sensorData.conductancia !== null,
                porcentaje: sensorData.porcentaje !== null
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