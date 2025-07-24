// src/hooks/useWebSocket.js - ADAPTADO PARA DATOS SIMULADOS
import { useState, useEffect, useRef } from 'react';
import { websocketService } from '../services/websocketService';

export const useWebSocket = () => {
    const [_isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [connectionError, setConnectionError] = useState(null);
    const [sensorData, setSensorData] = useState({
        // Estructura adaptada a tu backend
        temperatura: null,
        presion: null,
        humedad: null,
        pasos: null,
        temperatura_ambiente: null,
        temp_objeto: null,
        porcentaje: null
    });

    const retryTimeoutRef = useRef(null);
    const simulationIntervalRef = useRef(null);

    useEffect(() => {
        // Configurar callbacks del WebSocket
        websocketService.onOpen(() => {
            setIsConnected(true);
            setConnectionError(null);
            console.log('WebSocket conectado desde React');
        });

        websocketService.onMessage((data) => {
            console.log('📨 Datos recibidos del WebSocket:', data);

            setLastMessage({
                ...data,
                timestamp: new Date().toISOString()
            });

            // Procesar datos según tu estructura
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
                    newData.temp_objeto = data.mlx90614.temp_objeto;
                }

                if (data.GSR) {
                    newData.porcentaje = data.GSR.porcentaje;
                }

                return newData;
            });
        });

        websocketService.onClose(() => {
            setIsConnected(false);
            console.log('🔴 WebSocket desconectado - usando datos simulados');
            startSimulation(); // Iniciar simulación cuando WebSocket se desconecta
        });

        websocketService.onError((error) => {
            setConnectionError(error);
            setIsConnected(false);
            console.log('❌ Error WebSocket - iniciando simulación');
            startSimulation(); // Iniciar simulación en caso de error
        });

        // Intentar conectar WebSocket (estará deshabilitado, así que iniciará simulación)
        websocketService.connect();

        // Iniciar simulación inmediatamente ya que WebSocket está deshabilitado
        startSimulation();

        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            if (simulationIntervalRef.current) {
                clearInterval(simulationIntervalRef.current);
            }
            websocketService.disconnect();
        };
    }, []);

    // Función para simular datos en tiempo real
    const startSimulation = () => {
        if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
        }

        console.log('🎲 Iniciando simulación de datos de sensores...');

        // Generar datos iniciales
        generateSimulatedData();

        // Actualizar datos cada 3 segundos
        simulationIntervalRef.current = setInterval(() => {
            generateSimulatedData();
        }, 3000);
    };

    // Generar datos simulados realistas
    const generateSimulatedData = () => {
        const now = new Date();

        const simulatedData = {
            // BME280 - Datos ambientales
            temperatura: 20 + Math.random() * 15, // 20-35°C
            presion: 1000 + Math.random() * 50,   // 1000-1050 hPa
            humedad: 40 + Math.random() * 40,     // 40-80%

            // MPU6050 - Pasos (incrementales)
            pasos: Math.floor(Math.random() * 50), // 0-50 pasos por intervalo

            // MLX90614 - Temperatura corporal
            temperatura_ambiente: 22 + Math.random() * 6, // 22-28°C
            temp_objeto: 36 + Math.random() * 2,          // 36-38°C (temperatura corporal)

            // GSR - Hidratación
            porcentaje: Math.floor(50 + Math.random() * 40) // 50-90%
        };

        console.log('🎲 Datos simulados generados:', simulatedData);

        setSensorData(simulatedData);

        setLastMessage({
            bme280: {
                temperatura: simulatedData.temperatura,
                presion: simulatedData.presion,
                humedad: simulatedData.humedad
            },
            mpu6050: {
                pasos: simulatedData.pasos
            },
            mlx90614: {
                temperatura_ambiente: simulatedData.temperatura_ambiente,
                temp_objeto: simulatedData.temp_objeto
            },
            GSR: {
                porcentaje: simulatedData.porcentaje
            },
            timestamp: now.toISOString()
        });
    };

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
            sensorData.temp_objeto !== null ||
            sensorData.porcentaje !== null
        );
    };

    return {
        isConnected: false, // Siempre false ya que usamos simulación
        lastMessage,
        connectionError,
        sensorData, // Datos simulados o reales
        rawSensorData: sensorData,
        reconnect,
        hasValidData,

        // Funciones auxiliares para verificar datos específicos
        hasTemperature: () => sensorData.temperatura !== null,
        hasSteps: () => sensorData.pasos !== null,
        hasBodyTemperature: () => sensorData.temp_objeto !== null,
        hasHydration: () => sensorData.porcentaje !== null,

        // Función para obtener resumen de los datos
        getSensorSummary: () => ({
            connected: false, // Siempre false en simulación
            simulationActive: simulationIntervalRef.current !== null,
            dataPoints: {
                temperatura: sensorData.temperatura !== null,
                presion: sensorData.presion !== null,
                humedad: sensorData.humedad !== null,
                pasos: sensorData.pasos !== null,
                temp_objeto: sensorData.temp_objeto !== null,
                porcentaje: sensorData.porcentaje !== null
            },
            lastUpdate: lastMessage?.timestamp
        }),

        // Función para habilitar WebSocket real (si está disponible)
        enableWebSocket: () => {
            if (simulationIntervalRef.current) {
                clearInterval(simulationIntervalRef.current);
                simulationIntervalRef.current = null;
            }
            websocketService.enable();
        },

        // Función para volver a simulación
        enableSimulation: () => {
            websocketService.disable();
            startSimulation();
        }
    };
};