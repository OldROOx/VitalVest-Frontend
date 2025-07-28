// src/pages/Configuration.jsx - ACTUALIZADO PARA SUDORACIÓN
import { useState } from 'react'
import { Button } from '../components/atoms/Button'
import { FormField } from '../components/molecules/FormField'
import { SensorPanel } from '../components/organisms/SensorPanel'
import { useApi } from '../hooks/useApi'
import { useWebSocket } from '../hooks/useWebSocket'
import { Badge } from '../components/atoms/Badge'
import { Icon } from '../components/atoms/Icon'

export default function Configuration() {
    const [userSelection, setUserSelection] = useState('')
    const [connectionMode, setConnectionMode] = useState('online')

    const {
        isConnected: apiConnected,
        currentValues,
        users,
        startPolling,
        stopPolling,
    } = useApi({
        autoStart: true,
        pollingInterval: 3000
    });

    const {
        isConnected: wsConnected,
        sensorData: wsSensorData,
        reconnect: wsReconnect,
        getConnectionStats
    } = useWebSocket();

    // Configuración de sensores basada en datos reales - ACTUALIZADO PARA SUDORACIÓN
    const sensors = [
        {
            id: 1,
            name: 'Sensor BME280 (Ambiente)',
            status: (wsSensorData?.temperatura !== null || currentValues?.temperatura_ambiente !== null) ? 'Activo' : 'Inactivo',
            lastReading: (wsSensorData?.temperatura || currentValues?.temperatura_ambiente) ?
                `${(wsSensorData?.temperatura || currentValues?.temperatura_ambiente)?.toFixed(1)}°C, ${(wsSensorData?.humedad || currentValues?.humedad_relativa)?.toFixed(1) || '--'}%` :
                'Sin datos',
            icon: 'thermometer'
        },
        {
            id: 2,
            name: 'Sensor GSR (Sudoración)', // CAMBIADO: Hidratación → Sudoración
            status: (wsSensorData?.porcentaje !== null || currentValues?.porcentaje !== null) ? 'Activo' : 'Inactivo', // CAMBIADO: conductancia → porcentaje
            lastReading: (wsSensorData?.porcentaje || currentValues?.porcentaje) ?
                `${(wsSensorData?.porcentaje || currentValues?.porcentaje)?.toFixed(1)}% - ${wsSensorData?.estado_sudoracion || currentValues?.estado_sudoracion || 'Estado desconocido'}` : // CAMBIADO
                'Sin datos',
            icon: 'droplet'
        },
        {
            id: 3,
            name: 'Sensor MLX90614 (Corporal)',
            status: (wsSensorData?.temperatura_objeto !== null || currentValues?.temperatura_corporal !== null) ? 'Activo' : 'Inactivo',
            lastReading: (wsSensorData?.temperatura_objeto || currentValues?.temperatura_corporal) ?
                `${(wsSensorData?.temperatura_objeto || currentValues?.temperatura_corporal)?.toFixed(1)}°C` :
                'Sin datos',
            icon: 'heart'
        },
        {
            id: 4,
            name: 'Sensor MPU6050 (Pasos)',
            status: (wsSensorData?.pasos !== null || currentValues?.pasos !== null) ? 'Activo' : 'Inactivo',
            lastReading: (wsSensorData?.pasos !== null || currentValues?.pasos !== null) ?
                `${wsSensorData?.pasos || currentValues?.pasos || 0} pasos` :
                'Sin datos',
            icon: 'activity'
        }
    ]

    const handleAssignUser = () => {
        if (userSelection) {
            alert(`Usuario ${userSelection} asignado al chaleco`)
        }
    }

    const handleToggleConnection = (mode) => {
        setConnectionMode(mode)
        if (mode === 'online') {
            startPolling(3000)
        } else {
            stopPolling()
        }
        alert(`Modo ${mode === 'online' ? 'Online' : 'Offline'} activado`)
    }

    const handleWebSocketReconnect = () => {
        wsReconnect()
        alert('Intentando reconectar WebSocket...')
    }

    // Verificar si hay datos válidos
    const hasValidApiData = currentValues && Object.keys(currentValues).some(key => currentValues[key] !== null);
    const hasValidWsData = wsSensorData && Object.keys(wsSensorData).some(key => wsSensorData[key] !== null);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Configuración del Chaleco</h1>
                <p className="text-sm text-gray-500">Gestión de usuarios, sensores y conectividad</p>
            </div>

            {/* Estado de Conexiones */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    <Icon name="activity" size={20} className="inline mr-2" />
                    Estado de Conexiones
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* API Status */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${apiConnected ? 'bg-green-500' : 'bg-red-500'} ${apiConnected ? 'animate-pulse' : ''}`}></div>
                            <div>
                                <h4 className="font-medium text-gray-900">
                                    API VitalVest - {apiConnected ? 'Conectada' : 'Desconectada'}
                                </h4>
                                <p className="text-sm text-gray-500">
                                    Endpoint: vivaltest-back.namixcode.cc • {apiConnected ? 'Obteniendo datos' : 'Sin conexión'}
                                </p>
                            </div>
                        </div>
                        <Badge variant={apiConnected ? 'success' : 'danger'} size="sm">
                            {apiConnected ? 'Online' : 'Offline'}
                        </Badge>
                    </div>

                    {/* WebSocket Status */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'} ${wsConnected ? 'animate-pulse' : ''}`}></div>
                            <div>
                                <h4 className="font-medium text-gray-900">
                                    WebSocket - {wsConnected ? 'Conectado' : 'Desconectado'}
                                </h4>
                                <p className="text-sm text-gray-500">
                                    Endpoint: 100.28.244.240:3000 • {wsConnected ? 'Tiempo real' : 'Sin conexión'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Badge variant={wsConnected ? 'success' : 'danger'} size="sm">
                                {wsConnected ? 'Online' : 'Offline'}
                            </Badge>
                            {!wsConnected && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleWebSocketReconnect}
                                >
                                    Reconectar
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* User Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    <Icon name="user" size={20} className="inline mr-2" />
                    Selección de Usuario
                </h3>
                <p className="text-sm text-gray-600 mb-4">Asociar chaleco con usuario activo de la base de datos</p>

                <div className="flex items-center space-x-4">
                    <div className="flex-1">
                        <FormField label="Usuario Activo">
                            <select
                                value={userSelection}
                                onChange={(e) => setUserSelection(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Seleccionar usuario</option>
                                {users && users.length > 0 ? (
                                    users.map((user, index) => (
                                        <option key={index} value={user.UserName || user.username || `Usuario ${index + 1}`}>
                                            {user.UserName || user.username || `Usuario ${index + 1}`}
                                            {user.Id && ` (ID: ${user.Id})`}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>No hay usuarios disponibles</option>
                                )}
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

                {users && users.length > 0 ? (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800 text-sm">
                            📊 Se encontraron {users.length} usuarios en la base de datos
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 text-sm">
                            ⚠️ No se pudieron cargar los usuarios. Verifica la conexión con la API.
                        </p>
                    </div>
                )}
            </div>

            {/* Connection Mode */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    <Icon name="wifi" size={20} className="inline mr-2" />
                    Modo de Operación
                </h3>
                <p className="text-sm text-gray-600 mb-4">Configurar modo de funcionamiento del sistema</p>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                            <Icon name="wifi" size={20} className="text-green-600" />
                            <div>
                                <h4 className="font-medium text-gray-900">Modo Online</h4>
                                <p className="text-sm text-gray-500">Conexión continua con API y WebSocket</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Badge variant={connectionMode === 'online' ? 'success' : 'default'} size="sm">
                                {connectionMode === 'online' ? 'Activo' : 'Inactivo'}
                            </Badge>
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
                                <p className="text-sm text-gray-500">Solo almacenamiento local, sin conexión</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Badge variant={connectionMode === 'offline' ? 'warning' : 'default'} size="sm">
                                {connectionMode === 'offline' ? 'Activo' : 'Inactivo'}
                            </Badge>
                            <button
                                onClick={() => handleToggleConnection('offline')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    connectionMode === 'offline' ? 'bg-yellow-600' : 'bg-gray-200'
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

                    <div className={`border rounded-lg p-4 ${
                        connectionMode === 'online' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                    }`}>
                        <div className="flex items-start space-x-2">
                            <Icon name="alerts" size={16} className={`mt-0.5 ${
                                connectionMode === 'online' ? 'text-green-600' : 'text-yellow-600'
                            }`} />
                            <div>
                                <p className={`text-sm font-medium ${
                                    connectionMode === 'online' ? 'text-green-800' : 'text-yellow-800'
                                }`}>
                                    Modo actual: {connectionMode === 'online' ? 'Online' : 'Offline'}
                                </p>
                                <p className={`text-xs mt-1 ${
                                    connectionMode === 'online' ? 'text-green-700' : 'text-yellow-700'
                                }`}>
                                    {connectionMode === 'online'
                                        ? 'Los datos se obtienen de la API REST y WebSocket en tiempo real'
                                        : 'Modo sin conexión activo. Los datos no se actualizarán automáticamente.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sensor Status */}
            <SensorPanel sensors={sensors} />

            {/* Real-time Sensor Data Preview - ACTUALIZADO PARA SUDORACIÓN */}
            {(hasValidApiData || hasValidWsData) && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Vista Previa de Datos en Tiempo Real
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Fuente: {wsConnected ? 'WebSocket (tiempo real)' : apiConnected ? 'API REST' : 'Sin conexión'}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* BME280 */}
                        {((wsSensorData?.temperatura !== null || wsSensorData?.humedad !== null) ||
                            (currentValues?.temperatura_ambiente !== null || currentValues?.humedad_relativa !== null)) && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-900">BME280 (Ambiente)</h4>
                                <div className="space-y-1 mt-2">
                                    <p className="text-sm text-blue-700">
                                        Temp: {(wsSensorData?.temperatura || currentValues?.temperatura_ambiente)?.toFixed(1) || '--'}°C
                                    </p>
                                    <p className="text-sm text-blue-700">
                                        Humedad: {(wsSensorData?.humedad || currentValues?.humedad_relativa)?.toFixed(1) || '--'}%
                                    </p>
                                    <p className="text-sm text-blue-700">
                                        Presión: {(wsSensorData?.presion || currentValues?.presion)?.toFixed(0) || '--'} hPa
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* GSR - ACTUALIZADO PARA SUDORACIÓN */}
                        {((wsSensorData?.porcentaje !== null || wsSensorData?.estado_sudoracion) ||
                            (currentValues?.porcentaje !== null || currentValues?.estado_sudoracion)) && (
                            <div className="bg-green-50 p-4 rounded-lg">
                                <h4 className="font-medium text-green-900">GSR (Sudoración)</h4>
                                <div className="space-y-1 mt-2">
                                    <p className="text-sm text-green-700">
                                        Porcentaje: {(wsSensorData?.porcentaje || currentValues?.porcentaje)?.toFixed(1) || '--'}%
                                    </p>
                                    <p className="text-sm text-green-700">
                                        Estado: {wsSensorData?.estado_sudoracion || currentValues?.estado_sudoracion || '--'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* MLX90614 */}
                        {((wsSensorData?.temperatura_objeto !== null) || (currentValues?.temperatura_corporal !== null)) && (
                            <div className="bg-red-50 p-4 rounded-lg">
                                <h4 className="font-medium text-red-900">MLX90614 (Corporal)</h4>
                                <div className="space-y-1 mt-2">
                                    <p className="text-sm text-red-700">
                                        Temp Corporal: {(wsSensorData?.temperatura_objeto || currentValues?.temperatura_corporal)?.toFixed(1) || '--'}°C
                                    </p>
                                    <p className="text-sm text-red-700">
                                        Temp Ambiente: {(wsSensorData?.temperatura_ambiente || currentValues?.temperatura_ambiente_mlx)?.toFixed(1) || '--'}°C
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* MPU6050 */}
                        {((wsSensorData?.pasos !== null) || (currentValues?.pasos !== null)) && (
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <h4 className="font-medium text-purple-900">MPU6050 (Actividad)</h4>
                                <div className="space-y-1 mt-2">
                                    <p className="text-sm text-purple-700">
                                        Pasos: {wsSensorData?.pasos || currentValues?.pasos || '--'}
                                    </p>
                                    <p className="text-sm text-purple-700">
                                        Fecha: {currentValues?.fecha_actividad || 'Tiempo real'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Configuration Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    <Icon name="config" size={20} className="inline mr-2" />
                    Configuración Avanzada
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium text-gray-700 mb-2">Frecuencia de Muestreo</h4>
                        <FormField label="Intervalo de lectura (segundos)">
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => {
                                    const interval = parseInt(e.target.value) * 1000;
                                    stopPolling();
                                    startPolling(interval);
                                }}
                            >
                                <option value="1">1 segundo</option>
                                <option value="2">2 segundos</option>
                                <option value="3" defaultValue>3 segundos</option>
                                <option value="5">5 segundos</option>
                                <option value="10">10 segundos</option>
                            </select>
                        </FormField>
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-700 mb-2">Alertas</h4>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input type="checkbox" className="mr-2" defaultChecked />
                                <span className="text-sm">Alertas de temperatura</span>
                            </label>
                            <label className="flex items-center">
                                <input type="checkbox" className="mr-2" defaultChecked />
                                <span className="text-sm">Alertas de sudoración</span> {/* CAMBIADO: hidratación → sudoración */}
                            </label>
                            <label className="flex items-center">
                                <input type="checkbox" className="mr-2" />
                                <span className="text-sm">Alertas de inactividad</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estadísticas de conexión */}
            {wsConnected && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Estadísticas de WebSocket
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                            <p className="text-lg font-semibold text-green-600">
                                {getConnectionStats().reconnectAttempts}
                            </p>
                            <p className="text-xs text-green-800">Intentos de reconexión</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <p className="text-lg font-semibold text-blue-600">
                                {getConnectionStats().state}
                            </p>
                            <p className="text-xs text-blue-800">Estado de conexión</p>
                        </div>
                        <div className="text-center p-3 bg-indigo-50 rounded-lg">
                            <p className="text-lg font-semibold text-indigo-600">
                                {getConnectionStats().url.split('//')[1]}
                            </p>
                            <p className="text-xs text-indigo-800">Servidor</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}