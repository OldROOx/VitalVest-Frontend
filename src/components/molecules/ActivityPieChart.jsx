import React, { useEffect, useRef } from 'react';

export const ActivityPieChart = ({ data, className = '' }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // Procesar datos del MPU6050 para clasificar actividades
    const processActivityData = () => {
        if (!data?.aceleracion) {
            return [
                { label: 'Reposo', value: 50, color: '#3B82F6' },
                { label: 'Caminar', value: 20, color: '#E5E7EB' },
                { label: 'Ejercicio', value: 13, color: '#D1D5DB' },
                { label: 'Correr', value: 10, color: '#10B981' },
                { label: 'Otros', value: 7, color: '#34D399' }
            ];
        }

        const { aceleracion, giroscopio } = data;

        // Calcular magnitud de aceleración
        const accelMagnitude = Math.sqrt(
            Math.pow(aceleracion.x || 0, 2) +
            Math.pow(aceleracion.y || 0, 2) +
            Math.pow(aceleracion.z || 0, 2)
        );

        // Calcular magnitud de giroscopio
        const gyroMagnitude = Math.sqrt(
            Math.pow(giroscopio.x || 0, 2) +
            Math.pow(giroscopio.y || 0, 2) +
            Math.pow(giroscopio.z || 0, 2)
        );

        // Clasificar actividad basada en los rangos de movimiento
        let reposo = 50, caminar = 20, ejercicio = 13, correr = 10, otros = 7;

        if (accelMagnitude > 3) {
            correr = 40;
            ejercicio = 25;
            caminar = 20;
            reposo = 10;
            otros = 5;
        } else if (accelMagnitude > 2) {
            ejercicio = 35;
            caminar = 30;
            correr = 15;
            reposo = 15;
            otros = 5;
        } else if (accelMagnitude > 1.5) {
            caminar = 40;
            ejercicio = 25;
            reposo = 25;
            correr = 5;
            otros = 5;
        } else if (accelMagnitude > 1.1) {
            caminar = 30;
            reposo = 50;
            ejercicio = 15;
            otros = 5;
        }

        return [
            { label: 'Reposo', value: reposo, color: '#3B82F6' },
            { label: 'Caminar', value: caminar, color: '#E5E7EB' },
            { label: 'Ejercicio', value: ejercicio, color: '#D1D5DB' },
            { label: 'Correr', value: correr, color: '#10B981' },
            { label: 'Otros', value: otros, color: '#34D399' }
        ];
    };

    useEffect(() => {
        const loadChart = async () => {
            if (!chartRef.current) return;

            const { Chart, registerables } = await import('chart.js');
            Chart.register(...registerables);

            // Destruir gráfico previo
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            const activityData = processActivityData();

            chartInstance.current = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: activityData.map(item => item.label),
                    datasets: [{
                        data: activityData.map(item => item.value),
                        backgroundColor: activityData.map(item => item.color),
                        borderWidth: 3,
                        borderColor: '#FFFFFF',
                        hoverBorderWidth: 4,
                        hoverBorderColor: '#374151'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%', // Crear el efecto de dona
                    plugins: {
                        legend: {
                            display: false // Ocultamos la leyenda por defecto
                        },
                        tooltip: {
                            backgroundColor: '#1F2937',
                            titleColor: '#F9FAFB',
                            bodyColor: '#F9FAFB',
                            borderColor: '#374151',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: true,
                            callbacks: {
                                label: (context) => `${context.label}: ${context.parsed}%`
                            }
                        }
                    },
                    animation: {
                        animateRotate: true,
                        duration: 1000,
                        easing: 'easeInOutQuart'
                    },
                    elements: {
                        arc: {
                            borderWidth: 3,
                            borderColor: '#FFFFFF'
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
    }, [data]);

    const activityData = processActivityData();
    const totalActivity = activityData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Distribución de Actividad Física
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de dona */}
                <div className="relative">
                    <div className="relative h-64 w-64 mx-auto">
                        <canvas ref={chartRef}></canvas>

                        {/* Texto central */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-gray-800">
                                {data?.aceleracion ?
                                    Math.sqrt(
                                        Math.pow(data.aceleracion.x || 0, 2) +
                                        Math.pow(data.aceleracion.y || 0, 2) +
                                        Math.pow(data.aceleracion.z || 0, 2)
                                    ).toFixed(1) + 'g'
                                    : '1.0g'
                                }
                            </span>
                            <span className="text-sm text-gray-600">Actividad</span>
                        </div>
                    </div>
                </div>

                {/* Leyenda y estadísticas */}
                <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Desglose de Actividades</h4>

                    <div className="space-y-3">
                        {activityData.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    ></div>
                                    <span className="text-sm text-gray-700">{item.label}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-900">
                                        {item.value}%
                                    </span>
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full"
                                            style={{
                                                width: `${item.value}%`,
                                                backgroundColor: item.color
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Resumen de actividad */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h5 className="font-medium text-gray-700 mb-2">Resumen del Día</h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Tiempo Activo:</span>
                                <p className="font-semibold text-blue-600">
                                    {100 - activityData[0].value}%
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-600">Tiempo en Reposo:</span>
                                <p className="font-semibold text-gray-600">
                                    {activityData[0].value}%
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-600">Actividad Intensa:</span>
                                <p className="font-semibold text-green-600">
                                    {activityData.find(item => item.label === 'Correr')?.value || 0}%
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-600">Meta Diaria:</span>
                                <p className="font-semibold text-blue-600">
                                    {Math.min(Math.round((100 - activityData[0].value) * 1.2), 100)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Información adicional */}
            <div className="mt-4 text-xs text-gray-500 text-center">
                <p>Datos basados en acelerómetro MPU6050 • Actualización en tiempo real</p>
            </div>
        </div>
    );
};