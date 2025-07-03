import { MetricCard } from '../molecules/MetricCard'

export const DashboardStats = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
                title="Temperatura Corporal"
                value={stats.bodyTemp}
                unit="°C"
                icon="thermometer"
                status={stats.bodyTemp > 38 ? 'danger' : 'normal'}
            />
            <MetricCard
                title="Pasos Hoy"
                value={stats.steps}
                icon="activity"
                status="success"
            />
            <MetricCard
                title="Temp. Ambiente"
                value={stats.ambientTemp}
                unit="°C"
                icon="thermometer"
                status="normal"
            />
            <MetricCard
                title="Hidratación"
                value={stats.hydration}
                unit="%"
                icon="droplet"
                status={stats.hydration < 60 ? 'warning' : 'normal'}
            />
        </div>
    )
}