// src/pages/Dashboard.jsx - ERRORES CORREGIDOS
import { useState, useEffect } from 'react';
import { DashboardStats } from '../components/organisms/DashboardStats';
import { Chart } from '../components/molecules/Chart';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import { Badge } from '../components/atoms/Badge';
import { Icon } from '../components/atoms/Icon';
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
            wsConnected,
            wsSensorData,
            hasValidData: hasValidData(),
            summary: getSensorSummary()
        });
    }, [wsConnected, wsSensorData, hasValidData, getSensorSummary]);

    // Actualizar gráfica de temperatura con datos del WebSocket
    useEffect(() => {
        // Usar temperatura corporal (MLX90614) si está disponible, sino temperatura ambiente (BME280)
        const currentTemp = wsSensorData.temperatura_objeto || wsSensorData.temperatura;

        if (wsConnected && currentTemp !== null && currentTemp !== undefined) {
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
    }, [wsConnected, wsSensorData.temp_objeto, wsSensorData.temperatura]);

    // Actualizar gráfica de actividad con datos de pasos del MPU6050
    useEffect(() => {
        if (wsConnected && wsSensorData.pasos !== null) {
            const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            const today = new Date().getDay();
            const currentDay = days[today === 0 ? 6 : today - 1];

            setActivityHistory(prev => {
                const newData = [...prev];
                const existingDayIndex = newData.findIndex(d => d.label === currentDay);

                if (existingDayIndex >= 0) {
                    newData[existingDayIndex].value += wsSensorData.pasos;
                } else {
                    // Inicializar con datos de la semana
                    const baseData = days.map(day => ({
                        label: day,
                        value: day === currentDay ? wsSensorData.pasos : Math.floor(Math.random() * 5000 + 3000)
                    }));
                    return baseData;
                }

                return newData;
            });
        }
    }, [wsConnected, wsSensorData.pasos]);

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
                value: Math.floor(Math.random() * 5000 + 3000)
            }));
            setActivityHistory(defaultActivityData);
        }
    }, []); // Sin dependencias para que solo se ejecute una vez

    // Funciones helper
    const isValidNumber = (value) => {
        return value !== null && value !== undefined && !isNaN(value) && isFinite(value);
    };

    const formatValue = (value, decimals = 1) => {
        return isValidNumber(value) ? Number(value).toFixed(decimals) : '--';
    };

    // Combinar datos para estadísticas (adaptado a tu estructura de backend)
    const stats = {
        bodyTemp: wsSensorData.temp_objeto || currentValues?.temperatura_corporal || 36.5,
        steps: wsSensorData.pasos || currentValues?.pasos || 0,
        ambientTemp: wsSensorData.temperatura || currentValues?.temperatura_ambiente || 22.0,
        hydration: wsSensorData.porcentaje || (currentValues?.conductancia ? (currentValues.conductancia * 100) : 65)
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard VitalVest</h1>
            </div>

            {/* Estadísticas principales */}
            <DashboardStats stats={stats} />

            {/* DATOS EN TIEMPO REAL DEL WEBSOCKET - ADAPTADO A TU BACKEND */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Datos en Tiempo Real
                    </h3>
                    <div className="flex items-center space-x-2">
                        {wsConnected && (
                            <Badge variant="success" size="sm">
                                WebSocket Conectado
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Grid de sensores - ESTRUCTURA DE TU BACKEND */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {/* Temperatura Ambiente (BME280) */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(wsSensorData?.temperatura)
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="thermometer" size={20} className={`mr-2 ${
                                isValidNumber(wsSensorData?.temperatura) ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(wsSensorData?.temperatura) ? 'text-blue-800' : 'text-gray-600'
                            }`}>
                                Temp. Ambiente
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(wsSensorData?.temperatura) ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                            {formatValue(wsSensorData?.temperatura)}°C
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(wsSensorData?.temperatura) ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                            BME280
                        </p>
                    </div>

                    {/* Temperatura Corporal (MLX90614) */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(wsSensorData?.temp_objeto)
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="heart" size={20} className={`mr-2 ${
                                isValidNumber(wsSensorData?.temp_objeto) ? 'text-red-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(wsSensorData?.temp_objeto) ? 'text-red-800' : 'text-gray-600'
                            }`}>
                                Temp. Corporal
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(wsSensorData?.temp_objeto) ? 'text-red-600' : 'text-gray-400'
                        }`}>
                            {formatValue(wsSensorData?.temp_objeto)}°C
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(wsSensorData?.temp_objeto) ? 'text-red-600' : 'text-gray-500'
                        }`}>
                            MLX90614
                        </p>
                    </div>

                    {/* Humedad */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(wsSensorData?.humedad)
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="droplet" size={20} className={`mr-2 ${
                                isValidNumber(wsSensorData?.humedad) ? 'text-green-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(wsSensorData?.humedad) ? 'text-green-800' : 'text-gray-600'
                            }`}>
                                Humedad
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(wsSensorData?.humedad) ? 'text-green-600' : 'text-gray-400'
                        }`}>
                            {formatValue(wsSensorData?.humedad)}%
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(wsSensorData?.humedad) ? 'text-green-600' : 'text-gray-500'
                        }`}>
                            Relativa
                        </p>
                    </div>

                    {/* Pasos (MPU6050) */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(wsSensorData?.pasos)
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="activity" size={20} className={`mr-2 ${
                                isValidNumber(wsSensorData?.pasos) ? 'text-orange-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(wsSensorData?.pasos) ? 'text-orange-800' : 'text-gray-600'
                            }`}>
                                Pasos
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(wsSensorData?.pasos) ? 'text-orange-600' : 'text-gray-400'
                        }`}>
                            {wsSensorData?.pasos || '--'}
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(wsSensorData?.pasos) ? 'text-orange-600' : 'text-gray-500'
                        }`}>
                            MPU6050
                        </p>
                    </div>

                    {/* Hidratación (GSR) */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(wsSensorData?.porcentaje)
                            ? 'bg-indigo-50 border-indigo-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="droplet" size={20} className={`mr-2 ${
                                isValidNumber(wsSensorData?.porcentaje) ? 'text-indigo-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(wsSensorData?.porcentaje) ? 'text-indigo-800' : 'text-gray-600'
                            }`}>
                                Hidratación
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(wsSensorData?.porcentaje) ? 'text-indigo-600' : 'text-gray-400'
                        }`}>
                            {formatValue(wsSensorData?.porcentaje, 0)}%
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(wsSensorData?.porcentaje) ? 'text-indigo-600' : 'text-gray-500'
                        }`}>
                            GSR
                        </p>
                    </div>

                    {/* Presión Atmosférica */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(wsSensorData?.presion)
                            ? 'bg-purple-50 border-purple-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="activity" size={20} className={`mr-2 ${
                                isValidNumber(wsSensorData?.presion) ? 'text-purple-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(wsSensorData?.presion) ? 'text-purple-800' : 'text-gray-600'
                            }`}>
                                Presión
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(wsSensorData?.presion) ? 'text-purple-600' : 'text-gray-400'
                        }`}>
                            {formatValue(wsSensorData?.presion, 0)}
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(wsSensorData?.presion) ? 'text-purple-600' : 'text-gray-500'
                        }`}>
                            hPa
                        </p>
                    </div>
                </div>

                {/* Información de último mensaje */}
                {lastMessage && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                            <strong>Último mensaje recibido:</strong> {new Date(lastMessage.timestamp).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Sensores: {Object.keys(lastMessage).filter(key => key !== 'timestamp').join(', ')}
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
                        title={`Temperatura ${wsConnected ? '(Tiempo Real - WebSocket)' : '(Simulada)'}`}
                        data={temperatureHistory}
                    />
                </div>
            </div>

            {/* Gráfica de temperatura corporal */}
            <BodyTemperatureChart
                data={wsSensorData?.temp_objeto}
                isConnected={wsConnected}
            />

            {/* MPU Ring Chart - Solo si hay datos de pasos */}
            {wsConnected && isValidNumber(wsSensorData?.pasos) && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Actividad Física - MPU6050
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="bg-blue-100 rounded-lg p-4">
                                <p className="text-2xl font-bold text-blue-600">{wsSensorData.pasos}</p>
                                <p className="text-sm text-blue-800">Pasos Detectados</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="bg-green-100 rounded-lg p-4">
                                <p className="text-2xl font-bold text-green-600">
                                    {wsSensorData.pasos > 50 ? 'Alta' : wsSensorData.pasos > 20 ? 'Media' : 'Baja'}
                                </p>
                                <p className="text-sm text-green-800">Actividad</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="bg-orange-100 rounded-lg p-4">
                                <p className="text-2xl font-bold text-orange-600">
                                    {Math.floor((wsSensorData.pasos / 100) * 100)}%
                                </p>
                                <p className="text-sm text-orange-800">Meta Diaria</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}