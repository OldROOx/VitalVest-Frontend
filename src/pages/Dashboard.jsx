// src/pages/Dashboard.jsx - FIX SOBRESCRITURA DE DATOS
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
    const [activityHistory, setActivityHistory] = useState([]);

    // Estado específico para pasos con short polling
    const [stepsFromPolling, setStepsFromPolling] = useState(null);

    // NUEVO: Flags para controlar inicialización
    const [hasRealStepsData, setHasRealStepsData] = useState(false);
    const [isStepsInitialized, setIsStepsInitialized] = useState(false);

    // Log para debug
    useEffect(() => {
        console.log('🔍 Debug Dashboard:', {
            apiConnected,
            wsConnected,
            currentValues,
            wsSensorData,
            hasValidData: hasValidData(),
            summary: getSensorSummary(),
            hasRealStepsData,
            isStepsInitialized,
            activityHistoryLength: activityHistory.length
        });
    }, [apiConnected, wsConnected, currentValues, wsSensorData, hasValidData, getSensorSummary, hasRealStepsData, isStepsInitialized, activityHistory.length]);

    // Short polling exclusivo para pasos - MEJORADO PARA PREVENIR SOBRESCRITURA
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
                    console.log('📊 Respuesta completa de /mpu:', result);

                    let totalSteps = 0;

                    if (result && result.pasos && Array.isArray(result.pasos)) {
                        console.log('📦 result.pasos es un array con', result.pasos.length, 'elementos');

                        // Procesar datos para la gráfica semanal
                        const stepsData = result.pasos;

                        if (stepsData.length > 0) {
                            // Agrupar pasos por día de la semana
                            const groupedByDay = stepsData.reduce((acc, entry) => {
                                if (entry.fecha && entry.pasos) {
                                    const date = new Date(entry.fecha);
                                    const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });

                                    if (!acc[dayName]) {
                                        acc[dayName] = 0;
                                    }
                                    acc[dayName] += entry.pasos;
                                }
                                return acc;
                            }, {});

                            console.log('📊 Pasos agrupados por día:', groupedByDay);

                            // Crear datos para la gráfica
                            const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                            const newActivityHistory = daysOfWeek.map(day => ({
                                label: day,
                                value: groupedByDay[day] || 0
                            }));

                            // SOLO actualizar si hay datos reales
                            const hasSteps = newActivityHistory.some(day => day.value > 0);
                            if (hasSteps) {
                                setActivityHistory(newActivityHistory);
                                setHasRealStepsData(true);
                                setIsStepsInitialized(true);
                                console.log('✅ Datos de actividad REALES actualizados:', newActivityHistory);
                            } else {
                                console.log('⚠️ No hay pasos en los datos, manteniendo estado actual');
                            }

                            // Total de pasos para la tarjeta
                            const lastEntry = stepsData[stepsData.length - 1];
                            totalSteps = lastEntry.pasos || 0;
                            console.log('👟 Último entry:', lastEntry);
                            console.log('👟 Pasos del último entry:', totalSteps);
                        } else {
                            console.log('⚠️ Array de pasos está vacío');
                        }
                    } else if (result && typeof result.pasos === 'number') {
                        totalSteps = result.pasos;
                        console.log('👟 Pasos como número directo:', totalSteps);
                    } else {
                        console.warn('⚠️ Estructura de datos inesperada:', result);
                        totalSteps = 0;
                    }

                    console.log('👟 Pasos finales del short polling:', totalSteps);
                    setStepsFromPolling(totalSteps);
                } else {
                    console.warn('⚠️ Error en short polling de pasos:', response.status);
                }
            } catch (error) {
                console.error('❌ Error en short polling de pasos:', error);
            }
        };

        if (apiConnected) {
            fetchSteps();
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

                return newData.slice(-20);
            });
        }
    }, [wsSensorData, currentValues]);

    // MODIFICADO: Inicializar gráficas SOLO si no hay datos reales y no se han inicializado
    useEffect(() => {
        // Temperatura: Solo si está vacía
        if (temperatureHistory.length === 0) {
            const defaultTempData = Array.from({ length: 10 }, (_, i) => ({
                label: `${String(i * 2).padStart(2, '0')}:00`,
                value: 36.5 + (Math.random() - 0.5) * 1.5
            }));
            setTemperatureHistory(defaultTempData);
            console.log('🔧 Inicializando temperatura con datos por defecto');
        }

        // CRÍTICO: Solo inicializar pasos si NO hay datos reales Y no se ha inicializado
        if (!hasRealStepsData && !isStepsInitialized && activityHistory.length === 0) {
            const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            const defaultActivityData = days.map(day => ({
                label: day,
                value: 0 // SIEMPRE usar 0 cuando no hay datos reales
            }));
            setActivityHistory(defaultActivityData);
            setIsStepsInitialized(true);
            console.log('🔧 Inicializando actividad con datos vacíos (no hay datos reales)');
        } else if (hasRealStepsData) {
            console.log('✅ Saltando inicialización porque ya hay datos reales de pasos');
        }
    }, [hasRealStepsData, isStepsInitialized, activityHistory.length, temperatureHistory.length]);

    // Funciones helper
    const isValidNumber = (value) => {
        return value !== null && value !== undefined && !isNaN(value) && isFinite(value);
    };

    const formatValue = (value, decimals = 1) => {
        return isValidNumber(value) ? Number(value).toFixed(decimals) : '--';
    };

    // Combinar datos para estadísticas
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
            </div>

            {/* DATOS EN TIEMPO REAL - COMBINANDO API Y WEBSOCKET */}
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

                    {/* Pasos (MPU6050) */}
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

            </div>

            {/* Gráficas - MEJORADO PARA MOSTRAR ESTADO REAL */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200">
                    <Chart
                        type="bar"
                        title={`Actividad Semanal ${hasRealStepsData ? '(Datos)' : '(Sin Datos)'}`}
                        data={activityHistory}
                    />
                    {/* Debug info para la gráfica */}
                    <div className="px-6 pb-4">
                        <p className="text-xs text-gray-500">
                            📊 Estado: {hasRealStepsData ? 'Datos reales cargados' : 'Esperando datos'} |
                            Total pasos: {activityHistory.reduce((sum, day) => sum + day.value, 0)} |
                            Días con datos: {activityHistory.filter(d => d.value > 0).length}
                        </p>
                    </div>
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
                </div>

                <GyroscopeRingChart
                    data={wsSensorData}
                    isConnected={wsConnected}
                />
            </div>
        </div>
    );
}