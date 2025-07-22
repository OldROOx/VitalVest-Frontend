// src/pages/Dashboard.jsx - VERSION CORREGIDA CON GRÁFICAS FUNCIONALES
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

export default function Dashboard() {
    const {
        isConnected,
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
        lastMessage,
        reconnect
    } = useWebSocket();

    // Estado para datos históricos de gráficos (WebSocket)
    const [temperatureHistory, setTemperatureHistory] = useState([]);
    const [activityHistory, setActivityHistory] = useState([]);
    const [hasPendingUpdate, setHasPendingUpdate] = useState(false);

    // Datos iniciales para las gráficas
    const initializeDefaultData = () => {
        // Datos por defecto para temperatura (24 horas simuladas)
        const defaultTempData = Array.from({ length: 24 }, (_, i) => ({
            label: `${String(i).padStart(2, '0')}:00`,
            value: 36.5 + (Math.random() - 0.5) * 0.8
        }));

        // Datos por defecto para actividad (días de la semana)
        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const defaultActivityData = days.map(day => ({
            label: day,
            value: Math.floor(Math.random() * 5000 + 3000)
        }));

        setTemperatureHistory(defaultTempData);
        setActivityHistory(defaultActivityData);
    };

    // Inicializar datos por defecto al montar el componente
    useEffect(() => {
        initializeDefaultData();
    }, []);

    // Log para debug
    useEffect(() => {
        if (wsConnected && wsSensorData) {
            console.log('🔍 Debug WebSocket Data:', {
                temperatura: wsSensorData.temperatura,
                aceleracion: wsSensorData.aceleracion,
                wsConnected,
                lastMessage
            });
        }
    }, [wsConnected, wsSensorData, lastMessage]);

    // Actualizar gráfica de temperatura con datos del WebSocket
    useEffect(() => {
        if (wsConnected &&
            wsSensorData?.temperatura !== null &&
            wsSensorData?.temperatura !== undefined &&
            !isNaN(wsSensorData.temperatura)) {

            console.log('📈 Actualizando gráfica de temperatura con:', wsSensorData.temperatura);

            setTemperatureHistory(prev => {
                const currentTime = new Date().toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });

                const newData = [...prev];

                // Agregar nuevo punto
                newData.push({
                    label: currentTime,
                    value: parseFloat(wsSensorData.temperatura)
                });

                // Mantener solo las últimas 20 entradas para mejor visualización
                const result = newData.slice(-20);
                console.log('📊 Nuevos datos de temperatura para gráfica:', result);
                return result;
            });

            setHasPendingUpdate(true);
        }
    }, [wsConnected, wsSensorData?.temperatura]);

    // Actualizar gráfica de actividad basada en aceleración
    useEffect(() => {
        if (wsConnected &&
            wsSensorData?.aceleracion?.x !== null &&
            wsSensorData?.aceleracion?.x !== undefined) {

            // Calcular magnitud de aceleración
            const accelerationMagnitude = Math.sqrt(
                Math.pow(wsSensorData.aceleracion.x || 0, 2) +
                Math.pow(wsSensorData.aceleracion.y || 0, 2) +
                Math.pow(wsSensorData.aceleracion.z || 0, 2)
            );

            // Convertir aceleración a pasos estimados
            const estimatedSteps = Math.floor(accelerationMagnitude * 500); // Factor ajustado

            console.log('🚶 Actualizando actividad - Aceleración:', accelerationMagnitude, 'Pasos estimados:', estimatedSteps);

            // Actualizar actividad del día actual
            const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            const today = new Date().getDay();
            const currentDay = days[today === 0 ? 6 : today - 1]; // Ajustar domingo

            setActivityHistory(prev => {
                const newData = [...prev];
                const existingDayIndex = newData.findIndex(d => d.label === currentDay);

                if (existingDayIndex >= 0) {
                    // Incrementar pasos del día actual
                    newData[existingDayIndex].value += estimatedSteps;
                } else {
                    // Si no existe el día, crear estructura completa
                    return days.map(day => ({
                        label: day,
                        value: day === currentDay ? estimatedSteps : Math.floor(Math.random() * 5000 + 3000)
                    }));
                }

                return newData;
            });
        }
    }, [wsConnected, wsSensorData?.aceleracion]);

    // Reset del flag de actualización pendiente
    useEffect(() => {
        if (hasPendingUpdate) {
            const timeout = setTimeout(() => {
                setHasPendingUpdate(false);
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [hasPendingUpdate]);

    // Funciones helper seguras
    const isValidNumber = (value) => {
        return value !== null && value !== undefined && !isNaN(value) && isFinite(value);
    };

    const getSafeValue = (value, fallback = 0) => {
        return isValidNumber(value) ? value : fallback;
    };

    const formatValue = (value, decimals = 1) => {
        return isValidNumber(value) ? Number(value).toFixed(decimals) : '--';
    };

    // Verificar si tenemos datos válidos del WebSocket
    const hasValidWebSocketData = () => {
        if (!wsConnected || !wsSensorData) return false;

        return (
            isValidNumber(wsSensorData.temperatura) ||
            isValidNumber(wsSensorData.presion) ||
            isValidNumber(wsSensorData.humedad) ||
            isValidNumber(wsSensorData.aceleracion?.x)
        );
    };

    // Contar sensores activos
    const getActiveSensorsCount = () => {
        if (!hasValidWebSocketData()) return 0;

        let count = 0;
        if (isValidNumber(wsSensorData.temperatura)) count++;
        if (isValidNumber(wsSensorData.presion)) count++;
        if (isValidNumber(wsSensorData.humedad)) count++;
        if (isValidNumber(wsSensorData.aceleracion?.x)) count++;
        if (isValidNumber(wsSensorData.giroscopio?.x)) count++;

        return count;
    };

    // Combinar datos de API y WebSocket para estadísticas
    const stats = {
        bodyTemp: wsConnected && isValidNumber(wsSensorData?.temperatura) ?
            wsSensorData.temperatura :
            (currentValues?.temperatura_corporal || 36.5),

        steps: currentValues?.pasos ||
            (activityHistory.length > 0 ?
                activityHistory.reduce((sum, day) => sum + day.value, 0) / 7 : 0),

        ambientTemp: wsConnected && isValidNumber(wsSensorData?.temperatura) ?
            wsSensorData.temperatura :
            (currentValues?.temperatura_ambiente || 22.0),

        hydration: wsConnected && isValidNumber(wsSensorData?.humedad) ?
            wsSensorData.humedad :
            (currentValues?.conductancia ? (currentValues.conductancia * 100) : 65)
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

    // Función para forzar actualización de las gráficas
    const refreshCharts = () => {
        setHasPendingUpdate(true);
        console.log('🔄 Forzando actualización de gráficas');
    };

    // Función para probar las gráficas con datos simulados
    const testCharts = () => {
        console.log('🧪 Probando gráficas con datos simulados');

        // Generar datos de prueba para temperatura
        const testTempData = Array.from({ length: 10 }, (_, i) => ({
            label: `${String(i * 2).padStart(2, '0')}:00`,
            value: 36.5 + Math.sin(i * 0.5) * 0.8 + Math.random() * 0.3
        }));

        // Generar datos de prueba para actividad
        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const testActivityData = days.map(day => ({
            label: day,
            value: Math.floor(Math.random() * 6000 + 2000)
        }));

        setTemperatureHistory(testTempData);
        setActivityHistory(testActivityData);
        setHasPendingUpdate(true);

        console.log('📊 Datos de prueba aplicados:', { testTempData, testActivityData });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                            wsConnected ? 'bg-green-500' :
                                isLoading ? 'bg-yellow-500' :
                                    isConnected ? 'bg-blue-500' : 'bg-red-500'
                        } ${(wsConnected || isLoading) ? 'animate-pulse' : ''}`}></div>
                        <span className="text-sm text-gray-600">
                            {wsConnected ? 'WebSocket Conectado' :
                                isConnected ? 'API Conectada' : 'Desconectado'}
                        </span>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={refreshCharts}
                        className="flex items-center space-x-1"
                    >
                        <Icon name="sync" size={14} />
                        <span>Actualizar</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={testCharts}
                        className="flex items-center space-x-1"
                    >
                        <Icon name="activity" size={14} />
                        <span>Probar</span>
                    </Button>
                    <p className="text-sm text-gray-500">
                        Última actualización: {getLastUpdateText()}
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <DashboardStats stats={stats} />

            {/* DATOS EN TIEMPO REAL DEL WEBSOCKET */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {hasValidWebSocketData() ? '🟢' : '🔴'} Datos en Tiempo Real (WebSocket)
                    </h3>
                    <div className="flex items-center space-x-2">
                        <Badge variant={hasValidWebSocketData() ? 'success' : 'default'} size="sm">
                            {hasValidWebSocketData() ?
                                `${getActiveSensorsCount()} sensores activos` :
                                'Sin datos'
                            }
                        </Badge>
                        {wsConnected && (
                            <Badge variant="success" size="sm">
                                Conectado
                            </Badge>
                        )}
                        {!wsConnected && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={reconnect}
                                className="flex items-center space-x-1"
                            >
                                <Icon name="sync" size={12} />
                                <span>Reconectar</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Grid de sensores */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Temperatura */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(wsSensorData?.temperatura)
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="thermometer" size={20} className={`mr-2 ${
                                isValidNumber(wsSensorData?.temperatura) ? 'text-red-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(wsSensorData?.temperatura) ? 'text-red-800' : 'text-gray-600'
                            }`}>
                                Temperatura
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(wsSensorData?.temperatura) ? 'text-red-600' : 'text-gray-400'
                        }`}>
                            {formatValue(wsSensorData?.temperatura)}°C
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(wsSensorData?.temperatura) ? 'text-red-600' : 'text-gray-500'
                        }`}>
                            {isValidNumber(wsSensorData?.temperatura) ? 'En vivo' : 'Sin datos'}
                        </p>
                    </div>

                    {/* Presión */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(wsSensorData?.presion)
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="activity" size={20} className={`mr-2 ${
                                isValidNumber(wsSensorData?.presion) ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(wsSensorData?.presion) ? 'text-blue-800' : 'text-gray-600'
                            }`}>
                                Presión
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(wsSensorData?.presion) ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                            {formatValue(wsSensorData?.presion)}
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(wsSensorData?.presion) ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                            hPa
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
                            {isValidNumber(wsSensorData?.humedad) ? 'Relativa' : 'Sin datos'}
                        </p>
                    </div>

                    {/* Aceleración */}
                    <div className={`rounded-lg p-4 text-center border-2 ${
                        isValidNumber(wsSensorData?.aceleracion?.x)
                            ? 'bg-purple-50 border-purple-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon name="activity" size={20} className={`mr-2 ${
                                isValidNumber(wsSensorData?.aceleracion?.x) ? 'text-purple-600' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                                isValidNumber(wsSensorData?.aceleracion?.x) ? 'text-purple-800' : 'text-gray-600'
                            }`}>
                                Aceleración
                            </span>
                        </div>
                        <p className={`text-2xl font-bold ${
                            isValidNumber(wsSensorData?.aceleracion?.x) ? 'text-purple-600' : 'text-gray-400'
                        }`}>
                            {isValidNumber(wsSensorData?.aceleracion?.x) ?
                                Math.sqrt(
                                    Math.pow(getSafeValue(wsSensorData.aceleracion.x), 2) +
                                    Math.pow(getSafeValue(wsSensorData.aceleracion.y), 2) +
                                    Math.pow(getSafeValue(wsSensorData.aceleracion.z), 2)
                                ).toFixed(2) : '--'
                            }g
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(wsSensorData?.aceleracion?.x) ? 'text-purple-600' : 'text-gray-500'
                        }`}>
                            {isValidNumber(wsSensorData?.aceleracion?.x) ? 'Magnitud total' : 'Sin datos'}
                        </p>
                    </div>
                </div>


            </div>

            {/* Charts Section - CON DATOS REALES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfica de Actividad */}
                <div className="bg-white rounded-lg border border-gray-200">
                    {activityHistory.length > 0 ? (
                        <Chart
                            type="bar"
                            title={`Actividad Semanal ${wsConnected ? '(Tiempo Real)' : '(Simulada)'}`}
                            data={activityHistory}
                            key={`activity-${hasPendingUpdate}-${activityHistory.length}`}
                        />
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            <p>Cargando datos de actividad...</p>
                        </div>
                    )}
                </div>

                {/* Gráfica de Temperatura */}
                <div className="bg-white rounded-lg border border-gray-200">
                    {temperatureHistory.length > 0 ? (
                        <Chart
                            type="line"
                            title={`Temperatura ${wsConnected ? '(Tiempo Real - WebSocket)' : '(Simulada)'}`}
                            data={temperatureHistory}
                            key={`temperature-${hasPendingUpdate}-${temperatureHistory.length}-${temperatureHistory[temperatureHistory.length - 1]?.value}`}
                        />
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            <p>Cargando datos de temperatura...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* SENSOR MPU6050 - GRÁFICA DE ANILLOS */}
            {wsConnected && hasValidWebSocketData() && (
                <MPURingChart
                    data={{
                        aceleracion: wsSensorData.aceleracion || { x: 0, y: 0, z: 0 },
                        giroscopio: wsSensorData.giroscopio || { x: 0, y: 0, z: 0 }
                    }}
                    isConnected={wsConnected}
                />
            )}

            {/* TEMPERATURA CORPORAL - GRÁFICA TEMPORAL */}
            {wsConnected && (
                <BodyTemperatureChart
                    data={wsSensorData?.temperatura}
                    isConnected={wsConnected}
                />
            )}

            {/* Status de conexión y datos */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-800 mb-2">Estado del Sistema</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex justify-between">
                        <span>WebSocket:</span>
                        <Badge variant={wsConnected ? 'success' : 'danger'} size="sm">
                            {wsConnected ? 'Conectado' : 'Desconectado'}
                        </Badge>
                    </div>
                    <div className="flex justify-between">
                        <span>API:</span>
                        <Badge variant={isConnected ? 'success' : 'danger'} size="sm">
                            {isConnected ? 'Conectada' : 'Desconectada'}
                        </Badge>
                    </div>
                    <div className="flex justify-between">
                        <span>Sensores Activos:</span>
                        <Badge variant={getActiveSensorsCount() > 0 ? 'success' : 'default'} size="sm">
                            {getActiveSensorsCount()}
                        </Badge>
                    </div>
                </div>
            </div>
        </div>
    );
}