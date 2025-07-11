// src/hooks/useApi.js
import { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/apiService';

export const useApi = (options = {}) => {
    const {
        autoStart = true,
        pollingInterval = 3000,
        onError = null
    } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);

    const hasInitialized = useRef(false);

    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        // Configurar callbacks del servicio de API
        apiService.onData((newData) => {
            setData(newData);
            setIsLoading(false);
            setError(null);
            setLastUpdate(new Date());
            console.log('📊 Datos actualizados desde API:', newData);
        });

        apiService.onError((error) => {
            setError(error);
            setIsLoading(false);
            setIsConnected(false);
            console.error('❌ Error en API:', error);

            if (onError) {
                onError(error);
            }
        });

        apiService.onConnection((connected) => {
            setIsConnected(connected);
            if (connected) {
                setError(null);
            }
        });

        // Iniciar polling automáticamente si está configurado
        if (autoStart) {
            apiService.startPolling(pollingInterval);
        }

        // Cleanup al desmontar
        return () => {
            apiService.stopPolling();
        };
    }, [autoStart, pollingInterval, onError]);

    // Funciones para controlar el polling
    const startPolling = (interval = pollingInterval) => {
        apiService.startPolling(interval);
    };

    const stopPolling = () => {
        apiService.stopPolling();
    };

    const refreshData = async () => {
        setIsLoading(true);
        await apiService.fetchAllData();
    };

    // Obtener datos específicos de sensores
    const getSensorData = () => {
        return data?.sensors || null;
    };

    const getCurrentSensorValues = () => {
        return data?.sensors?.current || {};
    };

    const getSensorHistory = () => {
        return data?.sensors?.history || {};
    };

    const getSensorStats = () => {
        return data?.sensors?.stats || {};
    };

    const getUsers = () => {
        return data?.users || [];
    };

    // Funciones para crear nuevos registros
    const createBME = async (bmeData) => {
        try {
            const result = await apiService.createBME(bmeData);
            await refreshData(); // Actualizar datos después de crear
            return result;
        } catch (error) {
            setError(error);
            throw error;
        }
    };

    const createGSR = async (gsrData) => {
        try {
            const result = await apiService.createGSR(gsrData);
            await refreshData();
            return result;
        } catch (error) {
            setError(error);
            throw error;
        }
    };

    const createMLX = async (mlxData) => {
        try {
            const result = await apiService.createMLX(mlxData);
            await refreshData();
            return result;
        } catch (error) {
            setError(error);
            throw error;
        }
    };

    const createMPU = async (mpuData) => {
        try {
            const result = await apiService.createMPU(mpuData);
            await refreshData();
            return result;
        } catch (error) {
            setError(error);
            throw error;
        }
    };

    // Verificar estado del servidor
    const checkServerStatus = async () => {
        try {
            const status = await apiService.checkServerStatus();
            return status;
        } catch (error) {
            setError(error);
            return null;
        }
    };

    return {
        // Estado
        isConnected,
        isLoading,
        error,
        data,
        lastUpdate,

        // Control de polling
        startPolling,
        stopPolling,
        refreshData,
        isPollingActive: apiService.isPollingActive(),

        // Datos de sensores
        sensorData: getSensorData(),
        currentValues: getCurrentSensorValues(),
        sensorHistory: getSensorHistory(),
        sensorStats: getSensorStats(),

        // Otros datos
        users: getUsers(),

        // Métodos para crear datos
        createBME,
        createGSR,
        createMLX,
        createMPU,

        // Utilidades
        checkServerStatus
    };
};