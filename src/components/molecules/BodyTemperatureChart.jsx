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

                // Preparar datos para mostrar solo hasta el punto del medio
                const middleIndex = Math.floor(temperatureHistory.length / 2);
                const displayData = temperatureHistory.slice(0, middleIndex + 1);

                // Crear labels completos pero datos solo hasta el medio
                const allLabels = temperatureHistory.map(item => item.time);
                const chartData = temperatureHistory.map((item, index) =>
                    index <= middleIndex ? item.value : null
                );

                console.log('📊 Inicializando gráfica de temperatura por primera vez');

                chartInstance.current = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: allLabels,
                        datasets: [{
                            label: 'Temperatura Corporal',
                            data: chartData,
                            borderColor: '#EF4444',
                            backgroundColor: gradient,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: temperatureHistory.map((_, index) => {
                                if (index === middleIndex) {
                                    const trend = getTrend();
                                    return trend === 'up' ? '#EF4444' : trend === 'down' ? '#3B82F6' : '#6B7280';
                                }
                                return index <= middleIndex ? 'rgba(239, 68, 68, 0.3)' : 'transparent';
                            }),
                            pointBorderColor: temperatureHistory.map((_, index) => {
                                if (index === middleIndex) return '#FFFFFF';
                                return index <= middleIndex ? 'rgba(255, 255, 255, 0.5)' : 'transparent';
                            }),
                            pointBorderWidth: temperatureHistory.map((_, index) => {
                                return index === middleIndex ? 3 : 1;
                            }),
                            pointRadius: temperatureHistory.map((_, index) => {
                                if (index === middleIndex) return 8;
                                return index <= middleIndex ? 2 : 0;
                            }),
                            pointHoverRadius: temperatureHistory.map((_, index) => {
                                if (index === middleIndex) return 10;
                                return index <= middleIndex ? 4 : 0;
                            }),
                            pointHoverBackgroundColor: '#DC2626',
                            pointHoverBorderColor: '#FFFFFF',
                            pointHoverBorderWidth: 2,
                            borderWidth: 3,
                            spanGaps: false
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
                                min: 0,
                                max: 60,
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
                                    callback: (value) => value.toFixed(0) + '°C',
                                    stepSize: 5
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
            const ctx = chart.ctx;

            // Actualizar gradiente
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

            // Determinar el punto del medio
            const middleIndex = Math.floor(temperatureHistory.length / 2);

            // Actualizar labels y datos - solo mostrar hasta el punto del medio
            chart.data.labels = temperatureHistory.map(item => item.time);
            chart.data.datasets[0].data = temperatureHistory.map((item, index) =>
                index <= middleIndex ? item.value : null
            );
            chart.data.datasets[0].backgroundColor = gradient;

            // Actualizar el punto del medio con la tendencia
            const currentTrend = getTrend();

            chart.data.datasets[0].pointBackgroundColor = temperatureHistory.map((_, index) => {
                if (index === middleIndex) {
                    return currentTrend === 'up' ? '#EF4444' : currentTrend === 'down' ? '#3B82F6' : '#6B7280';
                }
                return index <= middleIndex ? 'rgba(239, 68, 68, 0.3)' : 'transparent';
            });

            chart.data.datasets[0].pointBorderColor = temperatureHistory.map((_, index) => {
                if (index === middleIndex) return '#FFFFFF';
                return index <= middleIndex ? 'rgba(255, 255, 255, 0.5)' : 'transparent';
            });

            chart.data.datasets[0].pointBorderWidth = temperatureHistory.map((_, index) => {
                return index === middleIndex ? 3 : 1;
            });

            chart.data.datasets[0].pointRadius = temperatureHistory.map((_, index) => {
                if (index === middleIndex) return 8;
                return index <= middleIndex ? 2 : 0;
            });

            chart.data.datasets[0].pointHoverRadius = temperatureHistory.map((_, index) => {
                if (index === middleIndex) return 10;
                return index <= middleIndex ? 4 : 0;
            });

            // Ajustar escala Y fija de 0 a 60 grados
            chart.options.scales.y.min = 0;
            chart.options.scales.y.max = 60;

            // Actualizar con animación suave
            chart.update('active');

            console.log('🔄 Gráfica actualizada - punto indicador en el medio, derecha vacía');
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

    // Obtener estadísticas del día completo
    const getDailyStats = () => {
        if (dailyHistory.length === 0) {
            return {
                readings: 0,
                maxTemp: '--',
                maxTime: '--',
                minTemp: '--',
                minTime: '--',
                avgTemp: '--',
                timeInFever: 0,
                normalReadings: 0,
                totalChange: 0,
                changeFromMorning: 0,
                changeFromPrevious: 0,
                trend: 'stable'
            };
        }

        const values = dailyHistory.map(h => h.value);
        const max = Math.max(...values);
        const min = Math.min(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;

        // Encontrar los momentos de máxima y mínima temperatura
        const maxEntry = dailyHistory.find(h => h.value === max);
        const minEntry = dailyHistory.find(h => h.value === min);

        // Contar lecturas con fiebre (>37.5°C) y normales
        const feverReadings = dailyHistory.filter(h => h.value > 37.5).length;
        const normalReadings = dailyHistory.filter(h => h.value >= 36.1 && h.value <= 37.5).length;
        const timeInFever = ((feverReadings / dailyHistory.length) * 100).toFixed(0);

        // Calcular cambios de temperatura
        const firstReading = dailyHistory[0].value;
        const lastReading = dailyHistory[dailyHistory.length - 1].value;
        const totalChange = lastReading - firstReading;

        // Cambio desde la mañana (primera lectura del día)
        const changeFromMorning = lastReading - firstReading;

        // Cambio desde la lectura anterior (si hay más de una)
        let changeFromPrevious = 0;
        if (dailyHistory.length > 1) {
            const previousReading = dailyHistory[dailyHistory.length - 2].value;
            changeFromPrevious = lastReading - previousReading;
        }

        // Determinar tendencia general del día
        let trend = 'stable';
        if (Math.abs(totalChange) < 0.3) {
            trend = 'stable';
        } else if (totalChange > 0) {
            trend = 'rising';
        } else {
            trend = 'falling';
        }

        return {
            readings: dailyHistory.length,
            maxTemp: max.toFixed(1),
            maxTime: maxEntry ? maxEntry.time : '--',
            minTemp: min.toFixed(1),
            minTime: minEntry ? minEntry.time : '--',
            avgTemp: avg.toFixed(1),
            timeInFever: timeInFever,
            normalReadings: normalReadings,
            totalChange: totalChange,
            changeFromMorning: changeFromMorning,
            changeFromPrevious: changeFromPrevious,
            trend: trend
        };
    };

    const stats = getStats();
    const dailyStats = getDailyStats();
    const trend = getTrend();

    return (
        <div className="space-y-6">
            {/* Gráfica de Tiempo Real */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        Temperatura Corporal (Tiempo Real)
                    </h3>
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
            </div>

            {/* Resumen del Día */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Icon name="calendar" size={20} className="mr-2 text-blue-500" />
                        Resumen del Día
                    </h3>
                    <div className="text-sm text-gray-500">
                        {new Date().toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                </div>

                {/* Estadísticas Principales del Día */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-2xl font-bold text-red-600">{dailyStats.maxTemp}°C</p>
                        <p className="text-xs text-gray-600">Máxima del Día</p>
                        <p className="text-xs text-red-500 mt-1">{dailyStats.maxTime}</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-2xl font-bold text-blue-600">{dailyStats.minTemp}°C</p>
                        <p className="text-xs text-gray-600">Mínima del Día</p>
                        <p className="text-xs text-blue-500 mt-1">{dailyStats.minTime}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-2xl font-bold text-green-600">{dailyStats.avgTemp}°C</p>
                        <p className="text-xs text-gray-600">Promedio del Día</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-2xl font-bold text-gray-700">{dailyStats.readings}</p>
                        <p className="text-xs text-gray-600">Total Lecturas</p>
                    </div>
                </div>

                {/* Indicadores de Cambio de Temperatura */}
                <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                        <Icon name="trending-up" size={18} className="mr-2 text-indigo-500" />
                        Cambios de Temperatura
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Cambio desde la mañana */}
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Desde la Mañana</p>
                                    <div className="flex items-center mt-1">
                                        <p className={`text-lg font-bold ${
                                            dailyStats.changeFromMorning > 0 ? 'text-red-600' :
                                                dailyStats.changeFromMorning < 0 ? 'text-blue-600' : 'text-gray-600'
                                        }`}>
                                            {dailyStats.changeFromMorning > 0 ? '+' : ''}
                                            {dailyStats.changeFromMorning.toFixed(1)}°C
                                        </p>
                                        <Icon
                                            name={dailyStats.changeFromMorning > 0 ? "arrow-up" :
                                                dailyStats.changeFromMorning < 0 ? "arrow-down" : "minus"}
                                            size={16}
                                            className={`ml-2 ${
                                                dailyStats.changeFromMorning > 0 ? 'text-red-500' :
                                                    dailyStats.changeFromMorning < 0 ? 'text-blue-500' : 'text-gray-500'
                                            }`}
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                                Cambio desde la primera lectura
                            </p>
                        </div>

                        {/* Cambio desde la lectura anterior */}
                        <div className="p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Última Variación</p>
                                    <div className="flex items-center mt-1">
                                        <p className={`text-lg font-bold ${
                                            dailyStats.changeFromPrevious > 0 ? 'text-red-600' :
                                                dailyStats.changeFromPrevious < 0 ? 'text-blue-600' : 'text-gray-600'
                                        }`}>
                                            {dailyStats.changeFromPrevious > 0 ? '+' : ''}
                                            {dailyStats.changeFromPrevious.toFixed(1)}°C
                                        </p>
                                        <Icon
                                            name={dailyStats.changeFromPrevious > 0 ? "arrow-up" :
                                                dailyStats.changeFromPrevious < 0 ? "arrow-down" : "minus"}
                                            size={16}
                                            className={`ml-2 ${
                                                dailyStats.changeFromPrevious > 0 ? 'text-red-500' :
                                                    dailyStats.changeFromPrevious < 0 ? 'text-blue-500' : 'text-gray-500'
                                            }`}
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                                Desde la lectura anterior
                            </p>
                        </div>

                        {/* Tendencia general del día */}
                        <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Tendencia del Día</p>
                                    <div className="flex items-center mt-1">
                                        <p className={`text-lg font-bold ${
                                            dailyStats.trend === 'rising' ? 'text-red-600' :
                                                dailyStats.trend === 'falling' ? 'text-blue-600' : 'text-green-600'
                                        }`}>
                                            {dailyStats.trend === 'rising' ? 'Subiendo' :
                                                dailyStats.trend === 'falling' ? 'Bajando' : 'Estable'}
                                        </p>
                                        <Icon
                                            name={dailyStats.trend === 'rising' ? "trending-up" :
                                                dailyStats.trend === 'falling' ? "trending-down" : "activity"}
                                            size={16}
                                            className={`ml-2 ${
                                                dailyStats.trend === 'rising' ? 'text-red-500' :
                                                    dailyStats.trend === 'falling' ? 'text-blue-500' : 'text-green-500'
                                            }`}
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                                Patrón general observado
                            </p>
                        </div>
                    </div>

                    {/* Rango de variación total */}
                    <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Icon name="bar-chart-3" size={20} className="mr-2 text-gray-600" />
                                <span className="text-sm font-medium text-gray-700">
                                    Rango de Variación Total del Día:
                                </span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-lg font-bold text-gray-800 mr-2">
                                    {(parseFloat(dailyStats.maxTemp) - parseFloat(dailyStats.minTemp)).toFixed(1)}°C
                                </span>
                                <span className="text-sm text-gray-600">
                                    ({dailyStats.minTemp}°C → {dailyStats.maxTemp}°C)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detalles Adicionales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Tiempo en Fiebre</p>
                                <p className="text-xl font-bold text-yellow-600">{dailyStats.timeInFever}%</p>
                            </div>
                            <Icon name="alert-triangle" size={24} className="text-yellow-500" />
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                            Porcentaje del día con temperatura &gt; 37.5°C
                        </p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Lecturas Normales</p>
                                <p className="text-xl font-bold text-green-600">{dailyStats.normalReadings}</p>
                            </div>
                            <Icon name="check-circle" size={24} className="text-green-500" />
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                            Temperaturas entre 36.1°C - 37.5°C
                        </p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Estado Actual</p>
                                <p className={`text-xl font-bold ${stats.statusColor.split(' ')[0]}`}>
                                    {stats.status}
                                </p>
                            </div>
                            <Icon name="thermometer" size={24} className="text-blue-500" />
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                            Basado en la última lectura
                        </p>
                    </div>
                </div>

                {/* Información del periodo */}
                {dailyHistory.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                            <strong>Periodo monitoreado:</strong> Desde las {dailyHistory[0]?.time} hasta las {dailyHistory[dailyHistory.length - 1]?.time}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};