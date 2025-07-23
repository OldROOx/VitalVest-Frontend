// src/pages/Dashboard.jsx - VERSIÓN CORREGIDA
import { useState, useEffect } from 'react';
import { DashboardStats } from '../components/organisms/DashboardStats';
import { Chart } from '../components/molecules/Chart';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import { Badge } from '../components/atoms/Badge';
import { Icon } from '../components/atoms/Icon';
import { Button } from '../components/atoms/Button';
import { MPURingChart } from '../components/molecules/MPURingChart';
import { BodyTemperatureChart } from '../components/molecules/BodyTemperatureChart';
import { WebSocketTestButton } from '../components/molecules/WebSocketTestButton';

export default function Dashboard() {
    const {
        isConnected: apiConnected,
        isLoading,
        error,
        currentValues,
        lastUpdate,
        refreshData,
        startPolling,
        stopPolling,
        isPollingActive
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
    }, [wsConnected, wsSensorData]);

    // Actualizar gráfica de temperatura con datos del WebSocket
    useEffect(() => {
        // Usar temperatura corporal (MLX90614) si está disponible, sino temperatura ambiente (BME280)
        const currentTemp = wsSensorData.temp_objeto || wsSensorData.temperatura;

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

    // Actualizar gráfica de actividad con datos del acelerómetro
    useEffect(() => {
        if (wsConnected && wsSensorData.aceleracion && wsSensorData.aceleracion.x !== null) {
            // Calcular magnitud de aceleración
            const magnitude = Math.sqrt(
                Math.pow(wsSensorData.aceleracion.x || 0, 2) +
                Math.pow(wsSensorData.aceleracion.y || 0, 2) +
                Math.pow(wsSensorData.aceleracion.z || 0, 2)
            );

            // Convertir a pasos estimados (fórmula simple)
            const estimatedSteps = Math.floor(magnitude * 500);

            if (estimatedSteps > 0) {
                const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                const today = new Date().getDay();
                const currentDay = days[today === 0 ? 6 : today - 1];

                setActivityHistory(prev => {
                    const newData = [...prev];
                    const existingDayIndex = newData.findIndex(d => d.label === currentDay);

                    if (existingDayIndex >= 0) {
                        newData[existingDayIndex].value += estimatedSteps;
                    } else {
                        // Inicializar con datos de la semana
                        const baseData = days.map(day => ({
                            label: day,
                            value: day === currentDay ? estimatedSteps : Math.floor(Math.random() * 5000 + 3000)
                        }));
                        return baseData;
                    }

                    return newData;
                });
            }
        }
    }, [wsConnected, wsSensorData.aceleracion]);

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
    }, []);

    // Funciones helper
    const isValidNumber = (value) => {
        return value !== null && value !== undefined && !isNaN(value) && isFinite(value);
    };

    const getSafeValue = (value, fallback = 0) => {
        return isValidNumber(value) ? value : fallback;
    };

    const formatValue = (value, decimals = 1) => {
        return isValidNumber(value) ? Number(value).toFixed(decimals) : '--';
    };

    // Contar sensores activos
    const getActiveSensorsCount = () => {
        if (!wsConnected || !hasValidData()) return 0;

        let count = 0;
        if (isValidNumber(wsSensorData.temperatura)) count++;
        if (isValidNumber(wsSensorData.presion)) count++;
        if (isValidNumber(wsSensorData.humedad)) count++;
        if (isValidNumber(wsSensorData.aceleracion?.x)) count++;
        if (isValidNumber(wsSensorData.giroscopio?.x)) count++;
        if (isValidNumber(wsSensorData.temp_objeto)) count++;

        return count;
    };

    // Combinar datos para estadísticas
    const stats = {
        bodyTemp: wsSensorData.temp_objeto || currentValues?.temperatura_corporal || 36.5,
        steps: currentValues?.pasos || 0,
        ambientTemp: wsSensorData.temperatura || currentValues?.temperatura_ambiente || 22.0,
        hydration: wsSensorData.humedad || (currentValues?.conductancia ? (currentValues.conductancia * 100) : 65)
    };

    const getLastUpdateText = () => {
        const updateTime = wsConnected && lastMessage ?
            new Date(lastMessage.timestamp) : lastUpdate;

        if (!updateTime) return 'Sin datos';

        const now = new Date();
        const diffSeconds = Math.floor((now - updateTime) / 1000);

        if (diffSeconds < 10) return 'Ahora mismo';
        if (diffSeconds < 60) return `hace ${diffSeconds}s`;
        if (diffSeconds < 3600) return `hace ${Math.floor(diffSeconds / 60)}m`;
        return `hace ${Math.floor(diffSeconds / 3600)}h`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard VitalVest</h1>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                            wsConnected ? 'bg-green-500' :
                                isLoading ? 'bg-yellow-500' :
                                    apiConnected ? 'bg-blue-500' : 'bg-red-500'
                        } ${(wsConnected || isLoading) ? 'animate-pulse' : ''}`}></div>
                        <span className="text-sm text-gray-600">
                            {wsConnected ? 'WebSocket Conectado' :
                                apiConnected ? 'API Conectada' :
                                    isLoading ? 'Conectando...' : 'Desconectado'}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500">
                        Última actualización: {getLastUpdateText()}
                    </p>
                </div>
            </div>

            {/* Estadísticas principales */}
            <DashboardStats stats={stats} />

            {/* Panel de control de WebSocket */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Control de WebSocket
                    </h3>
                    <div className="flex items-center space-x-4">
                        <Button
                            variant={wsConnected ? "danger" : "primary"}
                            size="sm"
                            onClick={wsConnected ? () => websocketService.disconnect() : reconnect}
                        >
                            {wsConnected ? 'Desconectar' : 'Reconectar'}
                        </Button>
                        <WebSocketTestButton />
                    </div>
                </div>
            </div>

            {/* DATOS EN TIEMPO REAL DEL WEBSOCKET */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {hasValidData() ? '🟢' : '🔴'} Datos en Tiempo Real (WebSocket)
                    </h3>
                    <div className="flex items-center space-x-2">
                        <Badge variant={hasValidData() ? 'success' : 'default'} size="sm">
                            {hasValidData() ?
                                `${getActiveSensorsCount()} sensores activos` :
                                'Sin datos válidos'
                            }
                        </Badge>
                        {wsConnected && (
                            <Badge variant="success" size="sm">
                                Conectado
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Grid de sensores */}
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

                    {/* Presión */}
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

                    {/* Aceleración */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(wsSensorData?.aceleracion?.x)
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="activity" size={20} className={`mr-2 ${
                                isValidNumber(wsSensorData?.aceleracion?.x) ? 'text-orange-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(wsSensorData?.aceleracion?.x) ? 'text-orange-800' : 'text-gray-600'
                            }`}>
                                Aceleración
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(wsSensorData?.aceleracion?.x) ? 'text-orange-600' : 'text-gray-400'
                        }`}>
                            {isValidNumber(wsSensorData?.aceleracion?.x) ?
                                Math.sqrt(
                                    Math.pow(getSafeValue(wsSensorData.aceleracion.x), 2) +
                                    Math.pow(getSafeValue(wsSensorData.aceleracion.y), 2) +
                                    Math.pow(getSafeValue(wsSensorData.aceleracion.z), 2)
                                ).toFixed(2) : '--'
                            }
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(wsSensorData?.aceleracion?.x) ? 'text-orange-600' : 'text-gray-500'
                        }`}>
                            g (magnitud)
                        </p>
                    </div>

                    {/* Giroscopio */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(wsSensorData?.giroscopio?.x)
                            ? 'bg-indigo-50 border-indigo-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="sync" size={20} className={`mr-2 ${
                                isValidNumber(wsSensorData?.giroscopio?.x) ? 'text-indigo-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(wsSensorData?.giroscopio?.x) ? 'text-indigo-800' : 'text-gray-600'
                            }`}>
                                Giroscopio
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(wsSensorData?.giroscopio?.x) ? 'text-indigo-600' : 'text-gray-400'
                        }`}>
                            {isValidNumber(wsSensorData?.giroscopio?.x) ?
                                Math.sqrt(
                                    Math.pow(getSafeValue(wsSensorData.giroscopio.x), 2) +
                                    Math.pow(getSafeValue(wsSensorData.giroscopio.y), 2) +
                                    Math.pow(getSafeValue(wsSensorData.giroscopio.z), 2)
                                ).toFixed(0) : '--'
                            }
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(wsSensorData?.giroscopio?.x) ? 'text-indigo-600' : 'text-gray-500'
                        }`}>
                            °/s (magnitud)
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
                            Datos: {Object.keys(lastMessage).filter(key => key !== 'timestamp').join(', ')}
                        </p>
                    </div>
                )}
            </div>

            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200">
                    <Chart
                        type="bar"
                        title="Actividad Semanal (Basada en Acelerómetro)"
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

            {/* Gráficas avanzadas de sensores MPU6050 */}
            {wsConnected && hasValidData() && (
                <MPURingChart
                    data={{
                        aceleracion: wsSensorData.aceleracion || { x: 0, y: 0, z: 0 },
                        giroscopio: wsSensorData.giroscopio || { x: 0, y: 0, z: 0 }
                    }}
                    isConnected={wsConnected}
                />
            )}

            {/* Gráfica de temperatura corporal */}
            <BodyTemperatureChart
                data={wsSensorData?.temp_objeto}
                isConnected={wsConnected}
            />

            {/* Estado de datos detallado */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Estado del Sistema
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">WebSocket</p>
                        <p className={`text-lg font-semibold ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
                            {wsConnected ? 'Conectado' : 'Desconectado'}
                        </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">API Backend</p>
                        <p className={`text-lg font-semibold ${apiConnected ? 'text-green-600' : 'text-red-600'}`}>
                            {apiConnected ? 'Activa' : 'Inactiva'}
                        </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Sensores Activos</p>
                        <p className="text-lg font-semibold text-blue-600">
                            {getActiveSensorsCount()}/6
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}