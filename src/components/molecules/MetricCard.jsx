import { Icon } from '../atoms/Icon'

export const MetricCard = ({
                               title,
                               value,
                               unit,
                               icon,
                               status = 'normal',
                               className = ''
                           }) => {
    const statusColors = {
        normal: 'border-gray-200 bg-white',
        warning: 'border-yellow-200 bg-yellow-50',
        danger: 'border-red-200 bg-red-50',
        success: 'border-green-200 bg-green-50'
    }

    const valueColors = {
        normal: 'text-gray-900',
        warning: 'text-yellow-800',
        danger: 'text-red-800',
        success: 'text-green-800'
    }

    return (
        <div className={`p-6 rounded-lg border-2 ${statusColors[status]} ${className}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <div className="flex items-baseline mt-2">
                        <p className={`text-2xl font-bold ${valueColors[status]}`}>{value}</p>
                        {unit && <span className="ml-1 text-sm text-gray-500">{unit}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{status === 'normal' ? 'Normal' : status}</p>
                </div>
                {icon && (
                    <div className={`p-3 rounded-full ${statusColors[status]}`}>
                        <Icon name={icon} size={24} color={status === 'normal' ? '#3B82F6' : 'currentColor'} />
                    </div>
                )}
            </div>
        </div>
    )
}