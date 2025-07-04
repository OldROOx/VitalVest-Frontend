// src/components/molecules/SimpleChart.jsx
import { useEffect, useRef } from 'react'

export const SimpleChart = ({
                                data,
                                type = 'line',
                                title,
                                className = ''
                            }) => {
    const chartRef = useRef(null)
    const chartInstance = useRef(null)

    useEffect(() => {
        const loadChart = async () => {
            // Importar Chart.js dinámicamente
            const { Chart, registerables } = await import('chart.js')
            Chart.register(...registerables)

            if (!chartRef.current || !data) return

            // Destruir gráfico previo si existe
            if (chartInstance.current) {
                chartInstance.current.destroy()
            }

            const ctx = chartRef.current.getContext('2d')

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
                scales: {
                    y: {
                        grid: { color: '#F3F4F6' },
                        ticks: { color: '#6B7280', font: { size: 12 } }
                    },
                    x: {
                        grid: { color: type === 'line' ? '#F3F4F6' : 'transparent' },
                        ticks: { color: '#6B7280', font: { size: 12, weight: '500' } }
                    }
                }
            }

            if (type === 'bar') {
                chartInstance.current = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: data.map(item => item.label),
                        datasets: [{
                            data: data.map(item => item.value),
                            backgroundColor: '#3B82F6',
                            borderColor: '#2563EB',
                            borderWidth: 1,
                            borderRadius: 4,
                        }]
                    },
                    options: {
                        ...commonOptions,
                        plugins: {
                            ...commonOptions.plugins,
                            tooltip: {
                                ...commonOptions.plugins.tooltip,
                                callbacks: {
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
                                    callback: (value) => value >= 1000 ? (value/1000).toFixed(1) + 'k' : value
                                }
                            }
                        }
                    }
                })
            }

            if (type === 'line') {
                chartInstance.current = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.map(item => item.label),
                        datasets: [{
                            data: data.map(item => item.value),
                            borderColor: '#3B82F6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#3B82F6',
                            pointBorderColor: '#FFFFFF',
                            pointBorderWidth: 2,
                            pointRadius: 5,
                            pointHoverRadius: 7
                        }]
                    },
                    options: {
                        ...commonOptions,
                        plugins: {
                            ...commonOptions.plugins,
                            tooltip: {
                                ...commonOptions.plugins.tooltip,
                                callbacks: {
                                    label: (context) => `${context.parsed.y.toFixed(1)}°C`
                                }
                            }
                        },
                        scales: {
                            ...commonOptions.scales,
                            y: {
                                ...commonOptions.scales.y,
                                min: Math.min(...data.map(d => d.value)) - 0.2,
                                max: Math.max(...data.map(d => d.value)) + 0.2,
                                ticks: {
                                    ...commonOptions.scales.y.ticks,
                                    callback: (value) => value.toFixed(1) + '°C'
                                }
                            }
                        }
                    }
                })
            }
        }

        loadChart()

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy()
            }
        }
    }, [data, type])

    const totalSteps = type === 'bar' && data ?
        data.reduce((sum, item) => sum + item.value, 0) : 0

    const avgTemp = type === 'line' && data ?
        (data.reduce((sum, item) => sum + item.value, 0) / data.length) : 0

    return (
        <div className={`p-6 ${className}`}>
            {title && <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>}

            <div className="relative h-64">
                <canvas ref={chartRef}></canvas>
            </div>

            <div className="mt-4 text-center">
                {type === 'bar' && (
                    <p className="text-sm text-gray-500">
                        Total esta semana: {totalSteps.toLocaleString()} pasos
                    </p>
                )}
                {type === 'line' && (
                    <p className="text-sm text-gray-500">
                        Temperatura promedio: {avgTemp.toFixed(1)}°C
                    </p>
                )}
            </div>
        </div>
    )
}