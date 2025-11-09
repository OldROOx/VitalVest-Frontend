// src/components/molecules/GyroscopeRingChart.jsx - FIX MLX ESTADÍSTICAS
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

    // Obtener estadísticas de todos los sensores desde la API - FIX URL CORRECTA
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

            // FIX: URLs CORRECTAS según tu documentación
            const [mpuResponse, bmeResponse, mlxResponse] = await Promise.allSettled([
                fetch('http://75.101.239.21:8000/mpu6050/estadisticas', { headers }),
                fetch('http://75.101.239.21:8000/bme280/estadisticas', { headers }),
                fetch('http://75.101.239.21:8000/mlx/estadisticas', { headers }) // FIX: URL correcta
            ]);

            // Procesar MPU6050
            if (mpuResponse.status === 'fulfilled' && mpuResponse.value.ok) {
                const mpuResult = await mpuResponse.value.json();
                console.log('📈 Estadísticas MPU6050 recibidas:', mpuResult);
                setStatsData(mpuResult);
            } else {
                console.warn('⚠️ Error obteniendo estadísticas MPU6050:', mpuResponse.reason || 'Request failed');
                if (mpuResponse.value) {
                    console.log('Status MPU:', mpuResponse.value.status);
                }
            }

            // Procesar BME280
            if (bmeResponse.status === 'fulfilled' && bmeResponse.value.ok) {
                const bmeResult = await bmeResponse.value.json();
                console.log('🌡️ Estadísticas BME280 recibidas:', bmeResult);
                setBmeStatsData(bmeResult);
            } else {
                console.warn('⚠️ Error obteniendo estadísticas BME280:', bmeResponse.reason || 'Request failed');
                if (bmeResponse.value) {
                    console.log('Status BME:', bmeResponse.value.status);
                }
            }

            // Procesar MLX90614 - FIX CRÍTICO
            if (mlxResponse.status === 'fulfilled' && mlxResponse.value.ok) {
                const mlxResult = await mlxResponse.value.json();
                console.log('🔥 Estadísticas MLX recibidas RAW:', mlxResult);

                // FIX: Verificar estructura de datos real
                if (mlxResult && Object.keys(mlxResult).length > 0) {
                    setMlxStatsData(mlxResult);
                    console.log('✅ MLX Stats guardadas:', mlxResult);
                } else {
                    console.warn('⚠️ MLX resultado vacío:', mlxResult);
                }
            } else {
                console.warn('⚠️ Error obteniendo estadísticas MLX:', mlxResponse.reason || 'Request failed');
                if (mlxResponse.value) {
                    console.log('Status MLX:', mlxResponse.value.status);
                    const errorText = await mlxResponse.value.text().catch(() => 'No error text');
                    console.log('Error text MLX:', errorText);
                }
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
                    Distribución de Actividad
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
                                        <span className="text-green-700">Media humedad:</span>
                                        <span className="font-semibold text-green-800">
                                            {bmeStatsData.media_humedad?.toFixed(2) || '--'}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Estadísticas MLX90614 - FIX MOSTRAR DATOS REALES */}
                        {mlxStatsData && Object.keys(mlxStatsData).length > 0 && (
                            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                <h5 className="font-medium text-red-800 mb-2 flex items-center">
                                    <Icon name="heart" size={16} className="mr-2" />
                                    MLX90614 - Temperatura Corporal
                                </h5>

                                {/* DEBUG: Mostrar estructura real de datos */}


                                <div className="grid grid-cols-1 gap-2 text-sm">
                                    {/* FIX: Adaptar campos según lo que realmente devuelve la API */}
                                    {mlxStatsData.media_ambiente !== undefined && (
                                        <div className="flex justify-between">
                                            <span className="text-red-700">Media ambiente:</span>
                                            <span className="font-semibold text-red-800">
                                                {mlxStatsData.media_ambiente?.toFixed(2) || '--'}°C
                                            </span>
                                        </div>
                                    )}

                                    {mlxStatsData.media_objeto !== undefined && (
                                        <div className="flex justify-between">
                                            <span className="text-red-700">Media objeto:</span>
                                            <span className="font-semibold text-red-800">
                                                {mlxStatsData.media_objeto?.toFixed(2) || '--'}°C
                                            </span>
                                        </div>
                                    )}

                                    {mlxStatsData.desviacion_ambiente !== undefined && (
                                        <div className="flex justify-between">
                                            <span className="text-red-700">Desv. ambiente:</span>
                                            <span className="font-semibold text-red-800">
                                                {mlxStatsData.desviacion_ambiente?.toFixed(2) || '--'}
                                            </span>
                                        </div>
                                    )}

                                    {mlxStatsData.desviacion_objeto !== undefined && (
                                        <div className="flex justify-between">
                                            <span className="text-red-700">Desv. objeto:</span>
                                            <span className="font-semibold text-red-800">
                                                {mlxStatsData.desviacion_objeto?.toFixed(2) || '--'}
                                            </span>
                                        </div>
                                    )}

                                    {mlxStatsData.prob_alta_ambiente !== undefined && (
                                        <div className="flex justify-between">
                                            <span className="text-red-700">Prob. alta ambiente:</span>
                                            <span className="font-semibold text-red-800">
                                                {mlxStatsData.prob_alta_ambiente?.toFixed(2) || '--'}%
                                            </span>
                                        </div>
                                    )}

                                    {mlxStatsData.prob_alta_objeto !== undefined && (
                                        <div className="flex justify-between">
                                            <span className="text-red-700">Prob. alta objeto:</span>
                                            <span className="font-semibold text-red-800">
                                                {mlxStatsData.prob_alta_objeto?.toFixed(2) || '--'}%
                                            </span>
                                        </div>
                                    )}

                                    {mlxStatsData.prob_binomial_ambiente !== undefined && (
                                        <div className="flex justify-between">
                                            <span className="text-red-700">Prob. binomial ambiente:</span>
                                            <span className="font-semibold text-red-800">
                                                {mlxStatsData.prob_binomial_ambiente?.toFixed(4) || '--'}
                                            </span>
                                        </div>
                                    )}

                                    {mlxStatsData.prob_binomial_objeto !== undefined && (
                                        <div className="flex justify-between">
                                            <span className="text-red-700">Prob. binomial objeto:</span>
                                            <span className="font-semibold text-red-800">
                                                {mlxStatsData.prob_binomial_objeto?.toFixed(4) || '--'}
                                            </span>
                                        </div>
                                    )}

                                    {/* FIX: Cualquier otro campo que aparezca en la respuesta real */}
                                    {Object.keys(mlxStatsData).filter(key =>
                                        !['media_ambiente', 'media_objeto', 'desviacion_ambiente', 'desviacion_objeto',
                                            'prob_alta_ambiente', 'prob_alta_objeto', 'prob_binomial_ambiente', 'prob_binomial_objeto'].includes(key)
                                    ).map(key => (
                                        <div key={key} className="flex justify-between">
                                            <span className="text-red-700">{key.replace(/_/g, ' ')}:</span>
                                            <span className="font-semibold text-red-800">
                                                {typeof mlxStatsData[key] === 'number' ?
                                                    mlxStatsData[key].toFixed(2) :
                                                    mlxStatsData[key]?.toString() || '--'
                                                }
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Mostrar conteo de estadísticas disponibles */}
                                <div className="mt-3 pt-2 border-t border-red-300">
                                    <p className="text-xs text-red-600">
                                        📊 {Object.keys(mlxStatsData).length} estadísticas MLX disponibles
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Estado si no hay estadísticas MLX */}
                        {!mlxStatsData && !isLoadingStats && (
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-gray-600 text-sm">
                                    📊 No se han cargado estadísticas MLX aún
                                </p>
                                <button
                                    onClick={fetchAllSensorStatistics}
                                    className="text-xs text-gray-700 hover:text-gray-900 mt-1 underline"
                                >
                                    Cargar estadísticas MLX
                                </button>
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
        </div>
    );
};