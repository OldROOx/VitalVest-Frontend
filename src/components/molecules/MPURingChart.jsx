import React, { useRef, useEffect, useState } from 'react';

export const MPURingChart = ({ data, isConnected = false }) => {
    const [currentData, setCurrentData] = useState({
        aceleracion: { x: 0, y: 0, z: 0 },
        giroscopio: { x: 0, y: 0, z: 0 }
    });
    const [isAnimating, setIsAnimating] = useState(false);
    const animationFrameRef = useRef(null);
    const lastUpdateRef = useRef(Date.now());

    // Función segura para obtener valores
    const getSafeValue = (value, fallback = 0) => {
        return (value !== null && value !== undefined && !isNaN(value)) ? Number(value) : fallback;
    };

    // Actualizar datos con animación suave
    useEffect(() => {
        if (!data) return;

        const newData = {
            aceleracion: {
                x: getSafeValue(data.aceleracion?.x, 0),
                y: getSafeValue(data.aceleracion?.y, 0),
                z: getSafeValue(data.aceleracion?.z, 0)
            },
            giroscopio: {
                x: getSafeValue(data.giroscopio?.x, 0),
                y: getSafeValue(data.giroscopio?.y, 0),
                z: getSafeValue(data.giroscopio?.z, 0)
            }
        };

        // Solo actualizar si los datos han cambiado significativamente
        const hasChanged =
            Math.abs(newData.aceleracion.x - currentData.aceleracion.x) > 0.01 ||
            Math.abs(newData.aceleracion.y - currentData.aceleracion.y) > 0.01 ||
            Math.abs(newData.aceleracion.z - currentData.aceleracion.z) > 0.01 ||
            Math.abs(newData.giroscopio.x - currentData.giroscopio.x) > 1 ||
            Math.abs(newData.giroscopio.y - currentData.giroscopio.y) > 1 ||
            Math.abs(newData.giroscopio.z - currentData.giroscopio.z) > 1;

        if (hasChanged) {
            // Limitar frecuencia de actualización para evitar animaciones excesivas
            const now = Date.now();
            if (now - lastUpdateRef.current > 200) { // Máximo 5 actualizaciones por segundo
                setCurrentData(newData);
                lastUpdateRef.current = now;
            }
        }
    }, [data]);

    // Calcular magnitudes con los datos actuales
    const accelMagnitude = Math.sqrt(
        Math.pow(currentData.aceleracion.x, 2) +
        Math.pow(currentData.aceleracion.y, 2) +
        Math.pow(currentData.aceleracion.z, 2)
    );

    const gyroMagnitude = Math.sqrt(
        Math.pow(currentData.giroscopio.x, 2) +
        Math.pow(currentData.giroscopio.y, 2) +
        Math.pow(currentData.giroscopio.z, 2)
    );

    // Colores para cada eje
    const colors = {
        x: '#3B82F6', // Azul
        y: '#10B981', // Verde
        z: '#F59E0B', // Amarillo/Naranja
        magnitude: '#8B5CF6' // Púrpura
    };

    // Determinar estado del movimiento
    const getMovementState = () => {
        const accelActivity = accelMagnitude > 2 ? 'Alta' :
            accelMagnitude > 1.2 ? 'Media' : 'Baja';

        const gyroActivity = gyroMagnitude > 100 ? 'Rápida' :
            gyroMagnitude > 50 ? 'Moderada' : 'Lenta';

        const vibrationDetected = Math.abs(currentData.aceleracion.z - 1) > 0.5;

        const orientation = Math.abs(currentData.aceleracion.z) > Math.abs(currentData.aceleracion.x) &&
        Math.abs(currentData.aceleracion.z) > Math.abs(currentData.aceleracion.y) ? 'Horizontal' : 'Vertical';

        return {
            actividad: accelActivity,
            rotacion: gyroActivity,
            vibracion: vibrationDetected ? 'Detectada' : 'Normal',
            orientacion: orientation
        };
    };

    const movementState = getMovementState();

    // Función para crear puntos animados suavemente
    const createAnimatedPoint = (angle, radius, color, value, label) => {
        // Escalar el punto basado en el valor (opcional, para indicar intensidad)
        const scale = Math.min(1 + Math.abs(value) * 0.1, 2);
        const pointSize = 4 * scale;

        return (
            <g key={`${label}-${angle}`}>
                {/* Punto principal con transición suave */}
                <circle
                    cx={150 + Math.cos(angle) * radius}
                    cy={150 + Math.sin(angle) * radius}
                    r={pointSize}
                    fill={color}
                    style={{
                        transition: 'all 0.3s ease-out',
                        filter: isConnected ? 'drop-shadow(0 0 4px rgba(0,0,0,0.3))' : 'none'
                    }}
                >
                    {/* Animación de pulsación sutil para datos activos */}
                    {isConnected && Math.abs(value) > 0.1 && (
                        <animate
                            attributeName="r"
                            values={`${pointSize};${pointSize * 1.2};${pointSize}`}
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    )}
                </circle>

                {/* Estela/trail para indicar movimiento */}
                {isConnected && Math.abs(value) > 0.5 && (
                    <circle
                        cx={150 + Math.cos(angle) * radius}
                        cy={150 + Math.sin(angle) * radius}
                        r={pointSize * 2}
                        fill={color}
                        opacity="0.2"
                        style={{
                            transition: 'all 0.5s ease-out'
                        }}
                    >
                        <animate
                            attributeName="opacity"
                            values="0.2;0.05;0.2"
                            dur="1.5s"
                            repeatCount="indefinite"
                        />
                    </circle>
                )}
            </g>
        );
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    Sensor MPU6050 - Movimiento y Orientación
                </h3>
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                        isConnected ? 'bg-green-500' : 'bg-red-500'
                    } ${isConnected ? 'animate-pulse' : ''}`}></div>
                    <span className="text-sm text-gray-600">
                        {isConnected ? 'Sensor Activo' : 'Sin Conexión'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gráfica de Anillos Concéntricos - Aceleración */}
                <div className="text-center">
                    <h4 className="text-md font-medium text-gray-700 mb-3">Aceleración (g)</h4>
                    <div className="relative mx-auto flex items-center justify-center" style={{ width: '300px', height: '300px' }}>
                        {/* SVG para gráfica suave */}
                        <svg width="300" height="300" className="absolute inset-0">
                            {/* Anillos concéntricos de fondo */}
                            <circle cx="150" cy="150" r="120" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                            <circle cx="150" cy="150" r="96" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                            <circle cx="150" cy="150" r="72" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                            <circle cx="150" cy="150" r="48" fill="none" stroke="#E5E7EB" strokeWidth="8" />

                            {/* Puntos de datos animados */}
                            {createAnimatedPoint(0, 120, colors.x, currentData.aceleracion.x, 'accel-x')}
                            {createAnimatedPoint(Math.PI/2, 96, colors.y, currentData.aceleracion.y, 'accel-y')}
                            {createAnimatedPoint(Math.PI, 72, colors.z, currentData.aceleracion.z, 'accel-z')}
                            {createAnimatedPoint(3*Math.PI/2, 48, colors.magnitude, accelMagnitude, 'accel-mag')}
                        </svg>

                        {/* Texto central con transición suave */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full w-16 h-16 border-2 border-gray-300"
                             style={{
                                 transition: 'all 0.3s ease-out',
                                 transform: `scale(${1 + (accelMagnitude * 0.05)})`
                             }}>
                            <span className="text-lg font-bold text-gray-800">
                                {accelMagnitude.toFixed(2)}g
                            </span>
                            <span className="text-xs text-gray-600">
                                Magnitud
                            </span>
                        </div>
                    </div>

                    {/* Leyenda con valores actualizados */}
                    <div className="mt-4 flex justify-center space-x-4 text-sm">
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                            <span>X: {currentData.aceleracion.x.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                            <span>Y: {currentData.aceleracion.y.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
                            <span>Z: {currentData.aceleracion.z.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Gráfica de Anillos Concéntricos - Giroscopio */}
                <div className="text-center">
                    <h4 className="text-md font-medium text-gray-700 mb-3">Giroscopio (°/s)</h4>
                    <div className="relative mx-auto flex items-center justify-center" style={{ width: '300px', height: '300px' }}>
                        {/* SVG para gráfica suave */}
                        <svg width="300" height="300" className="absolute inset-0">
                            {/* Anillos concéntricos de fondo */}
                            <circle cx="150" cy="150" r="120" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                            <circle cx="150" cy="150" r="96" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                            <circle cx="150" cy="150" r="72" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                            <circle cx="150" cy="150" r="48" fill="none" stroke="#E5E7EB" strokeWidth="8" />

                            {/* Puntos de datos animados */}
                            {createAnimatedPoint(Math.PI/4, 120, colors.x, currentData.giroscopio.x, 'gyro-x')}
                            {createAnimatedPoint(3*Math.PI/4, 96, colors.y, currentData.giroscopio.y, 'gyro-y')}
                            {createAnimatedPoint(5*Math.PI/4, 72, colors.z, currentData.giroscopio.z, 'gyro-z')}
                            {createAnimatedPoint(7*Math.PI/4, 48, colors.magnitude, gyroMagnitude, 'gyro-mag')}
                        </svg>

                        {/* Texto central con transición suave */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full w-16 h-16 border-2 border-gray-300"
                             style={{
                                 transition: 'all 0.3s ease-out',
                                 transform: `scale(${1 + (gyroMagnitude * 0.001)})`
                             }}>
                            <span className="text-lg font-bold text-gray-800">
                                {gyroMagnitude.toFixed(0)}°/s
                            </span>
                            <span className="text-xs text-gray-600">
                                Vel. Angular
                            </span>
                        </div>
                    </div>

                    {/* Leyenda con valores actualizados */}
                    <div className="mt-4 flex justify-center space-x-4 text-sm">
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                            <span>X: {currentData.giroscopio.x.toFixed(0)}°/s</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                            <span>Y: {currentData.giroscopio.y.toFixed(0)}°/s</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
                            <span>Z: {currentData.giroscopio.z.toFixed(0)}°/s</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estado del Movimiento con transiciones suaves */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg" style={{ transition: 'all 0.3s ease-out' }}>
                <h5 className="font-medium text-gray-700 mb-3">Estado del Movimiento</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex flex-col">
                        <span className="text-gray-600 mb-1">Actividad:</span>
                        <span className={`font-medium px-2 py-1 rounded text-center transition-colors duration-300 ${
                            movementState.actividad === 'Alta' ? 'text-red-600 bg-red-100' :
                                movementState.actividad === 'Media' ? 'text-yellow-600 bg-yellow-100' :
                                    'text-green-600 bg-green-100'
                        }`}>
                            {movementState.actividad}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-600 mb-1">Rotación:</span>
                        <span className={`font-medium px-2 py-1 rounded text-center transition-colors duration-300 ${
                            movementState.rotacion === 'Rápida' ? 'text-red-600 bg-red-100' :
                                movementState.rotacion === 'Moderada' ? 'text-yellow-600 bg-yellow-100' :
                                    'text-green-600 bg-green-100'
                        }`}>
                            {movementState.rotacion}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-600 mb-1">Vibración:</span>
                        <span className={`font-medium px-2 py-1 rounded text-center transition-colors duration-300 ${
                            movementState.vibracion === 'Detectada' ? 'text-orange-600 bg-orange-100' :
                                'text-green-600 bg-green-100'
                        }`}>
                            {movementState.vibracion}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-600 mb-1">Orientación:</span>
                        <span className="font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded text-center transition-colors duration-300">
                            {movementState.orientacion}
                        </span>
                    </div>
                </div>
            </div>

            {/* Información de actualización */}

        </div>
    );
};