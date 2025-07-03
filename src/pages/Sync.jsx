import { useState } from 'react'
import { Button } from '../components/atoms/Button'
import { Badge } from '../components/atoms/Badge'
import { Icon } from '../components/atoms/Icon'

export default function Sync() {
    const [isSyncing, setIsSyncing] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState('online')

    // Datos simulados
    const syncStats = {
        pendingRecords: 1247,
        lastSync: '2024-01-15 08:30:00',
        systemStatus: 'Funcionando'
    }

    const syncHistory = [
        {
            id: 1,
            date: '2024-01-15 08:30',
            records: 892,
            duration: '2m 15s',
            status: 'Exitosa'
        },
        {
            id: 2,
            date: '2024-01-14 20:15',
            records: 1156,
            duration: '3m 42s',
            status: 'Exitosa'
        },
        {
            id: 3,
            date: '2024-01-14 12:00',
            records: 0,
            duration: '0s',
            status: 'Fallida'
        },
        {
            id: 4,
            date: '2024-01-13 16:45',
            records: 743,
            duration: '1m 58s',
            status: 'Exitosa'
        }
    ]

    const storageInfo = {
        used: '2.4 GB',
        available: '4.6 GB',
        total: '32 GB'
    }

    const handleSync = () => {
        setIsSyncing(true)
        // Simulación de sincronización
        setTimeout(() => {
            setIsSyncing(false)
            alert('Sincronización completada exitosamente')
        }, 3000)
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Exitosa':
                return <Badge variant="success">Exitosa</Badge>
            case 'Fallida':
                return <Badge variant="danger">Fallida</Badge>
            default:
                return <Badge variant="default">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Carga y Sincronización</h1>
                <p className="text-sm text-gray-500">Estado de conexión y sincronización de datos</p>
            </div>

            {/* Connection Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    <Icon name="wifi" size={20} className="inline mr-2" />
                    Estado de Conexión
                </h3>

                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                            <p className="font-medium text-green-800">Conectado</p>
                            <p className="text-sm text-green-600">Sistema conectado a internet - Sincronización disponible</p>
                        </div>
                    </div>
                    <Badge variant="success">Online</Badge>
                </div>
            </div>

            {/* Sync Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                    <div className="flex items-center justify-center mb-2">
                        <Icon name="sync" size={24} className="text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{syncStats.pendingRecords}</p>
                    <p className="text-sm text-gray-600">Registros Pendientes</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                    <div className="flex items-center justify-center mb-2">
                        <Icon name="activity" size={24} className="text-green-600" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">{syncStats.lastSync}</p>
                    <p className="text-sm text-gray-600">Última Sincronización</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                    <div className="flex items-center justify-center mb-2">
                        <Icon name="heart" size={24} className="text-green-600" />
                    </div>
                    <p className="text-lg font-bold text-green-800">{syncStats.systemStatus}</p>
                    <p className="text-sm text-gray-600">Estado del Sistema</p>
                </div>
            </div>

            {/* Manual Sync */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Control de Sincronización</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Sincronizar datos almacenados localmente
                </p>

                <div className="flex items-center space-x-4">
                    <p className="text-sm text-gray-600">
                        {syncStats.pendingRecords} registros esperando sincronización
                    </p>
                    <Button
                        variant="primary"
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="flex items-center space-x-2"
                    >
                        <Icon name="sync" size={16} className={isSyncing ? 'animate-spin' : ''} />
                        <span>{isSyncing ? 'Sincronizando...' : 'Iniciar Sincronización'}</span>
                    </Button>
                </div>
            </div>

            {/* Sync History */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Sincronización</h3>
                <p className="text-sm text-gray-600 mb-4">Registro de sincronizaciones anteriores</p>

                <div className="space-y-3">
                    {syncHistory.map((sync) => (
                        <div key={sync.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex-1">
                                <div className="flex items-center space-x-4">
                                    <p className="font-medium text-gray-900">{sync.date}</p>
                                    <p className="text-sm text-gray-600">
                                        {sync.records} registros sincronizados en {sync.duration}
                                    </p>
                                </div>
                            </div>
                            {getStatusBadge(sync.status)}
                        </div>
                    ))}
                </div>
            </div>

            {/* Storage Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Almacenamiento</h3>
                <p className="text-sm text-gray-600 mb-4">Estado del almacenamiento local en Raspberry Pi</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Espacio Usado</p>
                        <p className="text-lg font-semibold text-gray-900">{storageInfo.used}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Espacio Disponible</p>
                        <p className="text-lg font-semibold text-gray-900">{storageInfo.available}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Capacidad Total</p>
                        <p className="text-lg font-semibold text-gray-900">{storageInfo.total}</p>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Uso del almacenamiento</span>
                        <span>7.5%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '7.5%' }}></div>
                    </div>
                </div>
            </div>
        </div>
    )
}