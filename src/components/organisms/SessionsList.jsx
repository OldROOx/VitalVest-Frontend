import { SessionCard } from '../molecules/SessionCard'

export const SessionsList = ({ sessions, onViewDetails }) => {
    return (
        <div className="space-y-4">
            {sessions.map((session) => (
                <SessionCard
                    key={session.id}
                    sessionId={session.id}
                    date={session.date}
                    duration={session.duration}
                    user={session.user}
                    avgTemp={session.avgTemp}
                    steps={session.steps}
                    alerts={session.alerts}
                    status={session.status}
                    onViewDetails={() => onViewDetails(session.id)}
                />
            ))}
        </div>
    )
}