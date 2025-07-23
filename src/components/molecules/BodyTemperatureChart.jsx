import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../atoms/Icon';

export const BodyTemperatureChart = ({ data, isConnected }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [temperatureHistory, setTemperatureHistory] = useState([]);

    // Función para verificar si un valor es válido
    const isValidTemperature = (temp) => {
        return temp !== null && temp !== undefined && !isNaN(temp) && isFinite(temp);
    };

    // Agregar nueva temperatura al historial
    useEffect(() => {
        if (isValidTemperature(data)) {
            console.log('🌡️ Nueva temperatura recibida:', data);

            const now = new Date();
            const timeString = now.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            setTemperatureHistory(prev => {
                const newHistory = [...prev, {
                    time: timeString,
                    value: parseFloat(data),
                    timestamp: now
                }];

                // Mantener solo las últimas 30 lecturas para mejor rendimiento
                const result = newHistory.slice(-30);
                console.log('📊 Historial actualizado, puntos:', result.length);
                return result;
            });
        }
    }, [data]);

    // Inicializar con algunos datos por defecto si no hay historial
    useEffect(() => {
        if (temperatureHistory.length === 0 && !isConnected) {
            // Crear datos iniciales simulados
            const initialData = Array.from({ length: 10 }, (_, i) => {
                const now = new Date();
                now.setMinutes(now.getMinutes() - (10 - i));

                return {
                    time: now.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    value: 36.5 + (Math.random() - 0.5) * 0.6,
                    timestamp: now
                };
            });

            setTemperatureHistory(initialData);
        }
    }, [isConnected, temperatureHistory.length]);

    // Crear/actualizar gráfico
    useEffect(() => {
        const loadChart = async () => {
            if (!chartRef.current || temperatureHistory.length === 0) {
                console.log('📊 No se puede crear gráfica:', {
                    hasCanvas: !!chartRef.current,
                    hasData: temperatureHistory.length > 0
                });
                return;
            }

            try {
                const { Chart, registerables } = await import('chart.js');
                Chart.register(...registerables);

                // Destruir gráfico previo
                if (chartInstance.current) {
                    chartInstance.current.destroy();
                    chartInstance.current = null;
                }

                const ctx = chartRef.current.getContext('2d');

                // Configuración del gradiente
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
                gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

                console.log('📊 Creando gráfica de temperatura con', temperatureHistory.length, 'puntos');

                chartInstance.current = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: temperatureHistory.map(item => item.time),
                        datasets: [{
                            label: 'Temperatura Corporal',
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
                            pointHoverBackgroundColor: '#DC2626',
                            pointHoverBorderColor: '#FFFFFF',
                            pointHoverBorderWidth: 2,
                            borderWidth: 3
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            intersect: false,
                            mode: 'index'
                        },
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
                                    title: (context) => `Hora: ${context[0].label}`,
                                    label: (context) => `Temperatura: ${context.parsed.y.toFixed(1)}°C`
                                }
                            }
                        },
                        scales: {
                            y: {
                                min: 35.5,
                                max: 39.5,
                                grid: {
                                    color: '#F3F4F6',
                                    drawBorder: false
                                },
                                border: {
                                    color: '#D1D5DB',
                                    width: 1
                                },
                                ticks: {
                                    color: '#6B7280',
                                    font: { size: 12 },
                                    callback: (value) => value.toFixed(1) + '°C',
                                    stepSize: 0.5
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
                                border: {
                                    color: '#D1D5DB',
                                    width: 1
                                },
                                ticks: {
                                    color: '#6B7280',
                                    font: { size: 11 },
                                    maxTicksLimit: 8
                                },
                                title: {
                                    display: true,
                                    text: 'Hora',
                                    color: '#374151',
                                    font: { size: 13, weight: '500' }
                                }
                            }
                        },
                        animation: {
                            duration: 750,
                            easing: 'easeInOutQuart'
                        }
                    }
                });

                console.log('✅ Gráfica de temperatura creada exitosamente');

            } catch (error) {
                console.error('❌ Error creando gráfica de temperatura:', error);
            }
        };

        loadChart();

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
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
                status: 'Sin datos',
                statusColor: 'text-gray-500 bg-gray-50'
            };
        }

        const values = temperatureHistory.map(h => h.value);
        const current = values[values.length - 1];
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;

        let status = 'Normal';
        let statusColor = 'text-green-600 bg-green-50';

        if (current > 38.0) {
            status = 'Fiebre';
            statusColor = 'text-red-600 bg-red-50';
        } else if (current > 37.5) {
            status = 'Febrícula';
            statusColor = 'text-yellow-600 bg-yellow-50';
        } else if (current < 36.0) {
            status = 'Hipotermia';
            statusColor = 'text-blue-600 bg-blue-50';
        }

        return {
            current: current.toFixed(1),
            min: min.toFixed(1),
            max: max.toFixed(1),
            avg: avg.toFixed(1),
            status,
            statusColor
        };
    };

    const stats = getStats();

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">

                    Temperatura Corporal (Tiempo Real)
                </h3>
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                        isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm text-gray-600">
                        {isConnected ? 'Sensor Activo' : 'Sin Conexión'}
                    </span>
                    <span className="text-xs text-gray-500">
                        ({temperatureHistory.length} puntos)
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
                <div className={`text-center p-3 rounded-lg ${stats.statusColor}`}>
                    <p className="text-lg font-semibold">{stats.status}</p>
                    <p className="text-xs">Estado</p>
                </div>
            </div>

            {/* Gráfico */}
            <div className="relative h-64 mb-4">
                {temperatureHistory.length > 0 ? (
                    <canvas ref={chartRef}></canvas>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                            <Icon name="thermometer" size={48} className="mx-auto mb-2 text-gray-300" />
                            <p>Esperando datos de temperatura...</p>
                            <p className="text-sm mt-1">
                                {isConnected ? 'Conectado - Esperando datos' : 'Desconectado'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Información adicional */}

            {/* Rangos de referencia */}

        </div>
    );
};