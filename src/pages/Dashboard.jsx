// src/pages/Dashboard.jsx - CORREGIDO PARA DATOS REALES + SHORT POLLING SOLO PARA PASOS
import { useState, useEffect } from 'react';
import { DashboardStats } from '../components/organisms/DashboardStats';
import { Chart } from '../components/molecules/Chart';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import { Badge } from '../components/atoms/Badge';
import { Icon } from '../components/atoms/Icon';
import {WebSocketDebugger} from "./WebSocketDebugger.jsx";
import { BodyTemperatureChart } from '../components/molecules/BodyTemperatureChart';
import {GyroscopeRingChart} from "../components/molecules/GyroscopeRingChart.jsx";

export default function Dashboard() {
    const {
        isConnected: apiConnected,
        isLoading,
        error,
        currentValues,
        lastUpdate,
        refreshData,
        startPolling,
        stopPolling
    } = useApi({
        autoStart: true,
        pollingInterval: 2000,
        onError: (err) => console.error('Error en Dashboard:', err)
    });

    // Hook de WebSocket para datos en tiempo real
    const {
        isConnected: wsConnected,
        sensorData: wsSensorData,
        rawSensorData,
        lastMessage,
        reconnect,
        hasValidData,
        getSensorSummary
    } = useWebSocket();

    // Estado para datos históricos de gráficos
    const [temperatureHistory, setTemperatureHistory] = useState([]);
    const [activityHistory, setActivityHistory] = useState([]);

    // ✨ NUEVO: Estado específico para pasos con short polling
    const [stepsFromPolling, setStepsFromPolling] = useState(null);

    // Log para debug
    useEffect(() => {
        console.log('🔍 Debug Dashboard:', {
            apiConnected,
            wsConnected,
            currentValues,
            wsSensorData,
            hasValidData: hasValidData(),
            summary: getSensorSummary()
        });
    }, [apiConnected, wsConnected, currentValues, wsSensorData, hasValidData, getSensorSummary]);

    // ✨ NUEVO: Short polling exclusivo para pasos
    useEffect(() => {
        const fetchSteps = async () => {
            try {
                console.log('👟 Short polling para pasos...');

                const token = localStorage.getItem('token');
                const response = await fetch('https://vivaltest-back.namixcode.cc/mpu', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('📊 Respuesta de /mpu:', result);

                    // Tu amigo ya implementó que en /mpu el campo "pasos" muestra el total
                    const totalSteps = result.pasos || 0;
                    console.log('👟 Pasos del short polling:', totalSteps);
                    setStepsFromPolling(totalSteps);
                } else {
                    console.warn('⚠️ Error en short polling de pasos:', response.status);
                }
            } catch (error) {
                console.error('❌ Error en short polling de pasos:', error);
            }
        };

        if (apiConnected) {
            // Ejecutar inmediatamente
            fetchSteps();

            // Short polling cada 5 segundos solo para pasos
            const interval = setInterval(fetchSteps, 5000);
            console.log('🔄 Short polling de pasos iniciado');

            return () => {
                clearInterval(interval);
                console.log('⏹️ Short polling de pasos detenido');
            };
        }
    }, [apiConnected]);

    // Actualizar gráfica de temperatura con datos de API o WebSocket
    useEffect(() => {
        // Priorizar WebSocket, luego API
        const currentTemp = wsSensorData?.temperatura_objeto ||
            wsSensorData?.temperatura ||
            currentValues?.temperatura_corporal ||
            currentValues?.temperatura_ambiente;

        if (currentTemp !== null && currentTemp !== undefined) {
            console.log('📈 Actualizando gráfica de temperatura con:', currentTemp);

            setTemperatureHistory(prev => {
                const newData = [...prev];
                const currentTime = new Date().toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });

                newData.push({
                    label: currentTime,
                    value: currentTemp
                });

                // Mantener solo las últimas 20 entradas
                return newData.slice(-20);
            });
        }
    }, [wsSensorData, currentValues]);

    // ✨ MODIFICADO: Actualizar gráfica de actividad con pasos del short polling
    useEffect(() => {
        // Usar pasos del short polling si están disponibles, sino usar WebSocket/API
        const currentSteps = stepsFromPolling !== null ? stepsFromPolling :
            (wsSensorData?.pasos || currentValues?.pasos);

        if (currentSteps !== null && currentSteps !== undefined) {
            const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            const today = new Date().getDay();
            const currentDay = days[today === 0 ? 6 : today - 1];

            setActivityHistory(prev => {
                let newData = [...prev];

                // Si no hay datos previos, inicializar
                if (newData.length === 0) {
                    newData = days.map(day => ({
                        label: day,
                        value: day === currentDay ? currentSteps : 0
                    }));
                } else {
                    // Actualizar el día actual
                    const existingDayIndex = newData.findIndex(d => d.label === currentDay);
                    if (existingDayIndex >= 0) {
                        newData[existingDayIndex].value = currentSteps;
                    }
                }

                return newData;
            });
        }
    }, [stepsFromPolling, wsSensorData?.pasos, currentValues?.pasos]);

    // Inicializar gráficas con datos por defecto si están vacías
    useEffect(() => {
        if (temperatureHistory.length === 0) {
            const defaultTempData = Array.from({ length: 10 }, (_, i) => ({
                label: `${String(i * 2).padStart(2, '0')}:00`,
                value: 36.5 + (Math.random() - 0.5) * 1.5
            }));
            setTemperatureHistory(defaultTempData);
        }

        if (activityHistory.length === 0) {
            const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            const defaultActivityData = days.map(day => ({
                label: day,
                value: 0
            }));
            setActivityHistory(defaultActivityData);
        }
    }, []);

    // Funciones helper
    const isValidNumber = (value) => {
        return value !== null && value !== undefined && !isNaN(value) && isFinite(value);
    };

    const formatValue = (value, decimals = 1) => {
        return isValidNumber(value) ? Number(value).toFixed(decimals) : '--';
    };

    // ✨ MODIFICADO: Combinar datos para estadísticas (usar pasos del short polling cuando disponible)
    const stats = {
        bodyTemp: wsSensorData?.temperatura_objeto || currentValues?.temperatura_corporal || null,
        steps: stepsFromPolling !== null ? stepsFromPolling : (wsSensorData?.pasos || currentValues?.pasos || 0),
        ambientTemp: wsSensorData?.temperatura || currentValues?.temperatura_ambiente || null,
        hydration: (wsSensorData?.conductancia ? wsSensorData.conductancia * 100 : null) ||
            (currentValues?.conductancia ? currentValues.conductancia * 100 : null) ||
            null
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard VitalVest</h1>
                <div className="flex items-center space-x-4">
                    {/* Estado de conexiones */}
                    <div className="flex items-center space-x-2">
                        <Badge variant={apiConnected ? 'success' : 'danger'} size="sm">
                            API {apiConnected ? 'Conectada' : 'Desconectada'}
                        </Badge>
                        <Badge variant={wsConnected ? 'success' : 'danger'} size="sm">
                            WebSocket {wsConnected ? 'Conectado' : 'Desconectado'}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Estadísticas principales */}
            <DashboardStats stats={stats} />

            {/* DATOS EN TIEMPO REAL - COMBINANDO API Y WEBSOCKET */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Datos en Tiempo Real
                    </h3>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                            Fuente: {wsConnected ? 'WebSocket' : apiConnected ? 'API' : 'Sin conexión'}
                        </span>
                    </div>
                </div>

                {/* Grid de sensores */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {/* Temperatura Ambiente (BME280) */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(wsSensorData?.temperatura || currentValues?.temperatura_ambiente)
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="thermometer" size={20} className={`mr-2 ${
                                isValidNumber(wsSensorData?.temperatura || currentValues?.temperatura_ambiente)
                                    ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(wsSensorData?.temperatura || currentValues?.temperatura_ambiente)
                                    ? 'text-blue-800' : 'text-gray-600'
                            }`}>
                                Temp. Ambiente
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(wsSensorData?.temperatura || currentValues?.temperatura_ambiente)
                                ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                            {formatValue(wsSensorData?.temperatura || currentValues?.temperatura_ambiente)}°C
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(wsSensorData?.temperatura || currentValues?.temperatura_ambiente)
                                ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                            BME280
                        </p>
                    </div>

                    {/* Temperatura Corporal (MLX90614) */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(wsSensorData?.temperatura_objeto || currentValues?.temperatura_corporal)
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="heart" size={20} className={`mr-2 ${
                                isValidNumber(wsSensorData?.temperatura_objeto || currentValues?.temperatura_corporal)
                                    ? 'text-red-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(wsSensorData?.temperatura_objeto || currentValues?.temperatura_corporal)
                                    ? 'text-red-800' : 'text-gray-600'
                            }`}>
                                Temp. Corporal
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(wsSensorData?.temperatura_objeto || currentValues?.temperatura_corporal)
                                ? 'text-red-600' : 'text-gray-400'
                        }`}>
                            {formatValue(wsSensorData?.temperatura_objeto || currentValues?.temperatura_corporal)}°C
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(wsSensorData?.temperatura_objeto || currentValues?.temperatura_corporal)
                                ? 'text-red-600' : 'text-gray-500'
                        }`}>
                            MLX90614
                        </p>
                    </div>

                    {/* Humedad */}
                    <div className={`rounded-lng p-4 text-center border-2 ${
                        isValidNumber(wsSensorData?.humedad || currentValues?.humedad_relativa)
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="droplet" size={20} className={`mr-2 ${
                                isValidNumber(wsSensorData?.humedad || currentValues?.humedad_relativa)
                                    ? 'text-green-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(wsSensorData?.humedad || currentValues?.humedad_relativa)
                                    ? 'text-green-800' : 'text-gray-600'
                            }`}>
                                Humedad
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(wsSensorData?.humedad || currentValues?.humedad_relativa)
                                ? 'text-green-600' : 'text-gray-400'
                        }`}>
                            {formatValue(wsSensorData?.humedad || currentValues?.humedad_relativa)}%
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(wsSensorData?.humedad || currentValues?.humedad_relativa)
                                ? 'text-green-600' : 'text-gray-500'
                        }`}>
                            Relativa
                        </p>
                    </div>

                    {/* ✨ MODIFICADO: Pasos (MPU6050) - Mostrar pasos del short polling */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(stepsFromPolling !== null ? stepsFromPolling : (wsSensorData?.pasos || currentValues?.pasos))
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="activity" size={20} className={`mr-2 ${
                                isValidNumber(stepsFromPolling !== null ? stepsFromPolling : (wsSensorData?.pasos || currentValues?.pasos))
                                    ? 'text-orange-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(stepsFromPolling !== null ? stepsFromPolling : (wsSensorData?.pasos || currentValues?.pasos))
                                    ? 'text-orange-800' : 'text-gray-600'
                            }`}>
                                Pasos
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(stepsFromPolling !== null ? stepsFromPolling : (wsSensorData?.pasos || currentValues?.pasos))
                                ? 'text-orange-600' : 'text-gray-400'
                        }`}>
                            {stepsFromPolling !== null ? stepsFromPolling.toLocaleString() :
                                (wsSensorData?.pasos || currentValues?.pasos || '--')}
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(stepsFromPolling !== null ? stepsFromPolling : (wsSensorData?.pasos || currentValues?.pasos))
                                ? 'text-orange-600' : 'text-gray-500'
                        }`}>
                            MPU6050 {stepsFromPolling !== null ? '(Short Polling)' : ''}
                        </p>
                    </div>

                    {/* Hidratación (GSR) */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(wsSensorData?.conductancia || currentValues?.conductancia)
                            ? 'bg-indigo-50 border-indigo-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="droplet" size={20} className={`mr-2 ${
                                isValidNumber(wsSensorData?.conductancia || currentValues?.conductancia)
                                    ? 'text-indigo-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(wsSensorData?.conductancia || currentValues?.conductancia)
                                    ? 'text-indigo-800' : 'text-gray-600'
                            }`}>
                                Hidratación
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(wsSensorData?.conductancia || currentValues?.conductancia)
                                ? 'text-indigo-600' : 'text-gray-400'
                        }`}>
                            {formatValue((wsSensorData?.conductancia || currentValues?.conductancia) * 100, 0)}%
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(wsSensorData?.conductancia || currentValues?.conductancia)
                                ? 'text-indigo-600' : 'text-gray-500'
                        }`}>
                            {wsSensorData?.estado_hidratacion || currentValues?.estado_hidratacion || 'GSR'}
                        </p>
                    </div>

                    {/* Presión Atmosférica */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(wsSensorData?.presion || currentValues?.presion)
                            ? 'bg-purple-50 border-purple-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="activity" size={20} className={`mr-2 ${
                                isValidNumber(wsSensorData?.presion || currentValues?.presion)
                                    ? 'text-purple-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(wsSensorData?.presion || currentValues?.presion)
                                    ? 'text-purple-800' : 'text-gray-600'
                            }`}>
                                Presión
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(wsSensorData?.presion || currentValues?.presion)
                                ? 'text-purple-600' : 'text-gray-400'
                        }`}>
                            {formatValue(wsSensorData?.presion || currentValues?.presion, 0)}
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(wsSensorData?.presion || currentValues?.presion)
                                ? 'text-purple-600' : 'text-gray-500'
                        }`}>
                            hPa
                        </p>
                    </div>
                </div>

                {/* ✨ NUEVO: Información del short polling de pasos */}
                {stepsFromPolling !== null && (
                    <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center space-x-2">
                            <Icon name="activity" size={16} className="text-orange-600" />
                            <p className="text-sm text-orange-800">
                                <strong>Pasos obtenidos via Short Polling:</strong> {stepsFromPolling.toLocaleString()}
                            </p>
                        </div>
                        <p className="text-xs text-orange-600 mt-1">
                            📡 Datos actualizados cada 5 segundos desde /mpu (implementado por tu amigo)
                        </p>
                    </div>
                )}

                {/* Información de último mensaje */}
                {(lastMessage || lastUpdate) && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                            <strong>Última actualización:</strong> {
                            lastMessage?.timestamp ?
                                new Date(lastMessage.timestamp).toLocaleString() :
                                lastUpdate ? new Date(lastUpdate).toLocaleString() :
                                    'No disponible'
                        }
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Fuente: {wsConnected ? 'WebSocket en tiempo real' : apiConnected ? 'API REST' : 'Sin conexión'}
                        </p>
                        {stepsFromPolling !== null && (
                            <p className="text-xs text-gray-500 mt-1">
                                👟 Pasos: Short Polling independiente cada 5 segundos
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200">
                    <Chart
                        type="bar"
                        title={`Actividad Semanal ${stepsFromPolling !== null ? '(Short Polling)' : '(Pasos)'}`}
                        data={activityHistory}
                    />
                </div>

                <div className="bg-white rounded-lg border border-gray-200">
                    <Chart
                        type="line"
                        title={`Temperatura ${wsConnected ? '(WebSocket)' : apiConnected ? '(API)' : '(Sin datos)'}`}
                        data={temperatureHistory}
                    />
                </div>
            </div>

            {/* Gráfica de temperatura corporal */}
            <BodyTemperatureChart
                data={wsSensorData?.temperatura_objeto || currentValues?.temperatura_corporal}
                isConnected={wsConnected || apiConnected}
            />

            {/* Estado de conexión detallado */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Estado de Conexiones
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg border-2 ${
                        apiConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                        <h4 className={`font-medium ${apiConnected ? 'text-green-800' : 'text-red-800'}`}>
                            API REST
                        </h4>
                        <p className={`text-sm mt-1 ${apiConnected ? 'text-green-600' : 'text-red-600'}`}>
                            {apiConnected ? '✅ Conectada y obteniendo datos' : '❌ Sin conexión'}
                        </p>
                        {isLoading && <p className="text-sm text-blue-600 mt-1">🔄 Cargando...</p>}
                        {error && <p className="text-sm text-red-600 mt-1">⚠️ {error.message}</p>}
                    </div>

                    <div className={`p-4 rounded-lg border-2 ${
                        wsConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                        <h4 className={`font-medium ${wsConnected ? 'text-green-800' : 'text-red-800'}`}>
                            WebSocket
                        </h4>
                        <p className={`text-sm mt-1 ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
                            {wsConnected ? '✅ Conectado en tiempo real' : '❌ Sin conexión'}
                        </p>
                        {!wsConnected && (
                            <button
                                onClick={reconnect}
                                className="text-sm text-blue-600 hover:text-blue-800 mt-1"
                            >
                                🔄 Reconectar
                            </button>
                        )}
                    </div>
                </div>

                {/* ✨ NUEVO: Estado del Short Polling para pasos */}
                {apiConnected && (
                    <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                        <h4 className="font-medium text-yellow-800">👟 Short Polling para Pasos</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                            {stepsFromPolling !== null ?
                                `✅ Activo - Último valor: ${stepsFromPolling.toLocaleString()} pasos` :
                                '🔄 Iniciando...'}
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">
                            Peticiones independientes a /mpu cada 5 segundos
                        </p>
                    </div>
                )}

                <GyroscopeRingChart
                    data={wsSensorData}
                    isConnected={wsConnected}
                />

                <WebSocketDebugger sensorData={wsSensorData} lastMessage={lastMessage} />
            </div>
        </div>
    );
}