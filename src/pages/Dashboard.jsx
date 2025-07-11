// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { DashboardStats } from '../components/organisms/DashboardStats';
import { Chart } from '../components/molecules/Chart';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import { Badge } from '../components/atoms/Badge';
import { Icon } from '../components/atoms/Icon';
import { Button } from '../components/atoms/Button';

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

    // Actualizar gráficas con datos del WebSocket
    useEffect(() => {
        if (wsConnected && wsSensorData.temperatura !== null) {
            // Actualizar historial de temperatura
            setTemperatureHistory(prev => {
                const newData = [...prev];
                const currentTime = new Date().toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                newData.push({
                    label: currentTime,
                    value: wsSensorData.temperatura
                });

                // Mantener solo las últimas 24 entradas
                return newData.slice(-24);
            });
        }
    }, [wsConnected, wsSensorData.temperatura]);

    useEffect(() => {
        if (wsConnected && wsSensorData.aceleracion.x !== null) {
            // Simular pasos basado en aceleración
            const accelerationMagnitude = Math.sqrt(
                Math.pow(wsSensorData.aceleracion.x || 0, 2) +
                Math.pow(wsSensorData.aceleracion.y || 0, 2) +
                Math.pow(wsSensorData.aceleracion.z || 0, 2)
            );

            // Convertir aceleración a pasos simulados
            const estimatedSteps = Math.floor(accelerationMagnitude * 1000);

            // Actualizar actividad por día de semana
            const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            const today = new Date().getDay();
            const currentDay = days[today === 0 ? 6 : today - 1]; // Ajustar domingo

            setActivityHistory(prev => {
                const newData = [...prev];
                const existingDayIndex = newData.findIndex(d => d.label === currentDay);

                if (existingDayIndex >= 0) {
                    newData[existingDayIndex].value += estimatedSteps;
                } else {
                    // Si no existe el día, crear estructura inicial
                    const baseData = days.map(day => ({
                        label: day,
                        value: day === currentDay ? estimatedSteps : Math.floor(Math.random() * 5000 + 3000)
                    }));
                    return baseData;
                }

                return newData;
            });
        }
    }, [wsConnected, wsSensorData.aceleracion]);

    // Inicializar gráficas con datos por defecto
    useEffect(() => {
        if (temperatureHistory.length === 0) {
            const defaultTempData = Array.from({ length: 8 }, (_, i) => ({
                label: `${String(i * 3).padStart(2, '0')}:00`,
                value: 36.5 + (Math.random() - 0.5) * 0.8
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

    // Combinar datos de API y WebSocket para estadísticas
    const stats = {
        bodyTemp: wsConnected && wsSensorData.temperatura !== null ?
            wsSensorData.temperatura :
            (currentValues?.temperatura_corporal || 36.5),

        steps: currentValues?.pasos || 0,

        ambientTemp: wsConnected && wsSensorData.temperatura !== null ?
            wsSensorData.temperatura :
            (currentValues?.temperatura_ambiente || 22.0),

        hydration: wsConnected && wsSensorData.humedad !== null ?
            wsSensorData.humedad :
            (currentValues?.conductancia ? (currentValues.conductancia * 100) : 65)
    };

    const getRecommendations = () => {
        const recommendations = [];

        // Recomendación basada en temperatura
        if (stats.bodyTemp > 37.5) {
            recommendations.push({
                type: 'danger',
                text: '🌡️ Temperatura elevada - Buscar lugar fresco y hidratarse'
            });
        } else if (stats.bodyTemp < 36.0) {
            recommendations.push({
                type: 'warning',
                text: '🌡️ Temperatura baja - Abrigarse adecuadamente'
            });
        } else {
            recommendations.push({
                type: 'success',
                text: '✅ Temperatura en rango normal'
            });
        }

        // Recomendación basada en actividad
        if (stats.steps < 3000) {
            recommendations.push({
                type: 'warning',
                text: '🚶 Actividad física baja - Aumentar movimiento'
            });
        } else if (stats.steps > 8000) {
            recommendations.push({
                type: 'success',
                text: '🎯 ¡Excelente! Meta de pasos alcanzada'
            });
        }

        // Recomendación basada en hidratación
        if (stats.hydration < 50) {
            recommendations.push({
                type: 'danger',
                text: '💧 Hidratación crítica - Beber agua inmediatamente'
            });
        } else if (stats.hydration < 60) {
            recommendations.push({
                type: 'warning',
                text: '💧 Hidratación baja - Recomendable beber agua'
            });
        } else {
            recommendations.push({
                type: 'info',
                text: '💧 Hidratación adecuada - Mantener rutina actual'
            });
        }

        return recommendations;
    };

    const getConnectionStatus = () => {
        if (isLoading) return 'Cargando API...';
        if (error) return 'Error API';
        if (isConnected) return 'API Conectada';
        return 'API Desconectada';
    };

    const getLastUpdateText = () => {
        const updateTime = wsConnected && lastMessage ?
            new Date(lastMessage.timestamp) : lastUpdate;

        if (!updateTime) return 'Sin datos';

        const now = new Date();
        const diffSeconds = Math.floor((now - updateTime) / 1000);

        if (diffSeconds < 30) return 'Ahora mismo';
        if (diffSeconds < 60) return `hace ${diffSeconds}s`;
        if (diffSeconds < 3600) return `hace ${Math.floor(diffSeconds / 60)}m`;
        return `hace ${Math.floor(diffSeconds / 3600)}h`;
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
                            {wsConnected ? 'WebSocket Conectado' : getConnectionStatus()}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500">
                        Última actualización: {getLastUpdateText()}
                    </p>
                </div>
            </div>

            {/* Controles de conexión */}
            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-4">
                    <Badge variant={wsConnected ? 'success' : 'default'}>
                        WebSocket: {wsConnected ? 'Conectado' : 'Desconectado'}
                    </Badge>
                    <Badge variant={isConnected ? 'success' : 'danger'}>
                        API: {isConnected ? 'Conectada' : 'Desconectada'}
                    </Badge>
                    {error && (
                        <Badge variant="danger">
                            Error: {error.message}
                        </Badge>
                    )}
                    <span className="text-sm text-gray-600">
                        Polling: {isPollingActive ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
                <div className="flex space-x-2">
                    {!wsConnected && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={reconnect}
                        >
                            <Icon name="wifi" size={16} />
                            Reconectar WS
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshData}
                        disabled={isLoading}
                    >
                        <Icon name="sync" size={16} className={isLoading ? 'animate-spin' : ''} />
                        Actualizar API
                    </Button>
                    {isPollingActive ? (
                        <Button variant="secondary" size="sm" onClick={stopPolling}>
                            Pausar
                        </Button>
                    ) : (
                        <Button variant="primary" size="sm" onClick={() => startPolling(2000)}>
                            Iniciar
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <DashboardStats stats={stats} />

            {/* Datos en tiempo real del WebSocket */}
            {wsConnected && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        🔴 Datos en Tiempo Real (WebSocket)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Temperatura</p>
                            <p className="text-xl font-bold text-red-600">
                                {wsSensorData.temperatura?.toFixed(1) || '--'}°C
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">Presión</p>
                            <p className="text-xl font-bold text-blue-600">
                                {wsSensorData.presion?.toFixed(1) || '--'} hPa
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">Humedad</p>
                            <p className="text-xl font-bold text-green-600">
                                {wsSensorData.humedad?.toFixed(1) || '--'}%
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">Aceleración</p>
                            <p className="text-xl font-bold text-purple-600">
                                {wsSensorData.aceleracion.x !== null ?
                                    Math.sqrt(
                                        Math.pow(wsSensorData.aceleracion.x, 2) +
                                        Math.pow(wsSensorData.aceleracion.y, 2) +
                                        Math.pow(wsSensorData.aceleracion.z, 2)
                                    ).toFixed(2) : '--'} g
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-md font-medium text-gray-800 mb-2">Detalle de Aceleración</h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-sm text-gray-600">Eje X</p>
                                <p className="text-lg font-semibold text-indigo-600">
                                    {wsSensorData.aceleracion.x?.toFixed(3) || '--'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Eje Y</p>
                                <p className="text-lg font-semibold text-indigo-600">
                                    {wsSensorData.aceleracion.y?.toFixed(3) || '--'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Eje Z</p>
                                <p className="text-lg font-semibold text-indigo-600">
                                    {wsSensorData.aceleracion.z?.toFixed(3) || '--'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Real-time sensor data API */}
            {!wsConnected && currentValues && Object.keys(currentValues).some(key => currentValues[key] !== null) && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Datos de la API (Backup)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">BME280 - Ambiente</p>
                            <p className="text-xl font-bold text-blue-600">
                                {currentValues.temperatura_ambiente?.toFixed(1) || '--'}°C
                            </p>
                            <p className="text-xs text-gray-500">
                                Humedad: {currentValues.humedad_relativa?.toFixed(1) || '--'}%
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">GSR - Hidratación</p>
                            <p className="text-xl font-bold text-green-600">
                                {currentValues.conductancia?.toFixed(3) || '--'}
                            </p>
                            <p className="text-xs text-gray-500">
                                Estado: {currentValues.estado_hidratacion || '--'}
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">MLX90614 - Corporal</p>
                            <p className="text-xl font-bold text-red-600">
                                {currentValues.temperatura_corporal?.toFixed(1) || '--'}°C
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">MPU6050 - Actividad</p>
                            <p className="text-xl font-bold text-purple-600">
                                {currentValues.pasos || '--'} pasos
                            </p>
                            <p className="text-xs text-gray-500">
                                Nivel: {currentValues.nivel_actividad || '--'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Section - AQUÍ ESTÁ EL FIX PRINCIPAL */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200">
                    <Chart
                        type="bar"
                        title="Actividad Semanal"
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

            {/* Additional Metrics and Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Hidratación</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Nivel actual</span>
                            <span className="text-lg font-semibold text-blue-600">{stats.hydration.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(0, stats.hydration))}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500">
                            {wsConnected ? 'Datos WebSocket en tiempo real' : 'Datos simulados/API'}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas y Recomendaciones</h3>
                    <div className="space-y-3">
                        {getRecommendations().map((rec, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded-lg text-sm ${
                                    rec.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                                        rec.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                                            rec.type === 'danger' ? 'bg-red-50 text-red-800 border border-red-200' :
                                                'bg-blue-50 text-blue-800 border border-blue-200'
                                }`}
                            >
                                {rec.text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Status de datos */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-gray-800 font-medium mb-2">
                    Estado de Fuentes de Datos:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">WebSocket:</span>
                        <span className={`ml-2 font-medium ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
                            {wsConnected ? 'Conectado' : 'Desconectado'}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-600">API:</span>
                        <span className={`ml-2 font-medium ${isConnected ? 'text-blue-600' : 'text-red-600'}`}>
                            {isConnected ? 'Conectada' : 'Desconectada'}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-600">Gráficas:</span>
                        <span className="ml-2 font-medium text-green-600">
                            {temperatureHistory.length > 0 ? `${temperatureHistory.length} puntos` : 'Sin datos'}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-600">Actividad:</span>
                        <span className="ml-2 font-medium text-purple-600">
                            {activityHistory.length > 0 ? `${activityHistory.length} días` : 'Sin datos'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}