import { SensorStatus } from '../molecules/SensorStatus'
import { Icon } from '../atoms/Icon'

export const SensorPanel = ({ sensors }) => {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Sensores</h3>
            <div className="space-y-4">
                {sensors.map((sensor) => (
                    <SensorStatus
                        key={sensor.id}
                        name={sensor.name}
                        status={sensor.status}
                        lastReading={sensor.lastReading}
                        icon={<Icon name={sensor.icon} size={20} />}
                    />
                ))}
            </div>
        </div>
    )
}