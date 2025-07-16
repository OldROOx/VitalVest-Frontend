// src/pages/Dashboard.jsx - VERSION LIMPIA SIN DATOS API
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

    // Log para debug - puedes quitar esto después
    useEffect(() => {
        console.log('🔍 Debug WebSocket Data:', {
            wsConnected,
            wsSensorData,
            lastMessage
        });
    }, [wsConnected, wsSensorData, lastMessage]);

    // Actualizar gráficas con datos del WebSocket
    useEffect(() => {
        if (wsConnected && wsSensorData?.temperatura !== null && wsSensorData?.temperatura !== undefined) {
            console.log('📈 Actualizando gráfica de temperatura con:', wsSensorData.temperatura);

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
    }, [wsConnected, wsSensorData?.temperatura]);

    useEffect(() => {
        if (wsConnected && wsSensorData?.aceleracion?.x !== null && wsSensorData?.aceleracion?.x !== undefined) {
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
    }, [wsConnected, wsSensorData?.aceleracion]);

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

    // Funciones helper seguras
    const isValidNumber = (value) => {
        return value !== null && value !== undefined && !isNaN(value);
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

        steps: currentValues?.pasos || 0,

        ambientTemp: wsConnected && isValidNumber(wsSensorData?.temperatura) ?
            wsSensorData.temperatura :
            (currentValues?.temperatura_ambiente || 22.0),

        hydration: wsConnected && isValidNumber(wsSensorData?.humedad) ?
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



            {/* DATOS EN TIEMPO REAL DEL WEBSOCKET - VERSION ROBUSTA */}
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
                            } g
                        </p>
                        <p className={`text-xs mt-1 ${
                            isValidNumber(wsSensorData?.aceleracion?.x) ? 'text-purple-600' : 'text-gray-500'
                        }`}>
                            {isValidNumber(wsSensorData?.aceleracion?.x) ? 'Magnitud total' : 'Sin datos'}
                        </p>
                    </div>
                </div>

                {/* Detalle de sensores avanzados */}
                {(isValidNumber(wsSensorData?.aceleracion?.x) || isValidNumber(wsSensorData?.giroscopio?.x)) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Aceleración detallada */}
                        {isValidNumber(wsSensorData?.aceleracion?.x) && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                                    <Icon name="activity" size={16} className="mr-2" />
                                    Aceleración (g)
                                </h4>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-sm text-gray-600">Eje X</p>
                                        <p className="text-lg font-semibold text-indigo-600">
                                            {formatValue(wsSensorData.aceleracion.x, 3)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Eje Y</p>
                                        <p className="text-lg font-semibold text-indigo-600">
                                            {formatValue(wsSensorData.aceleracion.y, 3)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Eje Z</p>
                                        <p className="text-lg font-semibold text-indigo-600">
                                            {formatValue(wsSensorData.aceleracion.z, 3)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Giroscopio detallado */}
                        {isValidNumber(wsSensorData?.giroscopio?.x) && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                                    <Icon name="sync" size={16} className="mr-2" />
                                    Giroscopio (°/s)
                                </h4>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-sm text-gray-600">Eje X</p>
                                        <p className="text-lg font-semibold text-purple-600">
                                            {formatValue(wsSensorData.giroscopio.x)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Eje Y</p>
                                        <p className="text-lg font-semibold text-purple-600">
                                            {formatValue(wsSensorData.giroscopio.y)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Eje Z</p>
                                        <p className="text-lg font-semibold text-purple-600">
                                            {formatValue(wsSensorData.giroscopio.z)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Información de estado */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                            <span className="text-gray-600">Estado WebSocket:</span>
                            <span className={`ml-2 font-medium ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
                                {wsConnected ? 'Conectado' : 'Desconectado'}
                            </span>
                        </div>
                        <div className="text-center">
                            <span className="text-gray-600">Última actualización:</span>
                            <span className="ml-2 font-medium text-blue-600">
                                {getLastUpdateText()}
                            </span>
                        </div>
                        <div className="text-center">
                            <span className="text-gray-600">Sensores activos:</span>
                            <span className="ml-2 font-medium text-purple-600">
                                {getActiveSensorsCount()}/5
                            </span>
                        </div>
                    </div>
                    {lastMessage && (
                        <p className="text-xs text-gray-500 text-center mt-2">
                            Timestamp: {new Date(lastMessage.timestamp).toLocaleString('es-ES')}
                        </p>
                    )}
                </div>
            </div>

            {/* Charts Section */}
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
                            {hasValidWebSocketData() ? 'Datos WebSocket en tiempo real' : 'Datos simulados'}
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
                        <span className="text-gray-600">Sensores WS:</span>
                        <span className="ml-2 font-medium text-purple-600">
                            {hasValidWebSocketData() ? `${getActiveSensorsCount()} activos` : 'Sin datos'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}