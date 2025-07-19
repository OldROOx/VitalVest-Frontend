import React from 'react';

export const MPURingChart = ({ data }) => {
    // Datos del MPU6050
    const { aceleracion, giroscopio } = data || {
        aceleracion: { x: 0, y: 0, z: 0 },
        giroscopio: { x: 0, y: 0, z: 0 }
    };

    // Calcular magnitudes
    const accelMagnitude = Math.sqrt(
        Math.pow(aceleracion.x || 0, 2) +
        Math.pow(aceleracion.y || 0, 2) +
        Math.pow(aceleracion.z || 0, 2)
    );

    const gyroMagnitude = Math.sqrt(
        Math.pow(giroscopio.x || 0, 2) +
        Math.pow(giroscopio.y || 0, 2) +
        Math.pow(giroscopio.z || 0, 2)
    );

    // Normalizar valores para los anillos (0-100)
    const normalizeAccel = (value) => Math.min((Math.abs(value) / 4) * 100, 100);
    const normalizeGyro = (value) => Math.min((Math.abs(value) / 500) * 100, 100);

    // Función para crear el path SVG del anillo
    const createRingPath = (radius, percentage) => {
        const angle = (percentage / 100) * 360;
        const radians = (angle * Math.PI) / 180;
        const x = 150 + radius * Math.sin(radians);
        const y = 150 - radius * Math.cos(radians);
        const largeArc = angle > 180 ? 1 : 0;

        return `M 150 ${150 - radius} A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y}`;
    };

    // Colores para cada eje
    const colors = {
        x: '#3B82F6', // Azul
        y: '#10B981', // Verde
        z: '#F59E0B', // Amarillo
        magnitude: '#8B5CF6' // Púrpura
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sensor MPU6050 - Movimiento y Orientación
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfica de Anillos - Aceleración */}
                <div className="text-center">
                    <h4 className="text-md font-medium text-gray-700 mb-3">Aceleración (g)</h4>
                    <div className="relative">
                        <svg width="300" height="300" className="mx-auto">
                            {/* Anillos de fondo */}
                            <circle cx="150" cy="150" r="120" fill="none" stroke="#E5E7EB" strokeWidth="20" />
                            <circle cx="150" cy="150" r="90" fill="none" stroke="#E5E7EB" strokeWidth="20" />
                            <circle cx="150" cy="150" r="60" fill="none" stroke="#E5E7EB" strokeWidth="20" />
                            <circle cx="150" cy="150" r="30" fill="none" stroke="#E5E7EB" strokeWidth="20" />

                            {/* Anillos de datos */}
                            <path
                                d={createRingPath(120, normalizeAccel(aceleracion.x))}
                                fill="none"
                                stroke={colors.x}
                                strokeWidth="20"
                                strokeLinecap="round"
                            />
                            <path
                                d={createRingPath(90, normalizeAccel(aceleracion.y))}
                                fill="none"
                                stroke={colors.y}
                                strokeWidth="20"
                                strokeLinecap="round"
                            />
                            <path
                                d={createRingPath(60, normalizeAccel(aceleracion.z))}
                                fill="none"
                                stroke={colors.z}
                                strokeWidth="20"
                                strokeLinecap="round"
                            />
                            <path
                                d={createRingPath(30, (accelMagnitude / 4) * 100)}
                                fill="none"
                                stroke={colors.magnitude}
                                strokeWidth="20"
                                strokeLinecap="round"
                            />

                            {/* Texto central */}
                            <text x="150" y="145" textAnchor="middle" className="text-2xl font-bold fill-gray-800">
                                {accelMagnitude.toFixed(2)}g
                            </text>
                            <text x="150" y="165" textAnchor="middle" className="text-sm fill-gray-600">
                                Magnitud Total
                            </text>
                        </svg>
                    </div>

                    {/* Leyenda */}
                    <div className="mt-4 flex justify-center space-x-4 text-sm">
                        <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full bg-blue-500 mr-1`}></div>
                            <span>X: {aceleracion.x?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full bg-green-500 mr-1`}></div>
                            <span>Y: {aceleracion.y?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full bg-yellow-500 mr-1`}></div>
                            <span>Z: {aceleracion.z?.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>
                </div>

                {/* Gráfica de Anillos - Giroscopio */}
                <div className="text-center">
                    <h4 className="text-md font-medium text-gray-700 mb-3">Giroscopio (°/s)</h4>
                    <div className="relative">
                        <svg width="300" height="300" className="mx-auto">
                            {/* Anillos de fondo */}
                            <circle cx="150" cy="150" r="120" fill="none" stroke="#E5E7EB" strokeWidth="20" />
                            <circle cx="150" cy="150" r="90" fill="none" stroke="#E5E7EB" strokeWidth="20" />
                            <circle cx="150" cy="150" r="60" fill="none" stroke="#E5E7EB" strokeWidth="20" />
                            <circle cx="150" cy="150" r="30" fill="none" stroke="#E5E7EB" strokeWidth="20" />

                            {/* Anillos de datos */}
                            <path
                                d={createRingPath(120, normalizeGyro(giroscopio.x))}
                                fill="none"
                                stroke={colors.x}
                                strokeWidth="20"
                                strokeLinecap="round"
                            />
                            <path
                                d={createRingPath(90, normalizeGyro(giroscopio.y))}
                                fill="none"
                                stroke={colors.y}
                                strokeWidth="20"
                                strokeLinecap="round"
                            />
                            <path
                                d={createRingPath(60, normalizeGyro(giroscopio.z))}
                                fill="none"
                                stroke={colors.z}
                                strokeWidth="20"
                                strokeLinecap="round"
                            />
                            <path
                                d={createRingPath(30, (gyroMagnitude / 500) * 100)}
                                fill="none"
                                stroke={colors.magnitude}
                                strokeWidth="20"
                                strokeLinecap="round"
                            />

                            {/* Texto central */}
                            <text x="150" y="145" textAnchor="middle" className="text-2xl font-bold fill-gray-800">
                                {gyroMagnitude.toFixed(0)}°/s
                            </text>
                            <text x="150" y="165" textAnchor="middle" className="text-sm fill-gray-600">
                                Velocidad Angular
                            </text>
                        </svg>
                    </div>

                    {/* Leyenda */}
                    <div className="mt-4 flex justify-center space-x-4 text-sm">
                        <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full bg-blue-500 mr-1`}></div>
                            <span>X: {giroscopio.x?.toFixed(0) || '0'}°/s</span>
                        </div>
                        <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full bg-green-500 mr-1`}></div>
                            <span>Y: {giroscopio.y?.toFixed(0) || '0'}°/s</span>
                        </div>
                        <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full bg-yellow-500 mr-1`}></div>
                            <span>Z: {giroscopio.z?.toFixed(0) || '0'}°/s</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Información adicional */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-700 mb-2">Estado del Movimiento</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Actividad:</span>
                        <span className={`ml-2 font-medium ${
                            accelMagnitude > 2 ? 'text-red-600' :
                                accelMagnitude > 1.2 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
              {accelMagnitude > 2 ? 'Alta' : accelMagnitude > 1.2 ? 'Media' : 'Baja'}
            </span>
                    </div>
                    <div>
                        <span className="text-gray-600">Rotación:</span>
                        <span className={`ml-2 font-medium ${
                            gyroMagnitude > 100 ? 'text-red-600' :
                                gyroMagnitude > 50 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
              {gyroMagnitude > 100 ? 'Rápida' : gyroMagnitude > 50 ? 'Moderada' : 'Lenta'}
            </span>
                    </div>
                    <div>
                        <span className="text-gray-600">Vibración:</span>
                        <span className="ml-2 font-medium">
              {Math.abs(aceleracion.z - 1) > 0.5 ? 'Detectada' : 'Normal'}
            </span>
                    </div>
                    <div>
                        <span className="text-gray-600">Orientación:</span>
                        <span className="ml-2 font-medium">
              {Math.abs(aceleracion.z) > Math.abs(aceleracion.x) && Math.abs(aceleracion.z) > Math.abs(aceleracion.y)
                  ? 'Vertical' : 'Horizontal'}
            </span>
                    </div>
                </div>
            </div>
        </div>
    );
};