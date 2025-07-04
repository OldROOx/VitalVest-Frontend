// src/components/molecules/Chart.jsx
import { useEffect, useRef } from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js'

// Registrar componentes de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
)

export const Chart = ({
                          data,
                          type = 'line',
                          title,
                          className = ''
                      }) => {
    const chartRef = useRef(null)
    const chartInstance = useRef(null)

    useEffect(() => {
        if (!chartRef.current || !data) return

        // Destruir gráfico previo si existe
        if (chartInstance.current) {
            chartInstance.current.destroy()
        }

        const ctx = chartRef.current.getContext('2d')

        // Configuración para gráfico de barras (pasos)
        if (type === 'bar') {
            chartInstance.current = new ChartJS(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(item => item.label),
                    datasets: [{
                        label: 'Pasos',
                        data: data.map(item => item.value),
                        backgroundColor: '#3B82F6',
                        borderColor: '#2563EB',
                        borderWidth: 1,
                        borderRadius: 4,
                        borderSkipped: false,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: '#1F2937',
                            titleColor: '#F9FAFB',
                            bodyColor: '#F9FAFB',
                            borderColor: '#374151',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: false,
                            callbacks: {
                                label: function(context) {
                                    return `${context.parsed.y.toLocaleString()} pasos`
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: '#F3F4F6',
                                lineWidth: 1
                            },
                            ticks: {
                                color: '#6B7280',
                                font: {
                                    size: 12
                                },
                                callback: function(value) {
                                    return value >= 1000 ? (value/1000).toFixed(1) + 'k' : value
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#6B7280',
                                font: {
                                    size: 12,
                                    weight: '500'
                                }
                            }
                        }
                    }
                }
            })
        }

        // Configuración para gráfico de línea (temperatura)
        if (type === 'line') {
            chartInstance.current = new ChartJS(ctx, {
                type: 'line',
                data: {
                    labels: data.map(item => item.label),
                    datasets: [{
                        label: 'Temperatura',
                        data: data.map(item => item.value),
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#3B82F6',
                        pointBorderColor: '#FFFFFF',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        pointHoverBackgroundColor: '#2563EB',
                        pointHoverBorderColor: '#FFFFFF',
                        pointHoverBorderWidth: 3
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
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: '#1F2937',
                            titleColor: '#F9FAFB',
                            bodyColor: '#F9FAFB',
                            borderColor: '#374151',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: false,
                            callbacks: {
                                label: function(context) {
                                    return `${context.parsed.y.toFixed(1)}°C`
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            grid: {
                                color: '#F3F4F6',
                                lineWidth: 1
                            },
                            ticks: {
                                color: '#6B7280',
                                font: {
                                    size: 12
                                },
                                callback: function(value) {
                                    return value.toFixed(1) + '°C'
                                }
                            },
                            min: Math.min(...data.map(d => d.value)) - 0.2,
                            max: Math.max(...data.map(d => d.value)) + 0.2
                        },
                        x: {
                            grid: {
                                color: '#F3F4F6',
                                lineWidth: 1
                            },
                            ticks: {
                                color: '#6B7280',
                                font: {
                                    size: 12,
                                    weight: '500'
                                }
                            }
                        }
                    }
                }
            })
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy()
            }
        }
    }, [data, type])

    // Limpiar al desmontar componente
    useEffect(() => {
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy()
            }
        }
    }, [])

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

            {/* Estadísticas adicionales */}
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