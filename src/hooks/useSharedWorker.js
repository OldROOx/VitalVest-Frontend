// src/hooks/useSharedWorker.js
import { useState, useEffect, useRef, useCallback } from 'react';

export const useSharedWorker = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const [apiPolling, setApiPolling] = useState(false);
    const [sensorData, setSensorData] = useState({});
    const [apiData, setApiData] = useState(null);
    const [error, setError] = useState(null);
    const [workerStats, setWorkerStats] = useState({
        connections: 0,
        lastUpdate: null
    });

    const workerRef = useRef(null);
    const portRef = useRef(null);
    const hasInitialized = useRef(false);

    // Inicializar Shared Worker
    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        try {
            console.log('🔧 Inicializando Shared Worker...');

            // Crear Shared Worker
            workerRef.current = new SharedWorker('/sharedWorker.js', {
                name: 'vitalvest-worker'
            });

            const port = workerRef.current.port;
            portRef.current = port;

            // Manejar mensajes del worker
            port.onmessage = (event) => {
                const { type, data, state, connected, error: workerError } = event.data;

                console.log('📩 Mensaje del Shared Worker:', type);

                switch (type) {
                    case 'WORKER_READY':
                        console.log('✅ Shared Worker listo:', state);
                        setIsConnected(true);
                        setWsConnected(state.isWebSocketConnected);
                        setApiPolling(state.isApiPolling);
                        setSensorData(state.sensorData || {});
                        setWorkerStats({
                            connections: state.connections,
                            lastUpdate: new Date().toISOString()
                        });
                        break;

                    case 'WS_STATUS':
                        console.log('🔌 Estado WebSocket:', connected);
                        setWsConnected(connected);
                        break;

                    case 'WS_DATA':
                        console.log('📦 Datos WebSocket:', data);
                        setSensorData(data);
                        setWorkerStats(prev => ({
                            ...prev,
                            lastUpdate: new Date().toISOString()
                        }));
                        break;

                    case 'API_DATA':
                        console.log('📊 Datos API:', data);
                        setApiData(data);
                        setWorkerStats(prev => ({
                            ...prev,
                            lastUpdate: new Date().toISOString()
                        }));
                        break;

                    case 'WS_ERROR':
                    case 'API_ERROR':
                        console.error('❌ Error del worker:', workerError);
                        setError(workerError);
                        break;

                    case 'STATE_UPDATE':
                        setWsConnected(state.isWebSocketConnected);
                        setApiPolling(state.isApiPolling);
                        setSensorData(state.sensorData || {});
                        setWorkerStats({
                            connections: state.connections,
                            lastUpdate: new Date().toISOString()
                        });
                        break;

                    case 'PONG':
                        console.log('🏓 Pong recibido del worker');
                        break;

                    default:
                        console.warn('⚠️ Tipo de mensaje desconocido:', type);
                }
            };

            port.onerror = (error) => {
                console.error('❌ Error en puerto del Shared Worker:', error);
                setError('Error de comunicación con Shared Worker');
                setIsConnected(false);
            };

            // Iniciar puerto
            port.start();

            // Enviar token de autenticación si existe
            const token = localStorage.getItem('token');
            if (token) {
                port.postMessage({
                    type: 'SET_AUTH_TOKEN',
                    data: { token }
                });
            }

            console.log('✅ Shared Worker inicializado correctamente');

        } catch (error) {
            console.error('❌ Error inicializando Shared Worker:', error);
            setError('No se pudo inicializar Shared Worker: ' + error.message);
            setIsConnected(false);
        }

        // Cleanup al desmontar
        return () => {
            if (portRef.current) {
                console.log('🧹 Limpiando conexión con Shared Worker');
                portRef.current.close();
            }
        };
    }, []);

    // Funciones de control
    const startWebSocket = useCallback(() => {
        if (portRef.current) {
            console.log('▶️ Iniciando WebSocket desde pestaña');
            portRef.current.postMessage({ type: 'START_WEBSOCKET' });
        }
    }, []);

    const stopWebSocket = useCallback(() => {
        if (portRef.current) {
            console.log('⏸️ Deteniendo WebSocket desde pestaña');
            portRef.current.postMessage({ type: 'STOP_WEBSOCKET' });
        }
    }, []);

    const startApiPolling = useCallback((interval = 3000) => {
        if (portRef.current) {
            console.log('▶️ Iniciando API polling desde pestaña');
            portRef.current.postMessage({
                type: 'START_API_POLLING',
                data: { interval }
            });
            setApiPolling(true);
        }
    }, []);

    const stopApiPolling = useCallback(() => {
        if (portRef.current) {
            console.log('⏸️ Deteniendo API polling desde pestaña');
            portRef.current.postMessage({ type: 'STOP_API_POLLING' });
            setApiPolling(false);
        }
    }, []);

    const updateAuthToken = useCallback((token) => {
        if (portRef.current) {
            console.log('🔐 Actualizando token de autenticación');
            portRef.current.postMessage({
                type: 'SET_AUTH_TOKEN',
                data: { token }
            });
        }
    }, []);

    const getState = useCallback(() => {
        if (portRef.current) {
            portRef.current.postMessage({ type: 'GET_STATE' });
        }
    }, []);

    const ping = useCallback(() => {
        if (portRef.current) {
            portRef.current.postMessage({ type: 'PING' });
        }
    }, []);

    return {
        // Estado
        isConnected,
        wsConnected,
        apiPolling,
        sensorData,
        apiData,
        error,
        workerStats,

        // Funciones de control
        startWebSocket,
        stopWebSocket,
        startApiPolling,
        stopApiPolling,
        updateAuthToken,
        getState,
        ping,

        // Datos procesados
        currentValues: {
            temperatura_ambiente: sensorData?.bme280?.temperatura || apiData?.BME?.BME?.[0]?.temperatura || null,
            humedad_relativa: sensorData?.bme280?.humedad || apiData?.BME?.BME?.[0]?.humedad || null,
            presion: sensorData?.bme280?.presion || apiData?.BME?.BME?.[0]?.presion || null,
            temperatura_corporal: sensorData?.mlx90614?.temp_objeto || apiData?.MLX?.MLX?.[0]?.temperatura_objeto || null,
            temperatura_ambiente_mlx: sensorData?.mlx90614?.temperatura_ambiente || apiData?.MLX?.MLX?.[0]?.temperatura_ambiente || null,
            pasos: sensorData?.mpu6050?.pasos || apiData?.MPU?.MPU?.[0]?.pasos || null,
            conductancia: sensorData?.GSR?.conductancia || apiData?.GSR?.GSR?.[0]?.conductancia || null,
            porcentaje: sensorData?.GSR?.Porcentaje || sensorData?.GSR?.porcentaje || apiData?.GSR?.GSR?.[0]?.porcentaje || null,
            estado_hidratacion: sensorData?.GSR?.estado_hidratacion || apiData?.GSR?.GSR?.[0]?.estado_hidratacion || null
        },

        // Verificaciones
        hasValidData: () => {
            return Object.keys(sensorData).length > 0 || apiData !== null;
        }
    };
};