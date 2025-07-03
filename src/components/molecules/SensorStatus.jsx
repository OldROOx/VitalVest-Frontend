import { Badge } from '../atoms/Badge'

export const SensorStatus = ({
                                 name,
                                 status,
                                 lastReading,
                                 icon
                             }) => {
    const getStatusVariant = (status) => {
        switch (status.toLowerCase()) {
            case 'activo':
                return 'success'
            case 'inactivo':
                return 'danger'
            case 'warning':
                return 'warning'
            default:
                return 'default'
        }
    }

    return (
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
                <div className="text-gray-600">
                    {icon}
                </div>
                <div>
                    <h4 className="font-medium text-gray-900">{name}</h4>
                    <p className="text-sm text-gray-500">Última lectura: {lastReading}</p>
                </div>
            </div>
            <Badge variant={getStatusVariant(status)}>
                {status}
            </Badge>
        </div>
    )
}