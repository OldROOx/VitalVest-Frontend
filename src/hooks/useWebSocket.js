// src/hooks/useWebSocket.js
import { useState, useEffect, useRef } from 'react';
import { websocketService } from '../services/websocketService';

export const useWebSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [connectionError, setConnectionError] = useState(null);

    const [sensorData, setSensorData] = useState({
        temperatura: null,           // BME280
        presion: null,
        humedad: null,
        temperatura_objeto: null,    // MLX90614
        temperatura_ambiente: null,
        aceleracion: { x: null, y: null, z: null }, // MPU6050
        giroscopio: { x: null, y: null, z: null }
    });

    const retryTimeoutRef = useRef(null);

    useEffect(() => {
        websocketService.onOpen(() => {
            setIsConnected(true);
            setConnectionError(null);
            console.log('🟢 WebSocket conectado desde React');

            // ✅ Reiniciar datos para evitar mostrar valores antiguos
            setSensorData({
                temperatura: null,
                presion: null,
                humedad: null,
                temperatura_objeto: null,
                temperatura_ambiente: null,
                aceleracion: { x: null, y: null, z: null },
                giroscopio: { x: null, y: null, z: null }
            });
        });

        websocketService.onMessage((data) => {
            setLastMessage({
                ...data,
                timestamp: new Date().toISOString()
            });

            console.log('📨 Nuevos datos de sensores:', data);

            // ✅ Mapeo desde la estructura real del WebSocket
            const bme = data.bme280 || {};
            const mlx = data.mlx90614 || {};
            const mpu = data.mpu6050 || {};

            setSensorData({
                temperatura: bme.temperatura ?? null,
                presion: bme.presion ?? null,
                humedad: bme.humedad ?? null,
                temperatura_objeto: mlx.temp_objeto ?? null,
                temperatura_ambiente: mlx.temperatura_ambiente ?? null,
                aceleracion: {
                    x: mpu.aceleracion?.x ?? null,
                    y: mpu.aceleracion?.y ?? null,
                    z: mpu.aceleracion?.z ?? null
                },
                giroscopio: {
                    x: mpu.giroscopio?.x ?? null,
                    y: mpu.giroscopio?.y ?? null,
                    z: mpu.giroscopio?.z ?? null
                }
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

        websocketService.connect();

        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            websocketService.disconnect();
        };
    }, []);

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
        reconnect,
        hasTemperature: () => sensorData.temperatura !== null,
        hasAcceleration: () => sensorData.aceleracion.x !== null,
        hasGyroscope: () => sensorData.giroscopio.x !== null,
        getSensorSummary: () => ({
            connected: isConnected,
            dataPoints: {
                temperatura: sensorData.temperatura !== null,
                presion: sensorData.presion !== null,
                humedad: sensorData.humedad !== null,
                aceleracion: sensorData.aceleracion.x !== null,
                giroscopio: sensorData.giroscopio.x !== null,
                temperatura_objeto: sensorData.temperatura_objeto !== null
            },
            lastUpdate: lastMessage?.timestamp
        })
    };
};