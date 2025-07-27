// src/components/molecules/GyroscopeRingChart.jsx - GRÁFICA DE ANILLOS CON ESTADÍSTICAS
import React, { useRef, useEffect, useState } from 'react';
import { Icon } from '../atoms/Icon';

export const GyroscopeRingChart = ({ data, isConnected = false }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [statsData, setStatsData] = useState(null);
    const [bmeStatsData, setBmeStatsData] = useState(null);
    const [mlxStatsData, setMlxStatsData] = useState(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [statsError, setStatsError] = useState(null);
    const [currentData, setCurrentData] = useState({
        x: 0,
        y: 0,
        z: 0
    });

    // Función segura para obtener valores
    const getSafeValue = (value, fallback = 0) => {
        return (value !== null && value !== undefined && !isNaN(value)) ? Number(value) : fallback;
    };

    // Obtener estadísticas de todos los sensores desde la API
    const fetchAllSensorStatistics = async () => {
        setIsLoadingStats(true);
        setStatsError(null);

        try {
            console.log('📊 Obteniendo estadísticas de todos los sensores...');

            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            // Llamadas paralelas a todas las APIs de estadísticas
            const [mpuResponse, bmeResponse, mlxResponse] = await Promise.allSettled([
                fetch('http://75.101.239.21:8000/mpu6050/estadisticas', { headers }),
                fetch('http://75.101.239.21:8000/bme280/estadisticas', { headers }),
                fetch('http://75.101.239.21:8000/mlx/estadisticas', { headers })
            ]);

            // Procesar MPU6050
            if (mpuResponse.status === 'fulfilled' && mpuResponse.value.ok) {
                const mpuResult = await mpuResponse.value.json();
                console.log('📈 Estadísticas MPU6050 recibidas:', mpuResult);
                setStatsData(mpuResult);
            } else {
                console.warn('⚠️ Error obteniendo estadísticas MPU6050');
            }

            // Procesar BME280
            if (bmeResponse.status === 'fulfilled' && bmeResponse.value.ok) {
                const bmeResult = await bmeResponse.value.json();
                console.log('🌡️ Estadísticas BME280 recibidas:', bmeResult);
                setBmeStatsData(bmeResult);
            } else {
                console.warn('⚠️ Error obteniendo estadísticas BME280');
            }

            // Procesar MLX90614
            if (mlxResponse.status === 'fulfilled' && mlxResponse.value.ok) {
                const mlxResult = await mlxResponse.value.json();
                console.log('🔥 Estadísticas MLX recibidas:', mlxResult);
                setMlxStatsData(mlxResult);
            } else {
                console.warn('⚠️ Error obteniendo estadísticas MLX');
            }

        } catch (error) {
            console.error('❌ Error obteniendo estadísticas de sensores:', error);
            setStatsError(error.message);
        } finally {
            setIsLoadingStats(false);
        }
    };

    // Actualizar datos en tiempo real del WebSocket/API
    useEffect(() => {
        if (!data || !data.giroscopio) return;

        const newData = {
            x: getSafeValue(data.giroscopio.x, 0),
            y: getSafeValue(data.giroscopio.y, 0),
            z: getSafeValue(data.giroscopio.z, 0)
        };

        setCurrentData(newData);
    }, [data]);

    // Cargar estadísticas al montar el componente y cada 30 segundos
    useEffect(() => {
        fetchAllSensorStatistics();

        const interval = setInterval(fetchAllSensorStatistics, 30000);

        return () => clearInterval(interval);
    }, []);

    // Crear gráfica de anillos con Chart.js
    useEffect(() => {
        const loadChart = async () => {
            // Solo proceder si tenemos datos y un canvas válido
            if (!chartRef.current || !statsData || !statsData.distribucion_actividad) {
                console.log('⏳ Esperando datos para crear gráfica...');
                return;
            }

            try {
                // Destruir gráfico previo ANTES de importar Chart.js
                if (chartInstance.current) {
                    console.log('🗑️ Destruyendo gráfica anterior...');
                    chartInstance.current.destroy();
                    chartInstance.current = null;
                }

                console.log('📊 Creando nueva gráfica con datos:', statsData.distribucion_actividad);

                const { Chart, registerables } = await import('chart.js');
                Chart.register(...registerables);

                const ctx = chartRef.current.getContext('2d');

                // Procesar datos estadísticos para la gráfica de anillos
                const processStatisticsData = () => {
                    // Usar la distribución de actividad real de la API
                    const distribucionActividad = statsData.distribucion_actividad || {};

                    // Crear array con todas las categorías (incluyendo las que son 0)
                    const allCategories = [
                        { label: 'Sedentario', value: distribucionActividad.sedentario || 0, color: '#6B7280' }, // Gris para sedentario
                        { label: 'Ligero', value: distribucionActividad.ligero || 0, color: '#10B981' }, // Verde claro
                        { label: 'Activo', value: distribucionActividad.activo || 0, color: '#3B82F6' }, // Azul
                        // Agregar "Muy Activo" solo si existe en los datos
                        ...(distribucionActividad.muy_activo ? [{ label: 'Muy Activo', value: distribucionActividad.muy_activo, color: '#EF4444' }] : [])
                    ];

                    // Mostrar todas las categorías, incluso las de valor 0 para completar el 100%
                    return allCategories;
                };

                const activityData = processStatisticsData();
                console.log('📈 Datos procesados para gráfica:', activityData);

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
                            hoverBorderColor: '#374151',
                            cutout: '60%' // Crear el efecto de anillo/donut
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
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
                                    label: (context) => {
                                        const label = context.label || '';
                                        const value = context.parsed;
                                        return `${label}: ${value.toFixed(1)}%`;
                                    }
                                }
                            }
                        },
                        animation: {
                            animateRotate: true,
                            duration: 800, // Reducir duración de animación
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

                console.log('✅ Gráfica creada exitosamente');

            } catch (error) {
                console.error('❌ Error creando gráfica:', error);
            }
        };

        // Usar un pequeño delay para asegurar que el DOM esté listo
        const timeoutId = setTimeout(loadChart, 100);

        return () => {
            clearTimeout(timeoutId);
            if (chartInstance.current) {
                console.log('🧹 Limpiando gráfica en cleanup...');
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, [statsData]); // Solo dependemos de statsData

    // Calcular magnitud total para el centro
    const magnitude = Math.sqrt(
        Math.pow(currentData.x, 2) +
        Math.pow(currentData.y, 2) +
        Math.pow(currentData.z, 2)
    );

    // Procesar datos para la leyenda
    const getLegendData = () => {
        if (!statsData || !statsData.distribucion_actividad) return [];

        const distribucionActividad = statsData.distribucion_actividad;

        // Mostrar todas las categorías en la leyenda, incluso las de 0%
        return [
            { label: 'Sedentario', value: distribucionActividad.sedentario || 0, color: '#6B7280' },
            { label: 'Ligero', value: distribucionActividad.ligero || 0, color: '#10B981' },
            { label: 'Activo', value: distribucionActividad.activo || 0, color: '#3B82F6' },
            // Solo agregar "Muy Activo" si existe en los datos
            ...(distribucionActividad.muy_activo ? [{ label: 'Muy Activo', value: distribucionActividad.muy_activo, color: '#EF4444' }] : [])
        ]; // Quitar el filtro para mostrar todas las categorías
    };

    const legendData = getLegendData();

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    Distribución de Actividad - MPU6050
                </h3>
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                        isConnected ? 'bg-green-500' : 'bg-red-500'
                    } ${isConnected ? 'animate-pulse' : ''}`}></div>
                    <span className="text-sm text-gray-600">
                        {isConnected ? 'Activo' : 'Sin Conexión'}
                    </span>
                    {isLoadingStats && (
                        <span className="text-xs text-blue-600">Cargando stats...</span>
                    )}
                </div>
            </div>

            {/* Error de estadísticas */}
            {statsError && (
                <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-800 text-sm">⚠️ Error cargando estadísticas: {statsError}</p>
                    <button
                        onClick={fetchAllSensorStatistics}
                        className="text-xs text-red-600 hover:text-red-800 mt-1 underline"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {/* Loading state */}
            {isLoadingStats && (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando estadísticas...</p>
                    </div>
                </div>
            )}

            {/* Gráfica de anillos */}
            {statsData && !isLoadingStats && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfico de dona */}
                    <div className="relative">
                        <div className="relative h-64 w-64 mx-auto">
                            <canvas
                                ref={chartRef}
                                key={`chart-${statsData.media_pasos || Date.now()}`}
                                style={{ maxHeight: '256px', maxWidth: '256px' }}
                            ></canvas>

                            {/* Texto central con estadísticas */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-bold text-gray-800">
                                    {statsData.media_pasos?.toFixed(0) || '0'}
                                </span>
                                <span className="text-sm text-gray-600 text-center">
                                    Media<br/>Pasos
                                </span>
                                {magnitude > 0 && (
                                    <span className="text-xs text-blue-600 mt-1">
                                        {magnitude.toFixed(0)}°/s
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Leyenda y estadísticas */}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        <h4 className="font-medium text-gray-700">Desglose de Actividades</h4>

                        <div className="space-y-3">
                            {legendData.map((item, index) => (
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
                                            {item.value.toFixed(1)}%
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

                        {/* Estadísticas MPU6050 */}
                        {statsData && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h5 className="font-medium text-blue-800 mb-2 flex items-center">
                                    <Icon name="activity" size={16} className="mr-2" />
                                    MPU6050 - Actividad y Pasos
                                </h5>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-blue-700">Media pasos:</span>
                                        <span className="font-semibold text-blue-800">
                                            {statsData.media_pasos?.toFixed(2) || '--'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-700">Desviación pasos:</span>
                                        <span className="font-semibold text-blue-800">
                                            {statsData.desviacion_pasos?.toFixed(2) || '--'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-700">Prob. pasos altos:</span>
                                        <span className="font-semibold text-blue-800">
                                            {statsData.prob_pasos_altos?.toFixed(2) || '--'}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-700">Prob. binomial:</span>
                                        <span className="font-semibold text-blue-800">
                                            {statsData.prob_binomial_altos?.toFixed(4) || '--'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-700">Distancia total:</span>
                                        <span className="font-semibold text-blue-800">
                                            {statsData.distancia_total_m?.toFixed(1) || '--'} m
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-700">Pasos faltantes 2km:</span>
                                        <span className="font-semibold text-orange-600">
                                            {statsData.pasos_faltantes_para_2km?.toLocaleString() || '--'}
                                        </span>
                                    </div>
                                </div>

                                {/* Total que suma 100% */}
                                <div className="mt-3 pt-2 border-t border-blue-300">
                                    <div className="flex justify-between items-center">
                                        <span className="text-blue-700 font-medium">Total distribución:</span>
                                        <span className="font-bold text-blue-800">
                                            {legendData.reduce((sum, item) => sum + item.value, 0).toFixed(2)}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-blue-600 mt-1">
                                        ✓ Representa el 100% completo del anillo
                                    </p>
                                </div>

                                {/* Meta de 2km */}
                                {statsData.pasos_faltantes_para_2km !== undefined && (
                                    <div className="mt-3 p-2 bg-blue-100 rounded-lg border border-blue-300">
                                        <div className="flex items-center justify-between">
                                            <span className="text-blue-700 text-xs font-medium">🎯 Meta 2km:</span>
                                            <span className="text-blue-800 text-xs font-semibold">
                                                {statsData.pasos_faltantes_para_2km === 0 ?
                                                    '¡Meta alcanzada! 🎉' :
                                                    `Faltan ${statsData.pasos_faltantes_para_2km.toLocaleString()} pasos`
                                                }
                                            </span>
                                        </div>
                                        {statsData.distancia_total_m && (
                                            <div className="mt-1">
                                                <div className="w-full bg-blue-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${Math.min((statsData.distancia_total_m / 2000) * 100, 100)}%`
                                                        }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between text-xs text-blue-600 mt-1">
                                                    <span>0m</span>
                                                    <span>{statsData.distancia_total_m.toFixed(0)}m / 2000m</span>
                                                    <span>2km</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Estadísticas BME280 */}
                        {bmeStatsData && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <h5 className="font-medium text-green-800 mb-2 flex items-center">
                                    <Icon name="thermometer" size={16} className="mr-2" />
                                    BME280 - Ambiente
                                </h5>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-green-700">Media temperatura:</span>
                                        <span className="font-semibold text-green-800">
                                            {bmeStatsData.media_temperatura?.toFixed(2) || '--'}°C
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-700">Desv. temperatura:</span>
                                        <span className="font-semibold text-green-800">
                                            {bmeStatsData.desviacion_temperatura?.toFixed(2) || '--'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-700">Prob. temp alta:</span>
                                        <span className="font-semibold text-green-800">
                                            {bmeStatsData.prob_temperatura_alta?.toFixed(2) || '--'}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-700">Prob. binomial temp:</span>
                                        <span className="font-semibold text-green-800">
                                            {bmeStatsData.prob_binomial_temperatura?.toFixed(4) || '--'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-700">Media presión:</span>
                                        <span className="font-semibold text-green-800">
                                            {bmeStatsData.media_presion?.toFixed(2) || '--'} hPa
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-700">Desv. presión:</span>
                                        <span className="font-semibold text-green-800">
                                            {bmeStatsData.desviacion_presion?.toFixed(2) || '--'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-700">Prob. presión alta:</span>
                                        <span className="font-semibold text-green-800">
                                            {bmeStatsData.prob_presion_alta?.toFixed(2) || '--'}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-700">Media humedad:</span>
                                        <span className="font-semibold text-green-800">
                                            {bmeStatsData.media_humedad?.toFixed(2) || '--'}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-700">Desv. humedad:</span>
                                        <span className="font-semibold text-green-800">
                                            {bmeStatsData.desviacion_humedad?.toFixed(2) || '--'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-700">Prob. humedad alta:</span>
                                        <span className="font-semibold text-green-800">
                                            {bmeStatsData.prob_humedad_alta?.toFixed(2) || '--'}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-700">Prob. binomial humedad:</span>
                                        <span className="font-semibold text-green-800">
                                            {bmeStatsData.prob_binomial_humedad?.toFixed(4) || '--'}
                                        </span>
                                    </div>
                                </div>

                                {/* Sección de Disconfort Térmico */}
                                <div className="mt-3 pt-2 border-t border-green-300">
                                    <h6 className="font-medium text-green-800 mb-2 text-sm">🌡️ Disconfort Térmico</h6>
                                    <p className="text-xs text-green-700 mb-3 italic">
                                        Calcular disconfort térmico (índice simplificado) para dar una idea de si se siente calor incómodo.
                                    </p>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-green-700 text-sm">Disconfort térmico promedio:</span>
                                            <span className="font-semibold text-green-800">
                                                {bmeStatsData.disconfort_termico_promedio?.toFixed(2) || '--'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-green-700 text-sm">% Sensación incómoda:</span>
                                            <span className="font-semibold text-orange-600">
                                                {bmeStatsData.porcentaje_sensacion_incomoda?.toFixed(1) || '--'}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Visualización del disconfort */}
                                    <div className="mt-3">
                                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                            <div className="h-full flex">
                                                {/* Sensación cómoda */}
                                                <div
                                                    className="bg-green-500 h-full transition-all duration-500"
                                                    style={{ width: `${100 - (bmeStatsData.porcentaje_sensacion_incomoda || 0)}%` }}
                                                ></div>
                                                {/* Sensación incómoda */}
                                                <div
                                                    className="bg-orange-500 h-full transition-all duration-500"
                                                    style={{ width: `${bmeStatsData.porcentaje_sensacion_incomoda || 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-xs text-green-600 mt-1">
                                            <span>Cómodo</span>
                                            <span>Incómodo</span>
                                        </div>
                                    </div>

                                    {/* Interpretación del estado actual */}
                                    <div className="mt-3 p-2 rounded-lg border">
                                        {bmeStatsData.porcentaje_sensacion_incomoda >= 80 ? (
                                            <div className="bg-orange-100 border-orange-200">
                                                <p className="text-xs text-orange-800 text-center">
                                                    🌡️ <strong>Alto Disconfort:</strong> {bmeStatsData.porcentaje_sensacion_incomoda?.toFixed(1)}% del tiempo con sensación incómoda
                                                </p>
                                            </div>
                                        ) : bmeStatsData.porcentaje_sensacion_incomoda >= 50 ? (
                                            <div className="bg-yellow-100 border-yellow-200">
                                                <p className="text-xs text-yellow-800 text-center">
                                                    ⚠️ <strong>Disconfort Moderado:</strong> {bmeStatsData.porcentaje_sensacion_incomoda?.toFixed(1)}% del tiempo con sensación incómoda
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="bg-green-100 border-green-200">
                                                <p className="text-xs text-green-800 text-center">
                                                    ✅ <strong>Ambiente Confortable:</strong> Solo {bmeStatsData.porcentaje_sensacion_incomoda?.toFixed(1)}% del tiempo con disconfort
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Información técnica */}
                                    <div className="mt-2 p-2 bg-green-100 rounded-lg border border-green-200">
                                        <p className="text-xs text-green-700 font-medium mb-1">📊 Detalles del Cálculo:</p>
                                        <div className="text-xs text-green-600 space-y-1">
                                            <div className="flex justify-between">
                                                <span>Índice promedio:</span>
                                                <span className="font-mono">{bmeStatsData.disconfort_termico_promedio?.toFixed(2) || '--'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Temp. ambiente:</span>
                                                <span className="font-mono">{bmeStatsData.media_temperatura?.toFixed(1) || '--'}°C</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Humedad relativa:</span>
                                                <span className="font-mono">{bmeStatsData.media_humedad?.toFixed(0) || '--'}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Estadísticas MLX90614 */}
                        {mlxStatsData && (
                            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                <h5 className="font-medium text-red-800 mb-2 flex items-center">
                                    <Icon name="heart" size={16} className="mr-2" />
                                    MLX90614 - Temperatura Corporal
                                </h5>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-red-700">Media ambiente:</span>
                                        <span className="font-semibold text-red-800">
                                            {mlxStatsData.media_ambiente?.toFixed(2) || '--'}°C
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-red-700">Desv. ambiente:</span>
                                        <span className="font-semibold text-red-800">
                                            {mlxStatsData.desviacion_ambiente?.toFixed(2) || '--'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-red-700">Prob. alta ambiente:</span>
                                        <span className="font-semibold text-red-800">
                                            {mlxStatsData.prob_alta_ambiente?.toFixed(2) || '--'}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-red-700">Media objeto:</span>
                                        <span className="font-semibold text-red-800">
                                            {mlxStatsData.media_objeto?.toFixed(2) || '--'}°C
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-red-700">Desv. objeto:</span>
                                        <span className="font-semibold text-red-800">
                                            {mlxStatsData.desviacion_objeto?.toFixed(2) || '--'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-red-700">Prob. alta objeto:</span>
                                        <span className="font-semibold text-red-800">
                                            {mlxStatsData.prob_alta_objeto?.toFixed(2) || '--'}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-red-700">Prob. binomial ambiente:</span>
                                        <span className="font-semibold text-red-800">
                                            {mlxStatsData.prob_binomial_ambiente?.toFixed(4) || '--'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-red-700">Prob. binomial objeto:</span>
                                        <span className="font-semibold text-red-800">
                                            {mlxStatsData.prob_binomial_objeto?.toFixed(4) || '--'}
                                        </span>
                                    </div>
                                </div>

                                {/* Clasificación de Objetos por Temperatura */}
                                <div className="mt-3 pt-2 border-t border-red-300">
                                    <h6 className="font-medium text-red-800 mb-2 text-sm">🌡️ Clasificación de Objetos</h6>

                                    <div className="space-y-2">
                                        {/* Objetos Peligrosos */}
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                                                <span className="text-red-700 text-sm">Peligrosos (>42°C):</span>
                                            </div>
                                            <span className="font-semibold text-red-800">
                                                {mlxStatsData.porcentaje_objetos_peligrosos?.toFixed(1) || '--'}%
                                            </span>
                                        </div>

                                        {/* Objetos Fríos */}
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                <span className="text-red-700 text-sm">Fríos (&lt;20°C):</span>
                                            </div>
                                            <span className="font-semibold text-red-800">
                                                {mlxStatsData.porcentaje_objetos_frios?.toFixed(1) || '--'}%
                                            </span>
                                        </div>

                                        {/* Objetos Normales (calculado) */}
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                <span className="text-red-700 text-sm">Normales (20-42°C):</span>
                                            </div>
                                            <span className="font-semibold text-red-800">
                                                {(100 - (mlxStatsData.porcentaje_objetos_peligrosos || 0) - (mlxStatsData.porcentaje_objetos_frios || 0)).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Barra de clasificación visual */}
                                    <div className="mt-3">
                                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                            <div className="h-full flex">
                                                {/* Objetos Fríos */}
                                                <div
                                                    className="bg-blue-500 h-full transition-all duration-500"
                                                    style={{ width: `${mlxStatsData.porcentaje_objetos_frios || 0}%` }}
                                                ></div>
                                                {/* Objetos Normales */}
                                                <div
                                                    className="bg-green-500 h-full transition-all duration-500"
                                                    style={{ width: `${100 - (mlxStatsData.porcentaje_objetos_peligrosos || 0) - (mlxStatsData.porcentaje_objetos_frios || 0)}%` }}
                                                ></div>
                                                {/* Objetos Peligrosos */}
                                                <div
                                                    className="bg-red-600 h-full transition-all duration-500"
                                                    style={{ width: `${mlxStatsData.porcentaje_objetos_peligrosos || 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-xs text-red-600 mt-1">
                                            <span>Frío</span>
                                            <span>Normal</span>
                                            <span>Peligroso</span>
                                        </div>
                                    </div>

                                    {/* Información de umbrales */}
                                    <div className="mt-3 p-2 bg-red-100 rounded-lg border border-red-200">
                                        <p className="text-xs text-red-700 font-medium mb-1">⚠️ Umbrales de Clasificación:</p>
                                        <div className="text-xs text-red-600 space-y-1">
                                            <div className="flex justify-between">
                                                <span>🔵 Objetos Fríos:</span>
                                                <span className="font-mono">&lt; 20°C</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>🟢 Objetos Normales:</span>
                                                <span className="font-mono">20°C - 42°C</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>🔴 Objetos Peligrosos:</span>
                                                <span className="font-mono">&gt; 42°C</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Estado actual con tus datos */}
                                    {mlxStatsData.porcentaje_objetos_frios === 100 && (
                                        <div className="mt-2 p-2 bg-blue-100 rounded-lg border border-blue-200">
                                            <p className="text-xs text-blue-800 text-center">
                                                ❄️ <strong>Estado Actual:</strong> Todos los objetos detectados están por debajo de 20°C
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Estado de carga de estadísticas */}
                        {isLoadingStats && (
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span className="text-gray-600 text-sm">Cargando estadísticas...</span>
                                </div>
                            </div>
                        )}

                        {/* Mensaje si no hay estadísticas */}
                        {!statsData && !bmeStatsData && !mlxStatsData && !isLoadingStats && (
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <p className="text-yellow-800 text-sm">
                                    📊 No se han cargado estadísticas aún
                                </p>
                                <button
                                    onClick={fetchAllSensorStatistics}
                                    className="text-xs text-yellow-700 hover:text-yellow-900 mt-1 underline"
                                >
                                    Cargar estadísticas
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Datos en tiempo real del giroscopio */}
            {isConnected && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-800 mb-2">Datos en Tiempo Real - Giroscopio</h5>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                            <span className="text-blue-600">Eje X:</span>
                            <p className="font-mono font-semibold text-blue-800">{currentData.x.toFixed(1)}°/s</p>
                        </div>
                        <div className="text-center">
                            <span className="text-blue-600">Eje Y:</span>
                            <p className="font-mono font-semibold text-blue-800">{currentData.y.toFixed(1)}°/s</p>
                        </div>
                        <div className="text-center">
                            <span className="text-blue-600">Eje Z:</span>
                            <p className="font-mono font-semibold text-blue-800">{currentData.z.toFixed(1)}°/s</p>
                        </div>
                    </div>
                    <div className="mt-2 text-center">
                        <span className="text-blue-600 text-sm">Magnitud total:</span>
                        <span className="ml-2 font-semibold text-blue-800">{magnitude.toFixed(1)}°/s</span>
                    </div>
                </div>
            )}

            {/* Información adicional */}
            <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                    Sensor MPU6050 • Análisis estadístico de actividad • {statsData ? 'Estadísticas cargadas' : 'Cargando estadísticas...'}
                </p>
                {statsData && (
                    <p className="text-xs text-blue-600 mt-1">
                        📊 Última actualización: {new Date().toLocaleTimeString()}
                    </p>
                )}
            </div>
        </div>
    );
};