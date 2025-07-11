// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { DashboardStats } from '../components/organisms/DashboardStats';
import { Chart } from '../components/molecules/Chart';
import { useApi } from '../hooks/useApi';
import { Badge } from '../components/atoms/Badge';
import { Icon } from '../components/atoms/Icon';
import { Button } from '../components/atoms/Button';

export default function Dashboard() {
    const {
        isConnected,
        isLoading,
        error,
        currentValues,
        sensorHistory,
        sensorStats,
        lastUpdate,
        refreshData,
        startPolling,
        stopPolling,
        isPollingActive
    } = useApi({
        autoStart: true,
        pollingInterval: 2000, // Actualizar cada 2 segundos
        onError: (err) => console.error('Error en Dashboard:', err)
    });

    // Estado para datos históricos de gráficos
    const [temperatureHistory, setTemperatureHistory] = useState([]);
    const [activityHistory, setActivityHistory] = useState([]);

    // Actualizar datos de gráficas cuando cambien los datos de la API
    useEffect(() => {
        if (sensorHistory?.MLX && sensorHistory.MLX.length > 0) {
            // Crear historial de temperatura corporal
            const tempData = sensorHistory.MLX.slice(-24).map((item, index) => ({
                label: `${String(index).padStart(2, '0')}:00`,
                value: item.temperatura_corporal || 36.5
            }));
            setTemperatureHistory(tempData);
        }
    }, [sensorHistory?.MLX]);

    useEffect(() => {
        if (sensorHistory?.MPU && sensorHistory.MPU.length > 0) {
            // Crear historial de actividad (pasos por día de la semana)
            const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            const mpuData = sensorHistory.MPU.slice(-7);

            const activityData = days.map((day, index) => ({
                label: day,
                value: mpuData[index]?.pasos || Math.floor(Math.random() * 5000 + 3000)
            }));
            setActivityHistory(activityData);
        }
    }, [sensorHistory?.MPU]);

    // Calcular estadísticas actuales
    const stats = {
        bodyTemp: currentValues?.temperatura_corporal || sensorStats?.bodyTemp?.current || 36.5,
        steps: currentValues?.pasos || sensorStats?.steps?.total || 0,
        ambientTemp: currentValues?.temperatura_ambiente || sensorStats?.ambientTemp?.current || 22.0,
        hydration: currentValues?.conductancia ?
            (currentValues.conductancia * 100) :
            (sensorStats?.hydration?.current || 65)
    };

    const getRecommendations = () => {
        const recommendations = [];

        // Recomendación basada en temperatura corporal
        if (stats.bodyTemp > 37.5) {
            recommendations.push({
                type: 'danger',
                text: '🌡️ Temperatura corporal elevada - Buscar lugar fresco y hidratarse'
            });
        } else if (stats.bodyTemp < 36.0) {
            recommendations.push({
                type: 'warning',
                text: '🌡️ Temperatura corporal baja - Abrigarse adecuadamente'
            });
        } else {
            recommendations.push({
                type: 'success',
                text: '✅ Temperatura corporal en rango normal'
            });
        }

        // Recomendación basada en actividad
        if (stats.steps < 3000) {
            recommendations.push({
                type: 'warning',
                text: '🚶 Actividad física baja - Aumentar movimiento para alcanzar meta diaria'
            });
        } else if (stats.steps > 8000) {
            recommendations.push({
                type: 'success',
                text: '🎯 ¡Excelente! Meta de pasos diarios alcanzada'
            });
        }

        // Recomendación basada en hidratación
        if (stats.hydration < 50) {
            recommendations.push({
                type: 'danger',
                text: '💧 Nivel de hidratación crítico - Beber agua inmediatamente'
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
        if (isLoading) return 'Cargando...';
        if (error) return 'Error de conexión';
        if (isConnected) return 'Conectado a API';
        return 'Desconectado';
    };

    const getLastUpdateText = () => {
        if (!lastUpdate) return 'Sin datos';

        const now = new Date();
        const diffSeconds = Math.floor((now - lastUpdate) / 1000);

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
                            isLoading ? 'bg-yellow-500' :
                                isConnected ? 'bg-green-500' : 'bg-red-500'
                        } ${isLoading ? 'animate-pulse' : ''}`}></div>
                        <span className="text-sm text-gray-600">
                            {getConnectionStatus()}
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
                    <Badge variant={isConnected ? 'success' : 'danger'}>
                        {isConnected ? 'API Conectada' : 'API Desconectada'}
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
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshData}
                        disabled={isLoading}
                    >
                        <Icon name="sync" size={16} className={isLoading ? 'animate-spin' : ''} />
                        Actualizar
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

            {/* Real-time sensor data */}
            {currentValues && Object.keys(currentValues).some(key => currentValues[key] !== null) && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Datos en Tiempo Real de la API
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* BME280 - Temperatura y Humedad Ambiente */}
                        <div className="text-center">
                            <p className="text-sm text-gray-600">BME280 - Ambiente</p>
                            <p className="text-xl font-bold text-blue-600">
                                {currentValues.temperatura_ambiente?.toFixed(1) || '--'}°C
                            </p>
                            <p className="text-xs text-gray-500">
                                Humedad: {currentValues.humedad_relativa?.toFixed(1) || '--'}%
                            </p>
                        </div>

                        {/* GSR - Conductancia e Hidratación */}
                        <div className="text-center">
                            <p className="text-sm text-gray-600">GSR - Hidratación</p>
                            <p className="text-xl font-bold text-green-600">
                                {currentValues.conductancia?.toFixed(3) || '--'}
                            </p>
                            <p className="text-xs text-gray-500">
                                Estado: {currentValues.estado_hidratacion || '--'}
                            </p>
                        </div>

                        {/* MLX90614 - Temperatura Corporal */}
                        <div className="text-center">
                            <p className="text-sm text-gray-600">MLX90614 - Corporal</p>
                            <p className="text-xl font-bold text-red-600">
                                {currentValues.temperatura_corporal?.toFixed(1) || '--'}°C
                            </p>
                        </div>

                        {/* MPU6050 - Actividad */}
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

                    {/* Aceleración detallada */}
                    {(currentValues.aceleracion_x !== null ||
                        currentValues.aceleracion_y !== null ||
                        currentValues.aceleracion_z !== null) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="text-md font-medium text-gray-800 mb-2">Aceleración (g)</h4>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-sm text-gray-600">Eje X</p>
                                    <p className="text-lg font-semibold text-indigo-600">
                                        {currentValues.aceleracion_x?.toFixed(3) || '--'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Eje Y</p>
                                    <p className="text-lg font-semibold text-indigo-600">
                                        {currentValues.aceleracion_y?.toFixed(3) || '--'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Eje Z</p>
                                    <p className="text-lg font-semibold text-indigo-600">
                                        {currentValues.aceleracion_z?.toFixed(3) || '--'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Estadísticas detalladas */}
            {sensorStats && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Estadísticas de Sensores
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Estadísticas de Temperatura Corporal */}
                        {sensorStats.bodyTemp && (
                            <div className="text-center">
                                <h4 className="font-medium text-gray-700 mb-2">Temperatura Corporal</h4>
                                <p className="text-2xl font-bold text-red-600">
                                    {sensorStats.bodyTemp.current?.toFixed(1) || '--'}°C
                                </p>
                                <div className="text-xs text-gray-500 mt-1">
                                    <p>Promedio: {sensorStats.bodyTemp.average?.toFixed(1) || '--'}°C</p>
                                    <p>Min: {sensorStats.bodyTemp.min?.toFixed(1) || '--'}°C |
                                        Max: {sensorStats.bodyTemp.max?.toFixed(1) || '--'}°C</p>
                                    <p>Lecturas: {sensorStats.bodyTemp.count || 0}</p>
                                </div>
                            </div>
                        )}

                        {/* Estadísticas de Pasos */}
                        {sensorStats.steps && (
                            <div className="text-center">
                                <h4 className="font-medium text-gray-700 mb-2">Actividad Física</h4>
                                <p className="text-2xl font-bold text-purple-600">
                                    {sensorStats.steps.total?.toLocaleString() || 0}
                                </p>
                                <div className="text-xs text-gray-500 mt-1">
                                    <p>Total de pasos registrados</p>
                                    <p>Sesiones: {sensorStats.steps.count || 0}</p>
                                </div>
                            </div>
                        )}

                        {/* Estadísticas de Temperatura Ambiente */}
                        {sensorStats.ambientTemp && (
                            <div className="text-center">
                                <h4 className="font-medium text-gray-700 mb-2">Temperatura Ambiente</h4>
                                <p className="text-2xl font-bold text-blue-600">
                                    {sensorStats.ambientTemp.current?.toFixed(1) || '--'}°C
                                </p>
                                <div className="text-xs text-gray-500 mt-1">
                                    <p>Promedio: {sensorStats.ambientTemp.average?.toFixed(1) || '--'}°C</p>
                                    <p>Min: {sensorStats.ambientTemp.min?.toFixed(1) || '--'}°C |
                                        Max: {sensorStats.ambientTemp.max?.toFixed(1) || '--'}°C</p>
                                </div>
                            </div>
                        )}

                        {/* Estadísticas de Hidratación */}
                        {sensorStats.hydration && (
                            <div className="text-center">
                                <h4 className="font-medium text-gray-700 mb-2">Hidratación</h4>
                                <p className="text-2xl font-bold text-green-600">
                                    {sensorStats.hydration.current?.toFixed(1) || '--'}%
                                </p>
                                <div className="text-xs text-gray-500 mt-1">
                                    <p>Promedio: {sensorStats.hydration.average?.toFixed(1) || '--'}%</p>
                                    <p>Basado en conductancia GSR</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200">
                    <Chart
                        type="bar"
                        title="Actividad Semanal"
                        data={activityHistory.length > 0 ? activityHistory : [
                            { label: 'Lun', value: 0 },
                            { label: 'Mar', value: 0 },
                            { label: 'Mié', value: 0 },
                            { label: 'Jue', value: 0 },
                            { label: 'Vie', value: 0 },
                            { label: 'Sáb', value: 0 },
                            { label: 'Dom', value: 0 }
                        ]}
                    />
                </div>

                <div className="bg-white rounded-lg border border-gray-200">
                    <Chart
                        type="line"
                        title="Temperatura Corporal (Últimas 24h)"
                        data={temperatureHistory.length > 0 ? temperatureHistory : [
                            { label: '00:00', value: 36.5 },
                            { label: '06:00', value: 36.3 },
                            { label: '12:00', value: 36.7 },
                            { label: '18:00', value: 36.9 },
                            { label: 'Ahora', value: stats.bodyTemp }
                        ]}
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
                            Nivel detectado por sensor GSR {isConnected ? '(tiempo real)' : '(sin conexión)'}
                        </p>
                        {currentValues.estado_hidratacion && (
                            <p className="text-sm font-medium text-center p-2 rounded-lg bg-blue-50 text-blue-800">
                                Estado: {currentValues.estado_hidratacion}
                            </p>
                        )}
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

            {/* Información de debugging si hay error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-red-800 font-medium">Error de conexión con la API:</h4>
                    <p className="text-red-700 text-sm mt-1">{error.message}</p>
                    <p className="text-red-600 text-xs mt-2">
                        Verifica que el servidor Go esté ejecutándose en http://localhost:8080
                    </p>
                </div>
            )}

            {/* Información de datos históricos */}
            {sensorHistory && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-gray-800 font-medium mb-2">Datos Disponibles:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">BME280:</span>
                            <span className="ml-2 font-medium">{sensorHistory.BME?.length || 0} registros</span>
                        </div>
                        <div>
                            <span className="text-gray-600">GSR:</span>
                            <span className="ml-2 font-medium">{sensorHistory.GSR?.length || 0} registros</span>
                        </div>
                        <div>
                            <span className="text-gray-600">MLX90614:</span>
                            <span className="ml-2 font-medium">{sensorHistory.MLX?.length || 0} registros</span>
                        </div>
                        <div>
                            <span className="text-gray-600">MPU6050:</span>
                            <span className="ml-2 font-medium">{sensorHistory.MPU?.length || 0} registros</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}