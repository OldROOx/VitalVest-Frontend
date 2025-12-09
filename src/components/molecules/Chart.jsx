// src/components/molecules/Chart.jsx - OPTIMIZADO CON USEMEMO
// ✅ CAMBIOS: Agregado useMemo, useCallback, separación de creación y actualización
// ⚠️ API COMPATIBLE: Props siguen igual (data, type, title, className)

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'

export const Chart = ({
                          data,
                          type = 'line',
                          title,
                          className = ''
                      }) => {
    const chartRef = useRef(null)
    const chartInstance = useRef(null)
    const [chartReady, setChartReady] = useState(false)
    const [error, setError] = useState(null)
    const isInitialized = useRef(false)
    const mountedRef = useRef(true) // ✅ NUEVO: Para cleanup seguro

    // ✅ NUEVO: Memoizar datos procesados para evitar re-renders
    const processedData = useMemo(() => {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return null;
        }

        return {
            labels: data.map(item => item.label || 'Sin etiqueta'),
            values: data.map(item => Number(item.value) || 0),
            length: data.length
        };
    }, [data]);

    // Función para limpiar el gráfico anterior
    const cleanupChart = useCallback(() => {
        if (chartInstance.current) {
            try {
                chartInstance.current.destroy()
            } catch (e) {
                console.warn('Error al destruir gráfica:', e)
            }
            chartInstance.current = null
        }
    }, []);

    // ✅ NUEVO: Actualizar gráfico existente sin recrear (optimización clave)
    const updateChart = useCallback(() => {
        if (!chartInstance.current || !processedData) return;

        try {
            const chart = chartInstance.current;
            chart.data.labels = processedData.labels;
            chart.data.datasets[0].data = processedData.values;

            // Update sin animación para mejor performance
            chart.update('none');

            console.log(`🔄 Gráfica ${type} actualizada (sin recrear)`);
        } catch (error) {
            console.error('Error actualizando gráfica:', error);
        }
    }, [processedData, type]);

    // Inicializar el gráfico una sola vez
    useEffect(() => {
        let mounted = true

        const initializeChart = async () => {
            // Solo inicializar si no está ya inicializado y tenemos datos
            if (isInitialized.current || !processedData || processedData.length === 0) {
                return
            }

            // Verificar que el canvas existe
            if (!chartRef.current) {
                return
            }

            try {
                // Limpiar estado anterior
                if (mounted) {
                    setError(null)
                    setChartReady(false)
                }

                // Importar Chart.js
                const chartModule = await Promise.race([
                    import('chart.js'),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout loading Chart.js')), 5000)
                    )
                ])

                if (!mounted || !mountedRef.current) return

                const { Chart, registerables } = chartModule
                Chart.register(...registerables)

                const ctx = chartRef.current.getContext('2d')

                // Configuración común mejorada
                const commonConfig = {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            enabled: true,
                            backgroundColor: '#1F2937',
                            titleColor: '#F9FAFB',
                            bodyColor: '#F9FAFB',
                            borderColor: '#374151',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: false,
                            intersect: false,
                            mode: 'index'
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    animation: {
                        duration: 300,
                        easing: 'easeInOutQuart'
                    }
                }

                let chartConfig = {}

                if (type === 'bar') {
                    chartConfig = {
                        type: 'bar',
                        data: {
                            labels: processedData.labels,
                            datasets: [{
                                label: 'Pasos',
                                data: processedData.values,
                                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                                borderColor: '#3B82F6',
                                borderWidth: 2,
                                borderRadius: 6,
                                borderSkipped: false,
                                hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)',
                                hoverBorderColor: '#2563EB'
                            }]
                        },
                        options: {
                            ...commonConfig,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: {
                                        color: '#F3F4F6',
                                        lineWidth: 1
                                    },
                                    border: {
                                        color: '#D1D5DB',
                                        width: 1
                                    },
                                    ticks: {
                                        color: '#6B7280',
                                        font: { size: 12 },
                                        callback: (value) => {
                                            if (value >= 1000) {
                                                return (value/1000).toFixed(1) + 'k'
                                            }
                                            return value.toString()
                                        }
                                    },
                                    title: {
                                        display: true,
                                        text: 'Pasos',
                                        color: '#374151',
                                        font: { size: 13, weight: '500' }
                                    }
                                },
                                x: {
                                    grid: { display: false },
                                    border: {
                                        color: '#D1D5DB',
                                        width: 1
                                    },
                                    ticks: {
                                        color: '#6B7280',
                                        font: { size: 12, weight: '500' }
                                    }
                                }
                            },
                            plugins: {
                                ...commonConfig.plugins,
                                tooltip: {
                                    ...commonConfig.plugins.tooltip,
                                    callbacks: {
                                        title: (context) => `${context[0].label}`,
                                        label: (context) => `${Number(context.parsed.y).toLocaleString()} pasos`
                                    }
                                }
                            }
                        }
                    }
                } else if (type === 'line') {
                    // Crear gradiente para línea
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300)
                    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)')
                    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)')

                    chartConfig = {
                        type: 'line',
                        data: {
                            labels: processedData.labels,
                            datasets: [{
                                label: 'Temperatura',
                                data: processedData.values,
                                borderColor: '#3B82F6',
                                backgroundColor: gradient,
                                fill: true,
                                tension: 0.4,
                                pointBackgroundColor: '#3B82F6',
                                pointBorderColor: '#FFFFFF',
                                pointBorderWidth: 2,
                                pointRadius: 4,
                                pointHoverRadius: 6,
                                pointHoverBackgroundColor: '#2563EB',
                                pointHoverBorderColor: '#FFFFFF',
                                pointHoverBorderWidth: 2,
                                borderWidth: 3
                            }]
                        },
                        options: {
                            ...commonConfig,
                            scales: {
                                y: {
                                    grid: {
                                        color: '#F3F4F6',
                                        lineWidth: 1
                                    },
                                    border: {
                                        color: '#D1D5DB',
                                        width: 1
                                    },
                                    ticks: {
                                        color: '#6B7280',
                                        font: { size: 12 },
                                        callback: (value) => Number(value).toFixed(1) + '°C'
                                    },
                                    title: {
                                        display: true,
                                        text: 'Temperatura (°C)',
                                        color: '#374151',
                                        font: { size: 13, weight: '500' }
                                    }
                                },
                                x: {
                                    grid: {
                                        color: '#F3F4F6',
                                        lineWidth: 1
                                    },
                                    border: {
                                        color: '#D1D5DB',
                                        width: 1
                                    },
                                    ticks: {
                                        color: '#6B7280',
                                        font: { size: 11 },
                                        maxTicksLimit: 10
                                    },
                                    title: {
                                        display: true,
                                        text: 'Hora',
                                        color: '#374151',
                                        font: { size: 13, weight: '500' }
                                    }
                                }
                            },
                            plugins: {
                                ...commonConfig.plugins,
                                tooltip: {
                                    ...commonConfig.plugins.tooltip,
                                    callbacks: {
                                        title: (context) => `Hora: ${context[0].label}`,
                                        label: (context) => `Temperatura: ${Number(context.parsed.y).toFixed(1)}°C`
                                    }
                                }
                            }
                        }
                    }
                }

                // Crear el gráfico
                if (mounted && mountedRef.current) {
                    chartInstance.current = new Chart(ctx, chartConfig)
                    setChartReady(true)
                    isInitialized.current = true
                    console.log(`✅ Gráfica ${type} inicializada correctamente`)
                }

            } catch (error) {
                console.error('Error creando gráfica:', error)
                if (mounted && mountedRef.current) {
                    setError(`Error: ${error.message}`)
                    setChartReady(false)
                }
            }
        }

        // Inicializar cuando tengamos datos
        if (processedData && processedData.length > 0) {
            initializeChart()
        }

        // Cleanup
        return () => {
            mounted = false
        }
    }, [processedData?.length > 0, type]) // Solo depende de si hay datos y el tipo

    // ✅ OPTIMIZACIÓN: Actualizar datos del gráfico existente (sin reiniciar)
    useEffect(() => {
        if (chartInstance.current && processedData && processedData.length > 0 && isInitialized.current) {
            updateChart();
        }
    }, [processedData, updateChart])

    // Cleanup al desmontar
    useEffect(() => {
        mountedRef.current = true; // Marcar como montado

        return () => {
            mountedRef.current = false; // Marcar como desmontado
            cleanupChart()
            isInitialized.current = false
        }
    }, [cleanupChart])

    // ✅ NUEVO: Calcular estadísticas con useMemo
    const stats = useMemo(() => {
        if (!processedData || !Array.isArray(processedData.values) || processedData.values.length === 0) {
            return null
        }

        if (type === 'bar') {
            const totalSteps = processedData.values.reduce((sum, item) => sum + item, 0)
            const avgSteps = Math.round(totalSteps / processedData.values.length)
            return { totalSteps, avgSteps }
        }

        if (type === 'line') {
            const values = processedData.values
            const avgTemp = values.reduce((a, b) => a + b, 0) / values.length
            const minTemp = Math.min(...values)
            const maxTemp = Math.max(...values)
            return { avgTemp, minTemp, maxTemp }
        }

        return null
    }, [processedData, type])

    return (
        <div className={`p-6 ${className}`}>
            {title && (
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <div className="flex items-center space-x-2">
                        {processedData && (
                            <span className="text-sm text-gray-500">
                                {processedData.length} puntos
                            </span>
                        )}
                        <div className={`w-2 h-2 rounded-full ${
                            chartReady ? 'bg-green-500' : error ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                    </div>
                </div>
            )}

            <div className="relative h-64 bg-gray-50 rounded-lg">
                {/* Canvas para la gráfica */}
                <canvas
                    ref={chartRef}
                    className="w-full h-full"
                    style={{ display: chartReady ? 'block' : 'none' }}
                ></canvas>

                {/* Estados de carga/error */}
                {!chartReady && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        {error ? (
                            <div className="text-center text-red-600">
                                <div className="mb-2">⚠️</div>
                                <p className="text-sm">{error}</p>
                                <p className="text-xs mt-1">
                                    {processedData?.length || 0} puntos de datos disponibles
                                </p>
                            </div>
                        ) : !processedData || processedData.length === 0 ? (
                            <div className="text-center text-gray-500">
                                <div className="mb-2">📊</div>
                                <p className="text-sm">Esperando datos...</p>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500">
                                <div className="mb-2 animate-spin">⏳</div>
                                <p className="text-sm">Inicializando gráfica...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Estadísticas */}
            {chartReady && stats && (
                <div className="mt-4 text-center">
                    {type === 'bar' && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Total hoy:</span>
                                <p className="font-semibold text-gray-700">
                                    {stats.totalSteps.toLocaleString()} pasos
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500">Promedio por hora:</span>
                                <p className="font-semibold text-gray-700">
                                    {stats.avgSteps.toLocaleString()} pasos
                                </p>
                            </div>
                        </div>
                    )}

                    {type === 'line' && (
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Promedio:</span>
                                <p className="font-semibold text-blue-600">
                                    {stats.avgTemp.toFixed(1)}°C
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500">Mínima:</span>
                                <p className="font-semibold text-cyan-600">
                                    {stats.minTemp.toFixed(1)}°C
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500">Máxima:</span>
                                <p className="font-semibold text-red-600">
                                    {stats.maxTemp.toFixed(1)}°C
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}