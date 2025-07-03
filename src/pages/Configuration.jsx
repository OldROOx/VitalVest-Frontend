import { useState } from 'react'
import { Button } from '../components/atoms/Button'
import { FormField } from '../components/molecules/FormField'
import { SensorPanel } from '../components/organisms/SensorPanel'
import { Badge } from '../components/atoms/Badge'
import { Icon } from '../components/atoms/Icon'

export default function Configuration() {
    const [userSelection, setUserSelection] = useState('')
    const [connectionMode, setConnectionMode] = useState('offline')

    // Datos simulados de sensores
    const sensors = [
        {
            id: 1,
            name: 'Sensor GSR',
            status: 'Activo',
            lastReading: '68%',
            icon: 'droplet'
        },
        {
            id: 2,
            name: 'Sensor DHT22',
            status: 'Activo',
            lastReading: '24.5°C',
            icon: 'thermometer'
        },
        {
            id: 3,
            name: 'Acelerómetro MPU6050',
            status: 'Activo',
            lastReading: '1.2g',
            icon: 'activity'
        },
        {
            id: 4,
            name: 'Sensor Frecuencia Cardiaca',
            status: 'Inactivo',
            lastReading: 'N/A',
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
                                        ? 'Los datos se almacenan localmente en la Raspberry Pi'
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
                        <p className="text-sm text-gray-600">Tiempo Activo</p>
                        <p className="text-lg font-semibold text-gray-900">2d 14h 32m</p>
                    </div>
                </div>
            </div>
        </div>
    )
}