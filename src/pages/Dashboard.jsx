// src/pages/Dashboard.jsx - VERSIÓN SIMPLIFICADA QUE FUNCIONA
import { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { Badge } from '../components/atoms/Badge';
import { Icon } from '../components/atoms/Icon';
import { Button } from '../components/atoms/Button';
import { TestWebSocketButton } from '../components/molecules/TestWebSocketButton';

export default function Dashboard() {
    // Hook de WebSocket para datos en tiempo real
    const {
        isConnected: wsConnected,
        sensorData: wsSensorData,
        lastMessage,
        reconnect
    } = useWebSocket();

    // Estado para gráficas simples con Canvas nativo
    const [temperatureHistory, setTemperatureHistory] = useState([]);
    const [activityHistory, setActivityHistory] = useState([]);

    // Agregar nuevos datos al historial cuando lleguen por WebSocket
    useEffect(() => {
        if (wsConnected && wsSensorData?.temperatura !== null && wsSensorData?.temperatura !== undefined) {
            console.log('📈 Nueva temperatura:', wsSensorData.temperatura);

            setTemperatureHistory(prev => {
                const newData = [...prev];
                const now = new Date();
                const timeString = now.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });

                newData.push({
                    time: timeString,
                    value: parseFloat(wsSensorData.temperatura),
                    timestamp: now
                });

                return newData.slice(-20); // Mantener últimos 20 puntos
            });
        }
    }, [wsConnected, wsSensorData?.temperatura]);

    // Actualizar actividad basada en aceleración
    useEffect(() => {
        if (wsConnected && wsSensorData?.aceleracion?.x !== null && wsSensorData?.aceleracion?.x !== undefined) {
            const magnitude = Math.sqrt(
                Math.pow(wsSensorData.aceleracion.x || 0, 2) +
                Math.pow(wsSensorData.aceleracion.y || 0, 2) +
                Math.pow(wsSensorData.aceleracion.z || 0, 2)
            );

            console.log('🏃 Nueva aceleración, magnitud:', magnitude);

            // Convertir a "pasos" estimados
            const estimatedSteps = Math.floor(magnitude * 100);

            setActivityHistory(prev => {
                const newData = [...prev];
                const now = new Date();
                const timeString = now.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                newData.push({
                    time: timeString,
                    value: estimatedSteps,
                    magnitude: magnitude,
                    timestamp: now
                });

                return newData.slice(-15); // Mantener últimos 15 puntos
            });
        }
    }, [wsConnected, wsSensorData?.aceleracion]);

    // Funciones helper
    const isValidNumber = (value) => {
        return value !== null && value !== undefined && !isNaN(value) && isFinite(value);
    };

    const formatValue = (value, decimals = 1) => {
        return isValidNumber(value) ? Number(value).toFixed(decimals) : '--';
    };

    const hasValidWebSocketData = () => {
        if (!wsConnected || !wsSensorData) return false;
        return (
            isValidNumber(wsSensorData.temperatura) ||
            isValidNumber(wsSensorData.presion) ||
            isValidNumber(wsSensorData.humedad) ||
            isValidNumber(wsSensorData.aceleracion?.x)
        );
    };

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

    const getLastUpdateText = () => {
        if (!lastMessage?.timestamp) return 'Sin datos';

        const now = new Date();
        const messageTime = new Date(lastMessage.timestamp);
        const diffSeconds = Math.floor((now - messageTime) / 1000);

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
                            wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm text-gray-600">
                            {wsConnected ? 'WebSocket Conectado' : 'Desconectado'}
                        </span>
                    </div>
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
                    <p className="text-sm text-gray-500">
                        Última actualización: {getLastUpdateText()}
                    </p>
                </div>
            </div>

            {/* Panel de Control y Pruebas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Datos en Tiempo Real */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {hasValidWebSocketData() ? '🟢' : '🔴'} Datos en Tiempo Real
                        </h3>
                        <Badge variant={hasValidWebSocketData() ? 'success' : 'default'} size="sm">
                            {hasValidWebSocketData() ? `${getActiveSensorsCount()} sensores` : 'Sin datos'}
                        </Badge>
                    </div>

                    {/* Grid de sensores */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Temperatura */}
                        <div className={`rounded-lg p-4 text-center border-2 ${
                            isValidNumber(wsSensorData?.temperatura)
                                ? 'bg-red-50 border-red-200'
                                : 'bg-gray-50 border-gray-200'
                        }`}>
                            <Icon name="thermometer" size={20} className={`mx-auto mb-2 ${
                                isValidNumber(wsSensorData?.temperatura) ? 'text-red-600' : 'text-gray-400'
                            }`} />
                            <p className={`text-lg font-bold ${
                                isValidNumber(wsSensorData?.temperatura) ? 'text-red-600' : 'text-gray-400'
                            }`}>
                                {formatValue(wsSensorData?.temperatura)}°C
                            </p>
                            <p className="text-xs text-gray-600">Temperatura</p>
                        </div>

                        {/* Presión */}
                        <div className={`rounded-lg p-4 text-center border-2 ${
                            isValidNumber(wsSensorData?.presion)
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-gray-50 border-gray-200'
                        }`}>
                            <Icon name="activity" size={20} className={`mx-auto mb-2 ${
                                isValidNumber(wsSensorData?.presion) ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                            <p className={`text-lg font-bold ${
                                isValidNumber(wsSensorData?.presion) ? 'text-blue-600' : 'text-gray-400'
                            }`}>
                                {formatValue(wsSensorData?.presion, 0)}
                            </p>
                            <p className="text-xs text-gray-600">Presión (hPa)</p>
                        </div>

                        {/* Humedad */}
                        <div className={`rounded-lg p-4 text-center border-2 ${
                            isValidNumber(wsSensorData?.humedad)
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                        }`}>
                            <Icon name="droplet" size={20} className={`mx-auto mb-2 ${
                                isValidNumber(wsSensorData?.humedad) ? 'text-green-600' : 'text-gray-400'
                            }`} />
                            <p className={`text-lg font-bold ${
                                isValidNumber(wsSensorData?.humedad) ? 'text-green-600' : 'text-gray-400'
                            }`}>
                                {formatValue(wsSensorData?.humedad)}%
                            </p>
                            <p className="text-xs text-gray-600">Humedad</p>
                        </div>

                        {/* Aceleración */}
                        <div className={`rounded-lg p-4 text-center border-2 ${
                            isValidNumber(wsSensorData?.aceleracion?.x)
                                ? 'bg-purple-50 border-purple-200'
                                : 'bg-gray-50 border-gray-200'
                        }`}>
                            <Icon name="activity" size={20} className={`mx-auto mb-2 ${
                                isValidNumber(wsSensorData?.aceleracion?.x) ? 'text-purple-600' : 'text-gray-400'
                            }`} />
                            <p className={`text-lg font-bold ${
                                isValidNumber(wsSensorData?.aceleracion?.x) ? 'text-purple-600' : 'text-gray-400'
                            }`}>
                                {isValidNumber(wsSensorData?.aceleracion?.x) ?
                                    Math.sqrt(
                                        Math.pow(wsSensorData.aceleracion.x || 0, 2) +
                                        Math.pow(wsSensorData.aceleracion.y || 0, 2) +
                                        Math.pow(wsSensorData.aceleracion.z || 0, 2)
                                    ).toFixed(2) : '--'
                                }g
                            </p>
                            <p className="text-xs text-gray-600">Aceleración</p>
                        </div>
                    </div>

                    {/* Detalle de aceleración y giroscopio */}
                    {(isValidNumber(wsSensorData?.aceleracion?.x) || isValidNumber(wsSensorData?.giroscopio?.x)) && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Aceleración detallada */}
                            {isValidNumber(wsSensorData?.aceleracion?.x) && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-800 mb-3">Aceleración (g)</h4>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <p className="text-xs text-gray-600">X</p>
                                            <p className="text-sm font-semibold text-indigo-600">
                                                {formatValue(wsSensorData.aceleracion.x, 3)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600">Y</p>
                                            <p className="text-sm font-semibold text-indigo-600">
                                                {formatValue(wsSensorData.aceleracion.y, 3)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600">Z</p>
                                            <p className="text-sm font-semibold text-indigo-600">
                                                {formatValue(wsSensorData.aceleracion.z, 3)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Giroscopio detallado */}
                            {isValidNumber(wsSensorData?.giroscopio?.x) && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-800 mb-3">Giroscopio (°/s)</h4>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <p className="text-xs text-gray-600">X</p>
                                            <p className="text-sm font-semibold text-purple-600">
                                                {formatValue(wsSensorData.giroscopio.x, 1)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600">Y</p>
                                            <p className="text-sm font-semibold text-purple-600">
                                                {formatValue(wsSensorData.giroscopio.y, 1)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600">Z</p>
                                            <p className="text-sm font-semibold text-purple-600">
                                                {formatValue(wsSensorData.giroscopio.z, 1)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Panel de Pruebas */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <TestWebSocketButton />
                </div>
            </div>

            {/* Gráficas Simples */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Historial de Temperatura */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Historial de Temperatura
                    </h3>

                    {temperatureHistory.length > 0 ? (
                        <div className="space-y-4">
                            {/* Lista de valores recientes */}
                            <div className="max-h-32 overflow-y-auto space-y-1">
                                {temperatureHistory.slice(-8).map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span className="text-gray-600">{item.time}</span>
                                        <span className="font-mono text-red-600">
                                            {item.value.toFixed(1)}°C
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Estadísticas */}
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                <div className="text-center">
                                    <p className="text-xs text-gray-600">Actual</p>
                                    <p className="font-semibold text-red-600">
                                        {temperatureHistory[temperatureHistory.length - 1]?.value.toFixed(1)}°C
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-600">Promedio</p>
                                    <p className="font-semibold text-blue-600">
                                        {(temperatureHistory.reduce((a, b) => a + b.value, 0) / temperatureHistory.length).toFixed(1)}°C
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-600">Puntos</p>
                                    <p className="font-semibold text-gray-600">
                                        {temperatureHistory.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            <Icon name="thermometer" size={32} className="mx-auto mb-2 text-gray-300" />
                            <p>Esperando datos de temperatura...</p>
                            <p className="text-sm">
                                {wsConnected ? 'Conectado - Esperando datos' : 'WebSocket desconectado'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Historial de Actividad */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Actividad Física (Aceleración)
                    </h3>

                    {activityHistory.length > 0 ? (
                        <div className="space-y-4">
                            {/* Lista de valores recientes */}
                            <div className="max-h-32 overflow-y-auto space-y-1">
                                {activityHistory.slice(-8).map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span className="text-gray-600">{item.time}</span>
                                        <div className="text-right">
                                            <span className="font-mono text-purple-600">
                                                {item.magnitude.toFixed(2)}g
                                            </span>
                                            <span className="text-gray-500 ml-2">
                                                (~{item.value} pasos)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Estadísticas */}
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                <div className="text-center">
                                    <p className="text-xs text-gray-600">Actual</p>
                                    <p className="font-semibold text-purple-600">
                                        {activityHistory[activityHistory.length - 1]?.magnitude.toFixed(2)}g
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-600">Pasos Est.</p>
                                    <p className="font-semibold text-blue-600">
                                        {activityHistory.reduce((a, b) => a + b.value, 0)}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-600">Lecturas</p>
                                    <p className="font-semibold text-gray-600">
                                        {activityHistory.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            <Icon name="activity" size={32} className="mx-auto mb-2 text-gray-300" />
                            <p>Esperando datos de movimiento...</p>
                            <p className="text-sm">
                                {wsConnected ? 'Conectado - Esperando datos' : 'WebSocket desconectado'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Estado del Sistema */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">WebSocket:</span>
                        <Badge variant={wsConnected ? 'success' : 'danger'} size="sm">
                            {wsConnected ? 'Conectado' : 'Desconectado'}
                        </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Sensores Activos:</span>
                        <Badge variant={getActiveSensorsCount() > 0 ? 'success' : 'default'} size="sm">
                            {getActiveSensorsCount()}
                        </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Datos Temp:</span>
                        <Badge variant={temperatureHistory.length > 0 ? 'success' : 'default'} size="sm">
                            {temperatureHistory.length} puntos
                        </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Datos Movimiento:</span>
                        <Badge variant={activityHistory.length > 0 ? 'success' : 'default'} size="sm">
                            {activityHistory.length} puntos
                        </Badge>
                    </div>
                </div>

                {/* Información de conexión */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="font-medium text-gray-700">API Backend:</p>
                            <p className="text-gray-600 font-mono">http://localhost:8080</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-700">WebSocket:</p>
                            <p className="text-gray-600 font-mono">ws://localhost:8080/ws</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}