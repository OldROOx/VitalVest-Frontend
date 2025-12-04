// src/hooks/useWebSocket.js - FIX PARA MAYÚSCULAS/MINÚSCULAS
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
        pasos: null,
        temperatura_ambiente: null,
        temperatura_objeto: null,
        conductancia: null,
        porcentaje: null,
        estado_hidratacion: null
    });

    const retryTimeoutRef = useRef(null);

    useEffect(() => {
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

            setSensorData(prevData => {
                const newData = { ...prevData };

                // BME280
                if (data.bme280) {
                    newData.temperatura = data.bme280.temperatura;
                    newData.presion = data.bme280.presion;
                    newData.humedad = data.bme280.humedad;
                }

                // MPU6050 - FIX: Manejar tanto "Pasos" como "pasos"
                if (data.mpu6050) {
                    newData.pasos = data.mpu6050.Pasos || data.mpu6050.pasos || 0;
                    console.log('👟 MPU6050 pasos:', newData.pasos);
                }

                // MLX90614
                if (data.mlx90614) {
                    newData.temperatura_ambiente = data.mlx90614.temperatura_ambiente;
                    newData.temperatura_objeto = data.mlx90614.temp_objeto;
                }

                // GSR - FIX: Manejar tanto "Porcentaje" (mayúscula) como "porcentaje" (minúscula)
                if (data.GSR) {
                    console.log('🔧 GSR Raw data:', data.GSR);

                    // Buscar el campo porcentaje en diferentes formatos
                    const porcentajeValue = data.GSR.Porcentaje || data.GSR.porcentaje || data.GSR.PORCENTAJE;

                    if (porcentajeValue !== undefined && porcentajeValue !== null) {
                        newData.porcentaje = porcentajeValue;
                        newData.conductancia = porcentajeValue / 100;

                        console.log('🔧 GSR Datos procesados:', {
                            porcentaje_original: porcentajeValue,
                            porcentaje_guardado: newData.porcentaje,
                            conductancia_calculada: newData.conductancia
                        });

                        // Clasificar nivel de hidratación
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

                console.log('✅ Datos finales actualizados:', newData);
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

        websocketService.connect();

        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            websocketService.disconnect();
        };
    }, []);

    const reconnect = () => {
        console.log('🔄 Intentando reconectar...');
        websocketService.disconnect();
        setTimeout(() => {
            websocketService.connect();
        }, 1000);
    };

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
        sensorData,
        rawSensorData: sensorData,
        reconnect,
        hasValidData,
        hasTemperature: () => sensorData.temperatura !== null,
        hasSteps: () => sensorData.pasos !== null,
        hasBodyTemperature: () => sensorData.temperatura_objeto !== null,
        hasHydration: () => sensorData.conductancia !== null || sensorData.porcentaje !== null,
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
        sendData: (data) => {
            websocketService.send(data);
        },
        getConnectionStats: () => {
            return websocketService.getStats();
        }
    };
};