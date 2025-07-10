// src/pages/Configuration.jsx
import { useState } from 'react'
import { Button } from '../components/atoms/Button'
import { FormField } from '../components/molecules/FormField'
import { SensorPanel } from '../components/organisms/SensorPanel'
import { WebSocketTestButton } from '../components/molecules/WebSocketTestButton'
import { WebSocketIndicator } from '../components/molecules/WebSocketIndicator'
import { useWebSocket } from '../hooks/useWebSocket'
import { Badge } from '../components/atoms/Badge'
import { Icon } from '../components/atoms/Icon'

export default function Configuration() {
    const [userSelection, setUserSelection] = useState('')
    const [connectionMode, setConnectionMode] = useState('offline')
    const { isConnected, sensorData, reconnect } = useWebSocket()

    // Datos simulados de sensores con estado actual
    const sensors = [
        {
            id: 1,
            name: 'Sensor GSR',
            status: sensorData.GSR ? 'Activo' : 'Inactivo',
            lastReading: sensorData.GSR ?
                `${(sensorData.GSR.conductancia * 100).toFixed(1)}%` :
                'Sin datos',
            icon: 'droplet'
        },
        {
            id: 2,
            name: 'Sensor BME280',
            status: sensorData.BME ? 'Activo' : 'Inactivo',
            lastReading: sensorData.BME ?
                `${sensorData.BME.temperatura_ambiente.toFixed(1)}°C` :
                'Sin datos',
            icon: 'thermometer'
        },
        {
            id: 3,
            name: 'Acelerómetro MPU6050',
            status: sensorData.MPU ? 'Activo' : 'Inactivo',
            lastReading: sensorData.MPU ?
                `${sensorData.MPU.pasos} pasos` :
                'Sin datos',
            icon: 'activity'
        },
        {
            id: 4,
            name: 'Sensor MLX90614',
            status: sensorData.MLX ? 'Activo' : 'Inactivo',
            lastReading: sensorData.MLX ?
                `${sensorData.MLX.temperatura_corporal.toFixed(1)}°C` :
                'Sin datos',
            icon: 'heart'
        }
    ]

    const handleAssignUser = () => {
        if (userSelection) {
            alert(`Usuario ${userSelection} asignado al chaleco`)
        }
    }

    const handleToggleConnection = (mode) => {
        setConnectionMode(mode)
        alert(`Modo ${mode === 'online' ? 'Online' : 'Offline'} activado`)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Configuración del Chaleco</h1>
                <p className="text-sm text-gray-500">Gestión de usuarios, sensores y conectividad</p>
            </div>

            {/* WebSocket Status and Test */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    <Icon name="wifi" size={20} className="inline mr-2" />
                    Estado del WebSocket
                </h3>

                <div className="flex items-center justify-between mb-4">
                    <WebSocketIndicator
                        isConnected={isConnected}
                        onReconnect={reconnect}
                    />
                    <WebSocketTestButton />
                </div>

                {isConnected ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 text-sm">
                            ✅ WebSocket conectado correctamente. Los datos se actualizan en tiempo real.
                        </p>
                    </div>
                ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm">
                            ⚠️ WebSocket desconectado. Ejecutando en modo offline con datos simulados.
                        </p>
                    </div>
                )}
            </div>

            {/* User Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    <Icon name="user" size={20} className="inline mr-2" />
                    Selección de Usuario
                </h3>
                <p className="text-sm text-gray-600 mb-4">Asociar chaleco con usuario activo</p>

                <div className="flex items-center space-x-4">
                    <div className="flex-1">
                        <FormField label="Usuario Activo">
                            <select
                                value={userSelection}
                                onChange={(e) => setUserSelection(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Seleccionar usuario</option>
                                <option value="Juan Pérez">Juan Pérez</option>
                                <option value="María García">María García</option>
                                <option value="Carlos López">Carlos López</option>
                            </select>
                        </FormField>
                    </div>
                    <div className="flex items-end">
                        <Button
                            variant="primary"
                            onClick={handleAssignUser}
                            disabled={!userSelection}
                            className="px-6"
                        >
                            Asignar Usuario
                        </Button>
                    </div>
                </div>
            </div>

            {/* Connection Mode */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    <Icon name="wifi" size={20} className="inline mr-2" />
                    Modo de Conexión
                </h3>
                <p className="text-sm text-gray-600 mb-4">Configurar funcionamiento online u offline</p>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                            <Icon name="wifi" size={20} className="text-green-600" />
                            <div>
                                <h4 className="font-medium text-gray-900">Modo Online</h4>
                                <p className="text-sm text-gray-500">Sincronización automática con servidor</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                                {connectionMode === 'online' ? 'Activo' : 'Inactivo'}
                            </span>
                            <button
                                onClick={() => handleToggleConnection('online')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    connectionMode === 'online' ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        connectionMode === 'online' ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                            <Icon name="wifi" size={20} className="text-gray-400" />
                            <div>
                                <h4 className="font-medium text-gray-900">Modo Offline</h4>
                                <p className="text-sm text-gray-500">Almacenamiento local únicamente</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                                {connectionMode === 'offline' ? 'Activo' : 'Inactivo'}
                            </span>
                            <button
                                onClick={() => handleToggleConnection('offline')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    connectionMode === 'offline' ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        connectionMode === 'offline' ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                            <Icon name="alerts" size={16} className="text-yellow-600 mt-0.5" />
                            <div>
                                <p className="text-sm text-yellow-800">
                                    <strong>Modo actual: {connectionMode === 'online' ? 'Online' : 'Offline'}</strong>
                                </p>
                                <p className="text-xs text-yellow-700 mt-1">
                                    {connectionMode === 'online'
                                        ? 'Los datos se almacenan localmente en la Raspberry Pi y se sincronizan automáticamente'
                                        : 'Modo sin conexión activo. La sincronización no está disponible.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sensor Status */}
            <SensorPanel sensors={sensors} />

            {/* Real-time Sensor Data Preview */}
            {isConnected && Object.keys(sensorData).some(key => sensorData[key]) && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Vista Previa de Datos en Tiempo Real
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {sensorData.BME && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-900">BME280</h4>
                                <p className="text-sm text-blue-700">
                                    Temp: {sensorData.BME.temperatura_ambiente?.toFixed(1)}°C
                                </p>
                                <p className="text-sm text-blue-700">
                                    Humedad: {sensorData.BME.humedad_relativa?.toFixed(1)}%
                                </p>
                            </div>
                        )}

                        {sensorData.GSR && (
                            <div className="bg-green-50 p-4 rounded-lg">
                                <h4 className="font-medium text-green-900">GSR</h4>
                                <p className="text-sm text-green-700">
                                    Conductancia: {sensorData.GSR.conductancia?.toFixed(3)}
                                </p>
                                <p className="text-sm text-green-700">
                                    Estado: {sensorData.GSR.estado_hidratacion}
                                </p>
                            </div>
                        )}

                        {sensorData.MLX && (
                            <div className="bg-red-50 p-4 rounded-lg">
                                <h4 className="font-medium text-red-900">MLX90614</h4>
                                <p className="text-sm text-red-700">
                                    Temp. Corporal: {sensorData.MLX.temperatura_corporal?.toFixed(1)}°C
                                </p>
                            </div>
                        )}

                        {sensorData.MPU && (
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <h4 className="font-medium text-purple-900">MPU6050</h4>
                                <p className="text-sm text-purple-700">
                                    Pasos: {sensorData.MPU.pasos}
                                </p>
                                <p className="text-sm text-purple-700">
                                    Actividad: {sensorData.MPU.nivel_actividad}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* System Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Versión del Sistema</p>
                        <p className="text-lg font-semibold text-gray-900">v2.1.3</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Raspberry Pi</p>
                        <p className="text-lg font-semibold text-gray-900">Pi 4 Model B</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">WebSocket</p>
                        <Badge variant={isConnected ? 'success' : 'danger'}>
                            {isConnected ? 'Conectado' : 'Desconectado'}
                        </Badge>
                    </div>
                </div>
            </div>
        </div>
    )
}