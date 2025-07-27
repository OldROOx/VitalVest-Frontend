import { MetricCard } from '../molecules/MetricCard'

export const DashboardStats = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
                title="Temperatura Corporal"
                value={stats.bodyTemp?.toFixed(1) || '--'}
                unit="°C"
                icon="thermometer"
                status={stats.bodyTemp > 38 ? 'danger' : stats.bodyTemp > 37.5 ? 'warning' : 'normal'}
            />
            <MetricCard
                title="Pasos Hoy"
                value={stats.steps || 0}
                icon="activity"
                status="success"
            />
            <MetricCard
                title="Temp. Ambiente"
                value={stats.ambientTemp?.toFixed(1) || '--'}
                unit="°C"
                icon="thermometer"
                status="normal"
            />

        </div>
    )
}