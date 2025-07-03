import { Badge } from '../atoms/Badge'
import { Button } from '../atoms/Button'
import { Icon } from '../atoms/Icon'

export const SessionCard = ({
                                sessionId,
                                date,
                                duration,
                                user,
                                avgTemp,
                                steps,
                                alerts,
                                status,
                                onViewDetails
                            }) => {
    const getStatusVariant = (status) => {
        switch (status) {
            case 'Completada':
                return 'success'
            case 'Con Alertas':
                return 'warning'
            default:
                return 'default'
        }
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{sessionId}</h3>
                    <p className="text-sm text-gray-500">{date} • {duration} • {user}</p>
                </div>
                <Badge variant={getStatusVariant(status)}>
                    {status}
                </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{avgTemp}</p>
                    <p className="text-xs text-gray-500">Temp. Promedio</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{steps}</p>
                    <p className="text-xs text-gray-500">Pasos</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{alerts}</p>
                    <p className="text-xs text-gray-500">Alertas</p>
                </div>
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={onViewDetails}
                className="w-full"
            >
                <Icon name="eye" size={16} className="mr-2" />
                Ver Detalles
            </Button>
        </div>
    )
}