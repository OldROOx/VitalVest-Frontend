import { AlertCard } from '../molecules/AlertCard'

export const AlertsList = ({ alerts, onMarkResolved }) => {
    return (
        <div className="space-y-4">
            {alerts.map((alert) => (
                <AlertCard
                    key={alert.id}
                    type={alert.type}
                    message={alert.message}
                    user={alert.user}
                    time={alert.time}
                    session={alert.session}
                    priority={alert.priority}
                    status={alert.status}
                    onMarkResolved={() => onMarkResolved(alert.id)}
                />
            ))}
        </div>
    )
}