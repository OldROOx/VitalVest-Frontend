// src/pages/Dashboard.jsx - COMPLETO ACTUALIZADO
import { useState, useEffect } from 'react';

import { Chart } from '../components/molecules/Chart';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import { Badge } from '../components/atoms/Badge';
import { Icon } from '../components/atoms/Icon';
import { BodyTemperatureChart } from '../components/molecules/BodyTemperatureChart';
import { GyroscopeRingChart } from "../components/molecules/GyroscopeRingChart.jsx";

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
    const [dailyStepsData, setDailyStepsData] = useState([]);

    // Estado específico para pasos
    const [currentSteps, setCurrentSteps] = useState(0);
    const [hasStepsData, setHasStepsData] = useState(false);

    // NUEVO: Polling mejorado para pasos en tiempo real
    useEffect(() => {
        const fetchDailySteps = async () => {
            try {
                console.log('👟 Obteniendo pasos diarios...');
                const token = localStorage.getItem('token');

                const response = await fetch('https://vivaltest-back.namixcode.cc/mpu', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    console.warn('⚠️ Error en API de pasos:', response.status);
                    createTestStepsData();
                    return;
                }

                const result = await response.json();
                console.log('📊 Datos de pasos recibidos:', result);

                let processedData = [];
                let totalStepsToday = 0;

                // Procesar datos según la estructura del backend
                if (result.pasos && Array.isArray(result.pasos)) {
                    // Ordenar por fecha (más reciente primero)
                    const sortedData = result.pasos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

                    // Obtener pasos de hoy (primer elemento)
                    if (sortedData.length > 0) {
                        totalStepsToday = sortedData[0].pasos || 0;
                    }

                    // Procesar últimos 7 días para la gráfica
                    const last7Days = sortedData.slice(0, 7).reverse(); // Invertir para mostrar cronológicamente

                    processedData = last7Days.map(entry => {
                        const fecha = new Date(entry.fecha);
                        const day = fecha.toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit'
                        });

                        return {
                            label: day,
                            value: entry.pasos || 0
                        };
                    });

                    console.log('📈 Datos procesados para gráfica:', processedData);
                    console.log('👟 Pasos totales hoy:', totalStepsToday);
                }

                if (processedData.length > 0) {
                    setDailyStepsData(processedData);
                    setCurrentSteps(totalStepsToday);
                    setHasStepsData(true);
                    console.log('✅ Datos de pasos cargados exitosamente');
                } else {
                    console.log('⚠️ No se encontraron datos válidos, usando datos de prueba');
                    createTestStepsData();
                }

            } catch (error) {
                console.error('❌ Error obteniendo pasos:', error);
                createTestStepsData();
            }
        };

        // Función para crear datos de prueba más realistas
        const createTestStepsData = () => {
            console.log('🧪 Creando datos de prueba para pasos');

            const testData = [];
            const today = new Date();

            // Crear datos para los últimos 7 días con pasos progresivos
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(today.getDate() - i);
                const day = date.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit'
                });

                // Pasos más realistas con tendencia creciente hacia hoy
                const baseSteps = 1200;
                const variacion = Math.floor(Math.random() * 800);
                const incrementoDiario = (6 - i) * 200; // Más pasos hacia el día actual
                const steps = baseSteps + variacion + incrementoDiario;

                testData.push({
                    label: day,
                    value: steps
                });
            }

            setDailyStepsData(testData);
            setCurrentSteps(testData[testData.length - 1].value);
            setHasStepsData(true);
            console.log('✅ Datos de prueba creados:', testData);
        };

        if (apiConnected) {
            // Ejecutar inmediatamente
            fetchDailySteps();

            // Repetir cada 10 segundos para ver actualizaciones en tiempo real
            const interval = setInterval(fetchDailySteps, 10000);
            console.log('🔄 Polling de pasos iniciado cada 10s');

            return () => {
                clearInterval(interval);
                console.log('⏹️ Polling de pasos detenido');
            };
        }
    }, [apiConnected]);

    // Actualizar gráfica de temperatura con datos de API o WebSocket
    useEffect(() => {
        const currentTemp = wsSensorData?.temperatura_objeto ||
            wsSensorData?.temperatura ||
            currentValues?.temperatura_corporal ||
            currentValues?.temperatura_ambiente;

        if (currentTemp !== null && currentTemp !== undefined) {
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

                return newData.slice(-20);
            });
        }
    }, [wsSensorData, currentValues]);

    // Inicializar temperatura si está vacía
    useEffect(() => {
        if (temperatureHistory.length === 0) {
            const defaultTempData = Array.from({ length: 10 }, (_, i) => ({
                label: `${String(i * 2).padStart(2, '0')}:00`,
                value: 36.5 + (Math.random() - 0.5) * 1.5
            }));
            setTemperatureHistory(defaultTempData);
        }
    }, [temperatureHistory.length]);

    // Funciones helper
    const isValidNumber = (value) => {
        return value !== null && value !== undefined && !isNaN(value) && isFinite(value);
    };

    const formatValue = (value, decimals = 1) => {
        return isValidNumber(value) ? Number(value).toFixed(decimals) : '--';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard VitalVest</h1>
            </div>

            {/* DATOS EN TIEMPO REAL */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Datos en Tiempo Real
                    </h3>
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

                    {/* Pasos (MPU6050) - MEJORADO */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        hasStepsData && currentSteps > 0
                            ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
                            : 'bg-gray-50 border-gray-200'
                    } transition-all duration-300`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="activity" size={20} className={`mr-2 ${
                                hasStepsData && currentSteps > 0
                                    ? 'text-orange-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                hasStepsData && currentSteps > 0
                                    ? 'text-orange-800' : 'text-gray-600'
                            }`}>
                                Pasos de Hoy
                            </span>
                        </div>

                        <div className="relative">
                            <p className={`text-3xl font-bold transition-all duration-500 ${
                                hasStepsData && currentSteps > 0
                                    ? 'text-orange-600' : 'text-gray-400'
                            }`}>
                                {hasStepsData ? currentSteps.toLocaleString() : '0'}
                            </p>

                            {/* Animación de actualización */}
                            {hasStepsData && currentSteps > 0 && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            )}
                        </div>

                        <p className={`text-xs mt-2 ${
                            hasStepsData && currentSteps > 0
                                ? 'text-orange-600' : 'text-gray-500'
                        }`}>
                            MPU6050 • {hasStepsData ? 'Tiempo real' : 'Sin datos'}
                        </p>

                        {/* Mini progreso hacia la meta */}

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
            </div>

            {/* Gráficas - GRÁFICA DE PASOS MEJORADA */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Actividad Diaria - Pasos
                            </h3>
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${hasStepsData ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                <span className="text-xs text-gray-500">
                                    {hasStepsData ? 'Datos reales' : 'Sin datos'}
                                </span>
                            </div>
                        </div>

                        {/* Estadísticas rápidas */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <p className="text-xl font-bold text-blue-600">
                                    {currentSteps.toLocaleString()}
                                </p>
                                <p className="text-xs text-blue-800">Hoy</p>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-xl font-bold text-green-600">
                                    {dailyStepsData.length > 0 ?
                                        Math.round(dailyStepsData.reduce((sum, day) => sum + day.value, 0) / dailyStepsData.length).toLocaleString()
                                        : '0'}
                                </p>
                                <p className="text-xs text-green-800">Promedio</p>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <p className="text-xl font-bold text-purple-600">
                                    {dailyStepsData.reduce((sum, day) => sum + day.value, 0).toLocaleString()}
                                </p>
                                <p className="text-xs text-purple-800">Total 7 días</p>
                            </div>
                        </div>
                    </div>

                    <Chart
                        type="bar"
                        title=""
                        data={dailyStepsData}
                    />

                    {/* Info adicional */}
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

            {/* Gráfica de anillos con estadísticas */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Estadísticas y Análisis
                </h3>

                <GyroscopeRingChart
                    data={wsSensorData}
                    isConnected={wsConnected}
                />
            </div>
        </div>
    );
}