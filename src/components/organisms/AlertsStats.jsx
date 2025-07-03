import { Badge } from '../atoms/Badge'

export const AlertsStats = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                <div className="flex items-center justify-center mb-2">
                    <Badge variant="default" className="text-lg px-4 py-2">
                        {stats.total}
                    </Badge>
                </div>
                <p className="text-sm font-medium text-gray-600">Total Alertas</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                <div className="flex items-center justify-center mb-2">
                    <Badge variant="success" className="text-lg px-4 py-2">
                        {stats.resolved}
                    </Badge>
                </div>
                <p className="text-sm font-medium text-gray-600">Resueltas</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                <div className="flex items-center justify-center mb-2">
                    <Badge variant="warning" className="text-lg px-4 py-2">
                        {stats.pending}
                    </Badge>
                </div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                <div className="flex items-center justify-center mb-2">
                    <Badge variant="critical" className="text-lg px-4 py-2">
                        {stats.critical}
                    </Badge>
                </div>
                <p className="text-sm font-medium text-gray-600">Críticas</p>
            </div>
        </div>
    )
}