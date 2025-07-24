// src/components/molecules/GyroscopeRingChart.jsx
import React, { useRef, useEffect, useState } from 'react';
import { Icon } from '../atoms/Icon';

export const GyroscopeRingChart = ({ data, isConnected = false }) => {
    const [currentData, setCurrentData] = useState({
        x: 0,
        y: 0,
        z: 0
    });
    const lastUpdateRef = useRef(Date.now());

    // Función segura para obtener valores
    const getSafeValue = (value, fallback = 0) => {
        return (value !== null && value !== undefined && !isNaN(value)) ? Number(value) : fallback;
    };

    // Actualizar datos con control de frecuencia
    useEffect(() => {
        if (!data || !data.giroscopio) return;

        const newData = {
            x: getSafeValue(data.giroscopio.x, 0),
            y: getSafeValue(data.giroscopio.y, 0),
            z: getSafeValue(data.giroscopio.z, 0)
        };

        // Solo actualizar si los datos han cambiado significativamente
        const hasChanged =
            Math.abs(newData.x - currentData.x) > 1 ||
            Math.abs(newData.y - currentData.y) > 1 ||
            Math.abs(newData.z - currentData.z) > 1;

        if (hasChanged) {
            // Limitar frecuencia de actualización
            const now = Date.now();
            if (now - lastUpdateRef.current > 200) {
                setCurrentData(newData);
                lastUpdateRef.current = now;
            }
        }
    }, [data]);

    // Calcular magnitud total
    const magnitude = Math.sqrt(
        Math.pow(currentData.x, 2) +
        Math.pow(currentData.y, 2) +
        Math.pow(currentData.z, 2)
    );

    // Colores para cada eje
    const colors = {
        x: '#3B82F6', // Azul
        y: '#10B981', // Verde
        z: '#F59E0B'  // Amarillo/Naranja
    };

    // Determinar estado del movimiento rotacional
    const getRotationState = () => {
        if (magnitude > 150) return { level: 'Muy Rápida', color: 'text-red-600 bg-red-100' };
        if (magnitude > 100) return { level: 'Rápida', color: 'text-orange-600 bg-orange-100' };
        if (magnitude > 50) return { level: 'Moderada', color: 'text-yellow-600 bg-yellow-100' };
        if (magnitude > 10) return { level: 'Lenta', color: 'text-blue-600 bg-blue-100' };
        return { level: 'Estática', color: 'text-green-600 bg-green-100' };
    };

    const rotationState = getRotationState();

    // Función para crear puntos animados en los anillos
    const createGyroPoint = (angle, radius, color, value, label) => {
        // Normalizar el valor para determinar el tamaño del punto
        const normalizedValue = Math.min(Math.abs(value) / 100, 2); // Máximo 2x el tamaño base
        const pointSize = 4 + (normalizedValue * 3);

        return (
            <g key={`${label}-${angle}`}>
                {/* Punto principal */}
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
                    {/* Animación de pulsación para valores altos */}
                    {isConnected && Math.abs(value) > 50 && (
                        <animate
                            attributeName="r"
                            values={`${pointSize};${pointSize * 1.3};${pointSize}`}
                            dur="1.5s"
                            repeatCount="indefinite"
                        />
                    )}
                </circle>

                {/* Estela para indicar rotación activa */}
                {isConnected && Math.abs(value) > 30 && (
                    <circle
                        cx={150 + Math.cos(angle) * radius}
                        cy={150 + Math.sin(angle) * radius}
                        r={pointSize * 2.5}
                        fill={color}
                        opacity="0.15"
                        style={{
                            transition: 'all 0.5s ease-out'
                        }}
                    >
                        <animate
                            attributeName="opacity"
                            values="0.15;0.05;0.15"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </circle>
                )}

                {/* Indicador direccional para rotación */}
                {Math.abs(value) > 20 && (
                    <path
                        d={`M ${150 + Math.cos(angle) * (radius - 15)} ${150 + Math.sin(angle) * (radius - 15)} 
                            L ${150 + Math.cos(angle) * (radius + 15)} ${150 + Math.sin(angle) * (radius + 15)}`}
                        stroke={color}
                        strokeWidth="2"
                        opacity="0.6"
                        style={{
                            transition: 'all 0.3s ease-out'
                        }}
                    />
                )}
            </g>
        );
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    Giroscopio - Velocidad Angular
                </h3>
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                        isConnected ? 'bg-green-500' : 'bg-red-500'
                    } ${isConnected ? 'animate-pulse' : ''}`}></div>
                    <span className="text-sm text-gray-600">
                        {isConnected ? 'Activo' : 'Sin Conexión'}
                    </span>
                </div>
            </div>

            <div className="flex flex-col items-center">
                {/* Gráfica de Anillos Concéntricos */}
                <div className="relative mx-auto flex items-center justify-center" style={{ width: '300px', height: '300px' }}>
                    <svg width="300" height="300" className="absolute inset-0">
                        {/* Anillos concéntricos de fondo */}
                        <circle cx="150" cy="150" r="120" fill="none" stroke="#E5E7EB" strokeWidth="8" opacity="0.3" />
                        <circle cx="150" cy="150" r="90" fill="none" stroke="#E5E7EB" strokeWidth="6" opacity="0.4" />
                        <circle cx="150" cy="150" r="60" fill="none" stroke="#E5E7EB" strokeWidth="4" opacity="0.5" />

                        {/* Etiquetas de los ejes */}
                        <text x="280" y="155" textAnchor="middle" className="text-xs fill-gray-600 font-medium">X</text>
                        <text x="155" y="25" textAnchor="middle" className="text-xs fill-gray-600 font-medium">Y</text>
                        <text x="25" y="155" textAnchor="middle" className="text-xs fill-gray-600 font-medium">Z</text>

                        {/* Puntos de datos animados para cada eje */}
                        {createGyroPoint(0, 120, colors.x, currentData.x, 'gyro-x')}           {/* Eje X - Derecha */}
                        {createGyroPoint(Math.PI/2, 90, colors.y, currentData.y, 'gyro-y')}    {/* Eje Y - Abajo */}
                        {createGyroPoint(Math.PI, 60, colors.z, currentData.z, 'gyro-z')}      {/* Eje Z - Izquierda */}

                        {/* Líneas de conexión desde el centro (opcional, para mostrar dirección) */}
                        {magnitude > 20 && (
                            <>
                                <line
                                    x1="150" y1="150"
                                    x2={150 + Math.cos(0) * (120 * Math.min(Math.abs(currentData.x) / 100, 1))}
                                    y2={150 + Math.sin(0) * (120 * Math.min(Math.abs(currentData.x) / 100, 1))}
                                    stroke={colors.x}
                                    strokeWidth="2"
                                    opacity="0.4"
                                />
                                <line
                                    x1="150" y1="150"
                                    x2={150 + Math.cos(Math.PI/2) * (90 * Math.min(Math.abs(currentData.y) / 100, 1))}
                                    y2={150 + Math.sin(Math.PI/2) * (90 * Math.min(Math.abs(currentData.y) / 100, 1))}
                                    stroke={colors.y}
                                    strokeWidth="2"
                                    opacity="0.4"
                                />
                                <line
                                    x1="150" y1="150"
                                    x2={150 + Math.cos(Math.PI) * (60 * Math.min(Math.abs(currentData.z) / 100, 1))}
                                    y2={150 + Math.sin(Math.PI) * (60 * Math.min(Math.abs(currentData.z) / 100, 1))}
                                    stroke={colors.z}
                                    strokeWidth="2"
                                    opacity="0.4"
                                />
                            </>
                        )}
                    </svg>

                    {/* Texto central con la magnitud total */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full w-20 h-20 border-2 border-gray-300"
                         style={{
                             transition: 'all 0.3s ease-out',
                             transform: `scale(${1 + (magnitude * 0.002)})` // Escala sutil basada en magnitud
                         }}>
                        <span className="text-lg font-bold text-gray-800">
                            {magnitude.toFixed(0)}
                        </span>
                        <span className="text-xs text-gray-600">
                            °/s
                        </span>
                    </div>
                </div>

                {/* Leyenda con valores en tiempo real */}
                <div className="mt-4 flex justify-center space-x-6 text-sm">
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                        <span className="font-medium">X:</span>
                        <span className="ml-1 font-mono">{currentData.x.toFixed(1)}°/s</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="font-medium">Y:</span>
                        <span className="ml-1 font-mono">{currentData.y.toFixed(1)}°/s</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                        <span className="font-medium">Z:</span>
                        <span className="ml-1 font-mono">{currentData.z.toFixed(1)}°/s</span>
                    </div>
                </div>

                {/* Estado de la rotación */}
                <div className="mt-6 w-full max-w-sm">
                    <div className="text-center mb-3">
                        <h4 className="font-medium text-gray-700">Estado Rotacional</h4>
                    </div>

                    <div className="flex flex-col space-y-3">
                        {/* Indicador de nivel de rotación */}
                        <div className={`p-3 rounded-lg text-center transition-colors duration-300 ${rotationState.color}`}>
                            <span className="font-medium">
                                {rotationState.level}
                            </span>
                        </div>

                        {/* Barra de magnitud */}
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                                style={{
                                    width: `${Math.min((magnitude / 200) * 100, 100)}%` // Máximo 200°/s = 100%
                                }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                            <span>0°/s</span>
                            <span>Magnitud: {magnitude.toFixed(1)}°/s</span>
                            <span>200°/s</span>
                        </div>
                    </div>
                </div>

                {/* Información adicional */}
                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                        Sensor MPU6050 • Velocidad angular en 3 ejes • Actualización en tiempo real
                    </p>
                    {isConnected && (
                        <p className="text-xs text-green-600 mt-1">
                            ✓ Recibiendo datos del WebSocket
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};