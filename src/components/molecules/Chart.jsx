import { useEffect, useRef } from 'react'

export const Chart = ({
                          data,
                          type = 'line',
                          title,
                          className = ''
                      }) => {
    const chartRef = useRef(null)
    const chartInstance = useRef(null)

    // Función para limpiar el gráfico anterior
    const cleanupChart = () => {
        if (chartInstance.current) {
            chartInstance.current.destroy()
            chartInstance.current = null
        }
    }

    useEffect(() => {
        const loadChart = async () => {
            // Verificar que tenemos datos válidos
            if (!data || !Array.isArray(data) || data.length === 0) {
                console.log('📊 Sin datos para mostrar en gráfica:', { data, type, title })
                return
            }

            // Verificar que el canvas existe
            if (!chartRef.current) {
                console.log('📊 Canvas no disponible')
                return
            }

            try {
                // Importar Chart.js dinámicamente
                const { Chart, registerables } = await import('chart.js')
                Chart.register(...registerables)

                // Limpiar gráfico previo
                cleanupChart()

                const ctx = chartRef.current.getContext('2d')

                console.log(`📊 Creando gráfica ${type} con ${data.length} puntos:`, data)

                // Configuración común
                const commonOptions = {
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
                            displayColors: false
                        }
                    },
                    animation: {
                        duration: 750,
                        easing: 'easeInOutQuart'
                    },
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
                                font: { size: 12 }
                            },
                            title: {
                                display: true,
                                text: type === 'bar' ? 'Actividad (Pasos)' : 'Temperatura (°C)',
                                color: '#374151',
                                font: { size: 13, weight: '500' }
                            }
                        },
                        x: {
                            grid: {
                                color: type === 'line' ? '#F3F4F6' : 'transparent',
                                lineWidth: 1
                            },
                            border: {
                                color: '#D1D5DB',
                                width: 1
                            },
                            ticks: {
                                color: '#6B7280',
                                font: { size: 12, weight: '500' },
                                maxTicksLimit: type === 'line' ? 10 : 7
                            },
                            title: {
                                display: true,
                                text: type === 'bar' ? 'Días de la Semana' : 'Hora del Día',
                                color: '#374151',
                                font: { size: 13, weight: '500' }
                            }
                        }
                    }
                }

                if (type === 'bar') {
                    chartInstance.current = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: data.map(item => item.label),
                            datasets: [{
                                label: 'Pasos',
                                data: data.map(item => item.value),
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
                            ...commonOptions,
                            plugins: {
                                ...commonOptions.plugins,
                                tooltip: {
                                    ...commonOptions.plugins.tooltip,
                                    callbacks: {
                                        title: (context) => `${context[0].label}`,
                                        label: (context) => `${context.parsed.y.toLocaleString()} pasos`
                                    }
                                }
                            },
                            scales: {
                                ...commonOptions.scales,
                                y: {
                                    ...commonOptions.scales.y,
                                    beginAtZero: true,
                                    ticks: {
                                        ...commonOptions.scales.y.ticks,
                                        callback: (value) => {
                                            if (value >= 1000) {
                                                return (value/1000).toFixed(1) + 'k'
                                            }
                                            return value.toString()
                                        }
                                    }
                                }
                            }
                        }
                    })
                }

                if (type === 'line') {
                    // Crear gradiente para el área bajo la línea
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300)
                    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)')
                    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)')

                    chartInstance.current = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: data.map(item => item.label),
                            datasets: [{
                                label: 'Temperatura',
                                data: data.map(item => item.value),
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
                            ...commonOptions,
                            plugins: {
                                ...commonOptions.plugins,
                                tooltip: {
                                    ...commonOptions.plugins.tooltip,
                                    callbacks: {
                                        title: (context) => `Hora: ${context[0].label}`,
                                        label: (context) => `Temperatura: ${context.parsed.y.toFixed(1)}°C`
                                    }
                                }
                            },
                            scales: {
                                ...commonOptions.scales,
                                y: {
                                    ...commonOptions.scales.y,
                                    // Calcular rango dinámico basado en los datos
                                    min: Math.min(...data.map(d => d.value)) - 0.5,
                                    max: Math.max(...data.map(d => d.value)) + 0.5,
                                    ticks: {
                                        ...commonOptions.scales.y.ticks,
                                        callback: (value) => value.toFixed(1) + '°C'
                                    }
                                }
                            }
                        }
                    })
                }

                console.log('✅ Gráfica creada exitosamente:', type, title)

            } catch (error) {
                console.error('❌ Error creando gráfica:', error)
            }
        }

        loadChart()

        // Cleanup al desmontar
        return () => {
            cleanupChart()
        }
    }, [data, type, title]) // Dependencias críticas para re-renderizar

    // Calcular estadísticas para mostrar debajo del gráfico
    const totalSteps = type === 'bar' && data && Array.isArray(data) ?
        data.reduce((sum, item) => sum + (item.value || 0), 0) : 0

    const avgTemp = type === 'line' && data && Array.isArray(data) && data.length > 0 ?
        (data.reduce((sum, item) => sum + (item.value || 0), 0) / data.length) : 0

    const minTemp = type === 'line' && data && Array.isArray(data) && data.length > 0 ?
        Math.min(...data.map(d => d.value || 0)) : 0

    const maxTemp = type === 'line' && data && Array.isArray(data) && data.length > 0 ?
        Math.max(...data.map(d => d.value || 0)) : 0

    return (
        <div className={`p-6 ${className}`}>
            {title && (
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    {data && Array.isArray(data) && (
                        <span className="text-sm text-gray-500">
                            {data.length} puntos de datos
                        </span>
                    )}
                </div>
            )}

            <div className="relative h-64">
                <canvas ref={chartRef}></canvas>
            </div>

            <div className="mt-4 text-center">
                {type === 'bar' && data && Array.isArray(data) && (
                    <>
                        <p className="text-sm text-gray-600 mb-2">
                            Actividad física registrada durante la semana
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Total esta semana:</span>
                                <p className="font-semibold text-gray-700">
                                    {totalSteps.toLocaleString()} pasos
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500">Promedio diario:</span>
                                <p className="font-semibold text-gray-700">
                                    {Math.round(totalSteps / data.length).toLocaleString()} pasos
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Meta diaria recomendada: 8,000 pasos
                        </p>
                    </>
                )}

                {type === 'line' && data && Array.isArray(data) && data.length > 0 && (
                    <>
                        <p className="text-sm text-gray-600 mb-2">
                            Monitoreo de temperatura en tiempo real
                        </p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Promedio:</span>
                                <p className="font-semibold text-blue-600">
                                    {avgTemp.toFixed(1)}°C
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500">Mínima:</span>
                                <p className="font-semibold text-cyan-600">
                                    {minTemp.toFixed(1)}°C
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500">Máxima:</span>
                                <p className="font-semibold text-red-600">
                                    {maxTemp.toFixed(1)}°C
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Rango normal: 36.1°C - 37.2°C
                        </p>
                    </>
                )}

                {(!data || !Array.isArray(data) || data.length === 0) && (
                    <div className="text-gray-500 text-sm">
                        <p>Sin datos disponibles para mostrar</p>
                        <p className="text-xs mt-1">Los datos aparecerán cuando estén disponibles</p>
                    </div>
                )}
            </div>
        </div>
    )
}