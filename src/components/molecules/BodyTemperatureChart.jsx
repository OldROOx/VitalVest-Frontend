import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../atoms/Icon';

export const BodyTemperatureChart = ({ data, isConnected }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [temperatureHistory, setTemperatureHistory] = useState([]);

    // Agregar nueva temperatura al historial
    useEffect(() => {
        if (data && data !== null && data !== undefined) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });

            setTemperatureHistory(prev => {
                const newHistory = [...prev, {
                    time: timeString,
                    value: data,
                    timestamp: now
                }];

                // Mantener solo las últimas 20 lecturas
                return newHistory.slice(-20);
            });
        }
    }, [data]);

    // Crear/actualizar gráfico
    useEffect(() => {
        const loadChart = async () => {
            if (!chartRef.current || temperatureHistory.length === 0) return;

            const { Chart, registerables } = await import('chart.js');
            Chart.register(...registerables);

            // Destruir gráfico previo
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');

            // Configuración del gradiente
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: temperatureHistory.map(item => item.time),
                    datasets: [{
                        data: temperatureHistory.map(item => item.value),
                        borderColor: '#EF4444',
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#EF4444',
                        pointBorderColor: '#FFFFFF',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        borderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#1F2937',
                            titleColor: '#F9FAFB',
                            bodyColor: '#F9FAFB',
                            borderColor: '#374151',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: false,
                            callbacks: {
                                label: (context) => `Temperatura: ${context.parsed.y.toFixed(1)}°C`
                            }
                        }
                    },
                    scales: {
                        y: {
                            min: 35,
                            max: 40,
                            grid: {
                                color: '#F3F4F6',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#6B7280',
                                font: { size: 12 },
                                callback: (value) => value.toFixed(1) + '°C'
                            },
                            title: {
                                display: true,
                                text: 'Temperatura Corporal (°C)',
                                color: '#374151',
                                font: { size: 13, weight: '500' }
                            }
                        },
                        x: {
                            grid: {
                                color: '#F3F4F6',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#6B7280',
                                font: { size: 12 },
                                maxTicksLimit: 10
                            },
                            title: {
                                display: true,
                                text: 'Hora',
                                color: '#374151',
                                font: { size: 13, weight: '500' }
                            }
                        }
                    }
                }
            });
        };

        loadChart();

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [temperatureHistory]);

    // Obtener estadísticas
    const getStats = () => {
        if (temperatureHistory.length === 0) {
            return {
                current: '--',
                min: '--',
                max: '--',
                avg: '--',
                status: 'Sin datos'
            };
        }

        const values = temperatureHistory.map(h => h.value);
        const current = values[values.length - 1];
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;

        let status = 'Normal';
        if (current > 38) status = 'Fiebre';
        else if (current > 37.5) status = 'Febrícula';
        else if (current < 36) status = 'Hipotermia';

        return {
            current: current.toFixed(1),
            min: min.toFixed(1),
            max: max.toFixed(1),
            avg: avg.toFixed(1),
            status
        };
    };

    const stats = getStats();

    // Color según el estado
    const getStatusColor = (status) => {
        switch (status) {
            case 'Fiebre': return 'text-red-600 bg-red-50';
            case 'Febrícula': return 'text-yellow-600 bg-yellow-50';
            case 'Hipotermia': return 'text-blue-600 bg-blue-50';
            default: return 'text-green-600 bg-green-50';
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Icon name="thermometer" size={20} className="mr-2 text-red-500" />
                    Temperatura Corporal (MLX90614)
                </h3>
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`}></div>
                    <span className="text-sm text-gray-600">
            {isConnected ? 'Sensor Activo' : 'Sin Conexión'}
          </span>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{stats.current}°C</p>
                    <p className="text-xs text-gray-600">Actual</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-semibold text-blue-600">{stats.min}°C</p>
                    <p className="text-xs text-gray-600">Mínima</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-semibold text-red-600">{stats.max}°C</p>
                    <p className="text-xs text-gray-600">Máxima</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-semibold text-gray-700">{stats.avg}°C</p>
                    <p className="text-xs text-gray-600">Promedio</p>
                </div>
                <div className={`text-center p-3 rounded-lg ${getStatusColor(stats.status)}`}>
                    <p className="text-lg font-semibold">{stats.status}</p>
                    <p className="text-xs">Estado</p>
                </div>
            </div>

            {/* Gráfico */}
            <div className="relative h-64">
                <canvas ref={chartRef}></canvas>
            </div>

            {/* Indicadores de rangos */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-green-700">Normal</span>
                    <span className="font-medium text-green-800">36.1°C - 37.2°C</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                    <span className="text-yellow-700">Febrícula</span>
                    <span className="font-medium text-yellow-800">37.3°C - 38.0°C</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <span className="text-red-700">Fiebre</span>
                    <span className="font-medium text-red-800">&gt; 38.0°C</span>
                </div>
            </div>

            {/* Recomendaciones */}
            {stats.status !== 'Normal' && stats.status !== 'Sin datos' && (
                <div className={`mt-4 p-4 rounded-lg border ${
                    stats.status === 'Fiebre' ? 'bg-red-50 border-red-200' :
                        stats.status === 'Febrícula' ? 'bg-yellow-50 border-yellow-200' :
                            'bg-blue-50 border-blue-200'
                }`}>
                    <p className={`text-sm font-medium ${
                        stats.status === 'Fiebre' ? 'text-red-800' :
                            stats.status === 'Febrícula' ? 'text-yellow-800' :
                                'text-blue-800'
                    }`}>
                        ⚠️ Atención: {
                        stats.status === 'Fiebre' ? 'Temperatura elevada detectada. Se recomienda consultar con un médico.' :
                            stats.status === 'Febrícula' ? 'Temperatura ligeramente elevada. Mantener en observación.' :
                                'Temperatura baja detectada. Buscar abrigo y ambiente cálido.'
                    }
                    </p>
                </div>
            )}
        </div>
    );
};