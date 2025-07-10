// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { DashboardStats } from '../components/organisms/DashboardStats';
import { Chart } from '../components/molecules/Chart';
import { useWebSocket } from '../hooks/useWebSocket';
import { Badge } from '../components/atoms/Badge';
import { Icon } from '../components/atoms/Icon';

export default function Dashboard() {
    const { isConnected, sensorData, connectionError, reconnect } = useWebSocket();

    // Estado para datos históricos de gráficos
    const [temperatureHistory, setTemperatureHistory] = useState([
        { label: '00:00', value: 36.5 },
        { label: '04:00', value: 36.3 },
        { label: '08:00', value: 36.7 },
        { label: '12:00', value: 36.9 },
        { label: '16:00', value: 37.1 },
        { label: '20:00', value: 36.8 },
        { label: 'Ahora', value: 36.9 }
    ]);

    const [activityHistory, setActivityHistory] = useState([
        { label: 'Lun', value: 6500 },
        { label: 'Mar', value: 7200 },
        { label: 'Mié', value: 5800 },
        { label: 'Jue', value: 8100 },
        { label: 'Vie', value: 7900 },
        { label: 'Sáb', value: 9200 },
        { label: 'Dom', value: 4300 }
    ]);

    // Calcular estadísticas en tiempo real
    const stats = {
        bodyTemp: sensorData.MLX?.temperatura_corporal || 36.9,
        steps: sensorData.MPU?.pasos || 2100,
        ambientTemp: sensorData.BME?.temperatura_ambiente || 25.9,
        hydration: sensorData.GSR?.conductancia ?
            Math.round(sensorData.GSR.conductancia * 100) : 71
    };

    // Actualizar gráficos cuando llegan nuevos datos
    useEffect(() => {
        if (sensorData.MLX?.temperatura_corporal) {
            const now = new Date();
            const timeLabel = now.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });

            setTemperatureHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1] = {
                    label: timeLabel,
                    value: sensorData.MLX.temperatura_corporal
                };
                return newHistory;
            });
        }
    }, [sensorData.MLX]);

    useEffect(() => {
        if (sensorData.MPU?.pasos) {
            const today = new Date().toLocaleDateString('es-ES', { weekday: 'short' });

            setActivityHistory(prev => {
                const newHistory = [...prev];
                const todayIndex = newHistory.findIndex(item =>
                    item.label.toLowerCase() === today.toLowerCase()
                );

                if (todayIndex !== -1) {
                    newHistory[todayIndex].value = sensorData.MPU.pasos;
                }
                return newHistory;
            });
        }
    }, [sensorData.MPU]);

    const getRecommendations = () => {
        const recommendations = [];

        // Recomendación basada en temperatura
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

    const lastUpdate = sensorData.BME ? 'Tiempo real' : 'hace 2 min';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-600">
                            {isConnected ? 'Conectado' : 'Desconectado'}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500">
                        Última actualización: {lastUpdate}
                    </p>
                </div>
            </div>

            {/* Estado de conexión WebSocket */}
            {!isConnected && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Icon name="alerts" size={20} className="text-yellow-600" />
                            <span className="text-yellow-800">
                                Sin conexión en tiempo real. Mostrando datos simulados.
                            </span>
                        </div>
                        <button
                            onClick={reconnect}
                            className="text-yellow-800 hover:text-yellow-900 font-medium"
                        >
                            Reconectar
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <DashboardStats stats={stats} />

            {/* Real-time sensor data */}
            {isConnected && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Datos en Tiempo Real
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">BME280 - Temperatura Ambiente</p>
                            <p className="text-xl font-bold text-blue-600">
                                {sensorData.BME?.temperatura_ambiente?.toFixed(1) || '--'}°C
                            </p>
                            <p className="text-xs text-gray-500">
                                Humedad: {sensorData.BME?.humedad_relativa?.toFixed(1) || '--'}%
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">GSR - Conductancia</p>
                            <p className="text-xl font-bold text-green-600">
                                {sensorData.GSR?.conductancia?.toFixed(3) || '--'}
                            </p>
                            <p className="text-xs text-gray-500">
                                Estado: {sensorData.GSR?.estado_hidratacion || '--'}
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">MLX90614 - Temp. Corporal</p>
                            <p className="text-xl font-bold text-red-600">
                                {sensorData.MLX?.temperatura_corporal?.toFixed(1) || '--'}°C
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">MPU6050 - Actividad</p>
                            <p className="text-xl font-bold text-purple-600">
                                {sensorData.MPU?.pasos || '--'} pasos
                            </p>
                            <p className="text-xs text-gray-500">
                                Nivel: {sensorData.MPU?.nivel_actividad || '--'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

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
                        title="Temperatura Corporal (24h)"
                        data={temperatureHistory}
                    />
                </div>
            </div>

            {/* Additional Metrics and Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hidratación de la Piel</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Nivel actual</span>
                            <span className="text-lg font-semibold text-blue-600">{stats.hydration}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${stats.hydration}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500">
                            Nivel detectado por sensor GSR {isConnected ? '(tiempo real)' : '(simulado)'}
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
        </div>
    );
}