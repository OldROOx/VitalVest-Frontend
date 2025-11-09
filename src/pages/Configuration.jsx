// src/pages/Configuration.jsx - ACTUALIZADO PARA SUDORACIÓN
import { SensorPanel } from '../components/organisms/SensorPanel'
import { useApi } from '../hooks/useApi'
import { useWebSocket } from '../hooks/useWebSocket'
import { Badge } from '../components/atoms/Badge'
import { Icon } from '../components/atoms/Icon'
import { Button } from '../components/atoms/Button'

export default function Configuration() {
    // Se eliminan userSelection y connectionMode y sus hooks de estado (useState)

    const {
        isConnected: apiConnected,
        currentValues,
        // Se eliminan users, startPolling y stopPolling, ya que ya no se usan
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

    // Se elimina handleAssignUser y handleToggleConnection
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

            {/* Estado de Conexiones - SECCIÓN ELIMINADA */}

            {/* User Selection - SECCIÓN ELIMINADA */}
            {/* Connection Mode - SECCIÓN ELIMINADA */}

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

            {/* Configuration Settings - SECCIÓN ELIMINADA */}

            {/* Estadísticas de conexión - ESTA SECCIÓN SE MANTIENE YA QUE UTILIZA EL MISMO HOOK DE WS QUE ESTÁ EN USO */}
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