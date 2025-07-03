import { Badge } from '../atoms/Badge'
import { Button } from '../atoms/Button'

export const AlertCard = ({
                              type,
                              message,
                              user,
                              time,
                              session,
                              priority,
                              status = 'Pendiente',
                              onMarkResolved
                          }) => {
    const getPriorityVariant = (priority) => {
        switch (priority.toLowerCase()) {
            case 'alta':
                return 'danger'
            case 'crítica':
                return 'critical'
            case 'media':
                return 'warning'
            case 'baja':
                return 'low'
            default:
                return 'default'
        }
    }

    const getStatusColor = (status) => {
        return status === 'Resuelta' ? 'text-green-600' : 'text-orange-600'
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{type}</h3>
                        <Badge variant={getPriorityVariant(priority)} size="sm">
                            {priority.toUpperCase()}
                        </Badge>
                    </div>
                    <p className="text-gray-700 mb-2">{message}</p>
                    <div className="text-sm text-gray-500">
                        <p>Usuario: {user} • Hora: {time} • Sesión: {session}</p>
                    </div>
                </div>
                <span className={`text-sm font-medium ${getStatusColor(status)}`}>
          {status}
        </span>
            </div>

            {status === 'Pendiente' && (
                <div className="flex gap-2">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={onMarkResolved}
                    >
                        Marcar como Resuelta
                    </Button>
                </div>
            )}
        </div>
    )
}