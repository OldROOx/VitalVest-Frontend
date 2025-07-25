// src/pages/Dashboard.jsx - CORREGIDO PARA DATOS REALES
import { useState, useEffect } from 'react';
import { DashboardStats } from '../components/organisms/DashboardStats';
import { Chart } from '../components/molecules/Chart';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import { Badge } from '../components/atoms/Badge';
import { Icon } from '../components/atoms/Icon';
import {WebSocketDebugger} from "./WebSocketDebugger.jsx";
import { BodyTemperatureChart } from '../components/molecules/BodyTemperatureChart';

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

    // Actualizar gráfica de actividad con datos de pasos
    useEffect(() => {
        const currentSteps = wsSensorData?.pasos || currentValues?.pasos;

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
                        newData[existingDayIndex].value += currentSteps;
                    }
                }

                return newData;
            });
        }
    }, [wsSensorData?.pasos, currentValues?.pasos]);

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

    // Combinar datos para estadísticas (priorizar WebSocket sobre API)
    const stats = {
        bodyTemp: wsSensorData?.temperatura_objeto || currentValues?.temperatura_corporal || null,
        steps: wsSensorData?.pasos || currentValues?.pasos || 0,
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
                    <div className={`rounded-lg p-4 text-center border-2 ${
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

                    {/* Pasos (MPU6050) */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(wsSensorData?.pasos || currentValues?.pasos)
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="activity" size={20} className={`mr-2 ${
                                isValidNumber(wsSensorData?.pasos || currentValues?.pasos)
                                    ? 'text-orange-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(wsSensorData?.pasos || currentValues?.pasos)
                                    ? 'text-orange-800' : 'text-gray-600'
                            }`}>
                                Pasos
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(wsSensorData?.pasos || currentValues?.pasos)
                                ? 'text-orange-600' : 'text-gray-400'
                        }`}>
                            {wsSensorData?.pasos || currentValues?.pasos || '--'}
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(wsSensorData?.pasos || currentValues?.pasos)
                                ? 'text-orange-600' : 'text-gray-500'
                        }`}>
                            MPU6050
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
                    </div>
                )}
            </div>

            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200">
                    <Chart
                        type="bar"
                        title="Actividad Semanal (Pasos)"
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
                <WebSocketDebugger sensorData={wsSensorData} lastMessage={lastMessage} />
            </div>
        </div>
    );
}