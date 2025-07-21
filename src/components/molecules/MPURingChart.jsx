import React from 'react';

export const MPURingChart = ({ data, isConnected = false }) => {
    // Datos del MPU6050 con valores por defecto seguros
    const { aceleracion, giroscopio } = data || {
        aceleracion: { x: 0, y: 0, z: 0 },
        giroscopio: { x: 0, y: 0, z: 0 }
    };

    // Función segura para obtener valores
    const getSafeValue = (value, fallback = 0) => {
        return (value !== null && value !== undefined && !isNaN(value)) ? Number(value) : fallback;
    };

    // Obtener valores seguros
    const accel = {
        x: getSafeValue(aceleracion?.x, 0),
        y: getSafeValue(aceleracion?.y, 0),
        z: getSafeValue(aceleracion?.z, 0)
    };

    const gyro = {
        x: getSafeValue(giroscopio?.x, 0),
        y: getSafeValue(giroscopio?.y, 0),
        z: getSafeValue(giroscopio?.z, 0)
    };

    // Calcular magnitudes
    const accelMagnitude = Math.sqrt(
        Math.pow(accel.x, 2) + Math.pow(accel.y, 2) + Math.pow(accel.z, 2)
    );

    const gyroMagnitude = Math.sqrt(
        Math.pow(gyro.x, 2) + Math.pow(gyro.y, 2) + Math.pow(gyro.z, 2)
    );

    // Colores para cada eje (igual que las imágenes)
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

        const gyroActivity = gyroMagnitude > 100 ? 'Lenta' :
            gyroMagnitude > 50 ? 'Moderada' : 'Rápida';

        const vibrationDetected = Math.abs(accel.z - 1) > 0.5;

        const orientation = Math.abs(accel.z) > Math.abs(accel.x) &&
        Math.abs(accel.z) > Math.abs(accel.y) ? 'Horizontal' : 'Vertical';

        return {
            actividad: accelActivity,
            rotacion: gyroActivity,
            vibracion: vibrationDetected ? 'Detectada' : 'Normal',
            orientacion: orientation
        };
    };

    const movementState = getMovementState();

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    Sensor MPU6050 - Movimiento y Orientación
                </h3>
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`}></div>
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
                        {/* Anillos concéntricos de fondo */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-60 h-60 rounded-full border-8 border-gray-200"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-48 h-48 rounded-full border-8 border-gray-200"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-36 h-36 rounded-full border-8 border-gray-200"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full border-8 border-gray-200"></div>
                        </div>

                        {/* Puntos de datos sobre los anillos */}
                        {/* X - Anillo exterior */}
                        <div
                            className="absolute w-4 h-4 rounded-full"
                            style={{
                                backgroundColor: colors.x,
                                top: '50%',
                                left: '50%',
                                transform: `translate(-50%, -50%) translate(${Math.cos(0) * 120}px, ${Math.sin(0) * 120}px)`
                            }}
                        ></div>

                        {/* Y - Anillo medio-exterior */}
                        <div
                            className="absolute w-4 h-4 rounded-full"
                            style={{
                                backgroundColor: colors.y,
                                top: '50%',
                                left: '50%',
                                transform: `translate(-50%, -50%) translate(${Math.cos(Math.PI/2) * 96}px, ${Math.sin(Math.PI/2) * 96}px)`
                            }}
                        ></div>

                        {/* Z - Anillo medio-interior */}
                        <div
                            className="absolute w-4 h-4 rounded-full"
                            style={{
                                backgroundColor: colors.z,
                                top: '50%',
                                left: '50%',
                                transform: `translate(-50%, -50%) translate(${Math.cos(Math.PI) * 72}px, ${Math.sin(Math.PI) * 72}px)`
                            }}
                        ></div>

                        {/* Magnitud - Anillo interior */}
                        <div
                            className="absolute w-4 h-4 rounded-full"
                            style={{
                                backgroundColor: colors.magnitude,
                                top: '50%',
                                left: '50%',
                                transform: `translate(-50%, -50%) translate(${Math.cos(3*Math.PI/2) * 48}px, ${Math.sin(3*Math.PI/2) * 48}px)`
                            }}
                        ></div>

                        {/* Texto central */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full w-16 h-16 border-2 border-gray-300">
                            <span className="text-lg font-bold text-gray-800">
                                {accelMagnitude.toFixed(2)}g
                            </span>
                            <span className="text-xs text-gray-600">
                                Magnitud Total
                            </span>
                        </div>
                    </div>

                    {/* Leyenda */}
                    <div className="mt-4 flex justify-center space-x-4 text-sm">
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                            <span>X: {accel.x.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                            <span>Y: {accel.y.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
                            <span>Z: {accel.z.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Gráfica de Anillos Concéntricos - Giroscopio */}
                <div className="text-center">
                    <h4 className="text-md font-medium text-gray-700 mb-3">Giroscopio (°/s)</h4>
                    <div className="relative mx-auto flex items-center justify-center" style={{ width: '300px', height: '300px' }}>
                        {/* Anillos concéntricos de fondo */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-60 h-60 rounded-full border-8 border-gray-200"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-48 h-48 rounded-full border-8 border-gray-200"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-36 h-36 rounded-full border-8 border-gray-200"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full border-8 border-gray-200"></div>
                        </div>

                        {/* Puntos de datos sobre los anillos */}
                        {/* X - Anillo exterior */}
                        <div
                            className="absolute w-4 h-4 rounded-full"
                            style={{
                                backgroundColor: colors.x,
                                top: '50%',
                                left: '50%',
                                transform: `translate(-50%, -50%) translate(${Math.cos(Math.PI/4) * 120}px, ${Math.sin(Math.PI/4) * 120}px)`
                            }}
                        ></div>

                        {/* Y - Anillo medio-exterior */}
                        <div
                            className="absolute w-4 h-4 rounded-full"
                            style={{
                                backgroundColor: colors.y,
                                top: '50%',
                                left: '50%',
                                transform: `translate(-50%, -50%) translate(${Math.cos(3*Math.PI/4) * 96}px, ${Math.sin(3*Math.PI/4) * 96}px)`
                            }}
                        ></div>

                        {/* Z - Anillo medio-interior */}
                        <div
                            className="absolute w-4 h-4 rounded-full"
                            style={{
                                backgroundColor: colors.z,
                                top: '50%',
                                left: '50%',
                                transform: `translate(-50%, -50%) translate(${Math.cos(5*Math.PI/4) * 72}px, ${Math.sin(5*Math.PI/4) * 72}px)`
                            }}
                        ></div>

                        {/* Magnitud - Anillo interior */}
                        <div
                            className="absolute w-4 h-4 rounded-full"
                            style={{
                                backgroundColor: colors.magnitude,
                                top: '50%',
                                left: '50%',
                                transform: `translate(-50%, -50%) translate(${Math.cos(7*Math.PI/4) * 48}px, ${Math.sin(7*Math.PI/4) * 48}px)`
                            }}
                        ></div>

                        {/* Texto central */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full w-16 h-16 border-2 border-gray-300">
                            <span className="text-lg font-bold text-gray-800">
                                {gyroMagnitude.toFixed(0)}°/s
                            </span>
                            <span className="text-xs text-gray-600">
                                Velocidad Angular
                            </span>
                        </div>
                    </div>

                    {/* Leyenda */}
                    <div className="mt-4 flex justify-center space-x-4 text-sm">
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                            <span>X: {gyro.x.toFixed(0)}°/s</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                            <span>Y: {gyro.y.toFixed(0)}°/s</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
                            <span>Z: {gyro.z.toFixed(0)}°/s</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estado del Movimiento */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-700 mb-3">Estado del Movimiento</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex flex-col">
                        <span className="text-gray-600 mb-1">Actividad:</span>
                        <span className={`font-medium px-2 py-1 rounded text-center ${
                            movementState.actividad === 'Alta' ? 'text-red-600 bg-red-100' :
                                movementState.actividad === 'Media' ? 'text-yellow-600 bg-yellow-100' :
                                    'text-green-600 bg-green-100'
                        }`}>
                            {movementState.actividad}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-600 mb-1">Rotación:</span>
                        <span className={`font-medium px-2 py-1 rounded text-center ${
                            movementState.rotacion === 'Lenta' ? 'text-green-600 bg-green-100' :
                                movementState.rotacion === 'Moderada' ? 'text-yellow-600 bg-yellow-100' :
                                    'text-red-600 bg-red-100'
                        }`}>
                            {movementState.rotacion}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-600 mb-1">Vibración:</span>
                        <span className={`font-medium px-2 py-1 rounded text-center ${
                            movementState.vibracion === 'Detectada' ? 'text-orange-600 bg-orange-100' :
                                'text-green-600 bg-green-100'
                        }`}>
                            {movementState.vibracion}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-600 mb-1">Orientación:</span>
                        <span className="font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded text-center">
                            {movementState.orientacion}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};