import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../atoms/Icon';

export const BodyTemperatureChart = ({ data, isConnected }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [temperatureHistory, setTemperatureHistory] = useState([]);
    const [dailyHistory, setDailyHistory] = useState([]);
    const isInitialized = useRef(false);

    // Función para verificar si un valor es válido
    const isValidTemperature = (temp) => {
        return temp !== null && temp !== undefined && !isNaN(temp) && isFinite(temp);
    };

    // Función para determinar la tendencia
    const getTrend = () => {
        if (temperatureHistory.length < 2) return 'stable';

        const current = temperatureHistory[temperatureHistory.length - 1].value;
        const previous = temperatureHistory[temperatureHistory.length - 2].value;
        const difference = current - previous;

        if (difference > 0.1) return 'up';
        if (difference < -0.1) return 'down';
        return 'stable';
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

            // Agregar al historial diario
            setDailyHistory(prev => {
                const newEntry = {
                    time: timeString,
                    value: parseFloat(data),
                    timestamp: now
                };

                // Verificar si es del mismo día
                const today = new Date().toDateString();
                const filteredHistory = prev.filter(entry =>
                    entry.timestamp.toDateString() === today
                );

                return [...filteredHistory, newEntry];
            });
        }
    }, [data]);

    // Inicializar con algunos datos por defecto si no hay historial
    useEffect(() => {
        if (temperatureHistory.length === 0 && !isConnected && !isInitialized.current) {
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

            // Crear historial diario simulado
            const dailyData = Array.from({ length: 8 }, (_, i) => {
                const now = new Date();
                now.setHours(6 + i * 2, 0, 0, 0); // Cada 2 horas desde las 6:00

                return {
                    time: now.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    value: 36.3 + (Math.random() * 1.2) + (i > 4 ? 0.2 : 0), // Temperaturas más altas en la tarde
                    timestamp: now
                };
            });

            setDailyHistory(dailyData);
            isInitialized.current = true;
        }
    }, [isConnected, temperatureHistory.length]);

    // Crear gráfico inicial (solo una vez)
    useEffect(() => {
        const initializeChart = async () => {
            if (!chartRef.current || chartInstance.current || temperatureHistory.length === 0) {
                return;
            }

            try {
                const { Chart, registerables } = await import('chart.js');
                Chart.register(...registerables);

                const ctx = chartRef.current.getContext('2d');

                // Configuración del gradiente
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
                gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

                console.log('📊 Inicializando gráfica de temperatura por primera vez');

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
                                min: 35,
                                max: 40,
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
                            duration: 500,
                            easing: 'easeInOutQuart'
                        }
                    }
                });

                console.log('✅ Gráfica de temperatura inicializada correctamente');

            } catch (error) {
                console.error('❌ Error inicializando gráfica de temperatura:', error);
            }
        };

        initializeChart();

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, [temperatureHistory.length > 0]);

    // Actualizar datos del gráfico existente
    useEffect(() => {
        if (chartInstance.current && temperatureHistory.length > 0) {
            const chart = chartInstance.current;

            // Actualizar labels y datos
            chart.data.labels = temperatureHistory.map(item => item.time);
            chart.data.datasets[0].data = temperatureHistory.map(item => item.value);

            // Actualizar con animación suave
            chart.update('active');

            console.log('🔄 Gráfica actualizada con nuevos datos');
        }
    }, [temperatureHistory]);

    // Obtener estadísticas del tiempo real
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
                    Temperatura Corporal (MLX90614)
                </h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${stats.statusColor}`}>
                    {stats.status}
                </div>
            </div>

            {/* Estadísticas de Tiempo Real */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

            {/* Información del estado */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                    <strong>Estado de conexión:</strong> {isConnected ? 'WebSocket activo' : 'Sin conexión'}
                </p>
                {temperatureHistory.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                        <strong>Lecturas:</strong> {temperatureHistory.length} puntos de datos
                    </p>
                )}
            </div>
        </div>
    );
};