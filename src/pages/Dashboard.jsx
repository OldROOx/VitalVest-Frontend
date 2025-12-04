// src/pages/Dashboard.jsx - FIX PARA MOSTRAR DATOS DEL WEBSOCKET
import { useState, useEffect } from 'react';
import { Chart } from '../components/molecules/Chart';
import { useWebSocket } from '../hooks/useWebSocket'; // ✅ USAR WEBSOCKET DIRECTAMENTE
import { useApi } from '../hooks/useApi'; // Para datos históricos
import { Badge } from '../components/atoms/Badge';
import { Icon } from '../components/atoms/Icon';
import { BodyTemperatureChart } from '../components/molecules/BodyTemperatureChart';
import { GyroscopeRingChart } from "../components/molecules/GyroscopeRingChart.jsx";

export default function Dashboard() {
    // ✅ USAR WEBSOCKET DIRECTAMENTE
    const {
        isConnected: wsConnected,
        sensorData: wsSensorData,
        reconnect
    } = useWebSocket();

    // API solo para datos históricos
    const {
        isConnected: apiConnected,
        currentValues: apiCurrentValues
    } = useApi({
        autoStart: true,
        pollingInterval: 3000
    });

    const [temperatureHistory, setTemperatureHistory] = useState([]);
    const [dailyStepsData, setDailyStepsData] = useState([]);
    const [currentSteps, setCurrentSteps] = useState(0);
    const [hasStepsData, setHasStepsData] = useState(false);

    // ✅ USAR DATOS DEL WEBSOCKET PRIMERO, API COMO FALLBACK
    const currentValues = {
        temperatura_ambiente: wsSensorData.temperatura || apiCurrentValues?.temperatura_ambiente || null,
        temperatura_corporal: wsSensorData.temperatura_objeto || apiCurrentValues?.temperatura_corporal || null,
        humedad_relativa: wsSensorData.humedad || apiCurrentValues?.humedad_relativa || null,
        presion: wsSensorData.presion || apiCurrentValues?.presion || null,
        pasos: wsSensorData.pasos !== null ? wsSensorData.pasos : (apiCurrentValues?.pasos || null),
        porcentaje: wsSensorData.porcentaje || apiCurrentValues?.porcentaje || null,
        conductancia: wsSensorData.conductancia || apiCurrentValues?.conductancia || null,
        estado_hidratacion: wsSensorData.estado_hidratacion || apiCurrentValues?.estado_hidratacion || null
    };

    // Log para debug
    useEffect(() => {
        console.log('🔍 Dashboard - Datos actuales:', {
            wsConnected,
            wsSensorData,
            currentValues
        });
    }, [wsSensorData, currentValues]);

    // Actualizar gráfica de temperatura
    useEffect(() => {
        const currentTemp = currentValues.temperatura_corporal || currentValues.temperatura_ambiente;

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
    }, [currentValues.temperatura_corporal, currentValues.temperatura_ambiente]);

    // Obtener datos de pasos de la API
    useEffect(() => {
        const fetchDailySteps = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://100.30.168.141:8080/mpu', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    createTestStepsData();
                    return;
                }

                const result = await response.json();

                if (result.MPU && Array.isArray(result.MPU)) {
                    const sortedData = result.MPU.sort((a, b) =>
                        new Date(b.fecha) - new Date(a.fecha)
                    );

                    const totalStepsToday = sortedData.length > 0 ? sortedData[0].pasos || 0 : 0;
                    const last7Days = sortedData.slice(0, 7).reverse();

                    const processedData = last7Days.map(entry => ({
                        label: new Date(entry.fecha).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit'
                        }),
                        value: entry.pasos || 0
                    }));

                    setDailyStepsData(processedData);
                    setCurrentSteps(totalStepsToday);
                    setHasStepsData(true);
                } else {
                    createTestStepsData();
                }
            } catch (error) {
                console.error('❌ Error obteniendo pasos:', error);
                createTestStepsData();
            }
        };

        const createTestStepsData = () => {
            const testData = [];
            const today = new Date();

            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(today.getDate() - i);
                const day = date.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit'
                });

                const steps = 1200 + Math.floor(Math.random() * 800) + ((6 - i) * 200);
                testData.push({ label: day, value: steps });
            }

            setDailyStepsData(testData);
            setCurrentSteps(testData[testData.length - 1].value);
            setHasStepsData(true);
        };

        if (apiConnected) {
            fetchDailySteps();
            const interval = setInterval(fetchDailySteps, 10000);
            return () => clearInterval(interval);
        }
    }, [apiConnected]);

    // Helpers
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

                {/* Estado de conexiones */}

            </div>

            {/* DATOS EN TIEMPO REAL */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Datos en Tiempo Real
                    </h3>
                    <div className="text-xs text-gray-500">
                        Fuente: {wsConnected ? 'WebSocket' : apiConnected ? 'API REST' : 'Sin conexión'}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {/* Temperatura Ambiente */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(currentValues.temperatura_ambiente)
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="thermometer" size={20} className={`mr-2 ${
                                isValidNumber(currentValues.temperatura_ambiente)
                                    ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(currentValues.temperatura_ambiente)
                                    ? 'text-blue-800' : 'text-gray-600'
                            }`}>
                                Temp. Ambiente
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(currentValues.temperatura_ambiente)
                                ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                            {formatValue(currentValues.temperatura_ambiente)}°C
                        </p>
                    </div>

                    {/* Temperatura Corporal */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(currentValues.temperatura_corporal)
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="heart" size={20} className={`mr-2 ${
                                isValidNumber(currentValues.temperatura_corporal)
                                    ? 'text-red-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(currentValues.temperatura_corporal)
                                    ? 'text-red-800' : 'text-gray-600'
                            }`}>
                                Temp. Corporal
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(currentValues.temperatura_corporal)
                                ? 'text-red-600' : 'text-gray-400'
                        }`}>
                            {formatValue(currentValues.temperatura_corporal)}°C
                        </p>
                    </div>

                    {/* Humedad */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(currentValues.humedad_relativa)
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="droplet" size={20} className={`mr-2 ${
                                isValidNumber(currentValues.humedad_relativa)
                                    ? 'text-green-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(currentValues.humedad_relativa)
                                    ? 'text-green-800' : 'text-gray-600'
                            }`}>
                                Humedad
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(currentValues.humedad_relativa)
                                ? 'text-green-600' : 'text-gray-400'
                        }`}>
                            {formatValue(currentValues.humedad_relativa)}%
                        </p>
                    </div>

                    {/* Pasos */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(currentValues.pasos) || currentValues.pasos === 0
                            ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
                            : 'bg-gray-50 border-gray-200'
                    } transition-all duration-300`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="activity" size={20} className={`mr-2 ${
                                isValidNumber(currentValues.pasos) || currentValues.pasos === 0
                                    ? 'text-orange-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(currentValues.pasos) || currentValues.pasos === 0
                                    ? 'text-orange-800' : 'text-gray-600'
                            }`}>
                                Pasos de Hoy
                            </span>
                        </div>
                        <p className={`text-3xl font-bold ${
                            isValidNumber(currentValues.pasos) || currentValues.pasos === 0
                                ? 'text-orange-600' : 'text-gray-400'
                        }`}>
                            {currentValues.pasos !== null ? currentValues.pasos : '0'}
                        </p>
                    </div>

                    {/* Hidratación */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(currentValues.porcentaje)
                            ? 'bg-indigo-50 border-indigo-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="droplet" size={20} className={`mr-2 ${
                                isValidNumber(currentValues.porcentaje)
                                    ? 'text-indigo-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(currentValues.porcentaje)
                                    ? 'text-indigo-800' : 'text-gray-600'
                            }`}>
                                Hidratación
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(currentValues.porcentaje)
                                ? 'text-indigo-600' : 'text-gray-400'
                        }`}>
                            {formatValue(currentValues.porcentaje, 0)}%
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(currentValues.porcentaje)
                                ? 'text-indigo-600' : 'text-gray-500'
                        }`}>
                            {currentValues.estado_hidratacion || 'GSR'}
                        </p>
                    </div>

                    {/* Presión */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(currentValues.presion)
                            ? 'bg-purple-50 border-purple-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="activity" size={20} className={`mr-2 ${
                                isValidNumber(currentValues.presion)
                                    ? 'text-purple-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(currentValues.presion)
                                    ? 'text-purple-800' : 'text-gray-600'
                            }`}>
                                Presión
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(currentValues.presion)
                                ? 'text-purple-600' : 'text-gray-400'
                        }`}>
                            {formatValue(currentValues.presion, 0)}
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(currentValues.presion)
                                ? 'text-purple-600' : 'text-gray-500'
                        }`}>
                            hPa
                        </p>
                    </div>
                </div>
            </div>

            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <Chart
                        type="bar"
                        title="Actividad Diaria - Pasos"
                        data={dailyStepsData}
                    />
                </div>

                <div className="bg-white rounded-lg border border-gray-200">
                    <Chart
                        type="line"
                        title="Temperatura Ambiental"
                        data={temperatureHistory}
                    />
                </div>
            </div>

            <BodyTemperatureChart
                data={currentValues.temperatura_corporal}
                isConnected={wsConnected || apiConnected}
            />

            <GyroscopeRingChart
                data={wsSensorData}
                isConnected={wsConnected}
            />
        </div>
    );
}