import { AlertsList } from '../components/organisms/AlertsList'
import { AlertsStats } from '../components/organisms/AlertsStats'
import { Button } from '../components/atoms/Button'
import { FormField } from '../components/molecules/FormField'
import { useState } from 'react'

export default function Alerts() {
    const [filters, setFilters] = useState({
        type: 'all',
        status: 'all',
        user: ''
    })

    // Datos simulados
    const alertsStats = {
        total: 5,
        resolved: 3,
        pending: 2,
        critical: 2
    }

    const alerts = [
        {
            id: 1,
            type: 'Deshidratación',
            message: 'Nivel de hidratación crítico detectado (45%)',
            user: 'Juan Pérez',
            time: '2024-01-15 14:30',
            session: 'S001',
            priority: 'Alta',
            status: 'Resuelta'
        },
        {
            id: 2,
            type: 'Temperatura Anormal',
            message: 'Temperatura corporal elevada (37.8°C)',
            user: 'Juan Pérez',
            time: '2024-01-15 10:15',
            session: 'S001',
            priority: 'Media',
            status: 'Resuelta'
        },
        {
            id: 3,
            type: 'Inactividad Prolongada',
            message: 'Sin movimiento detectado por 60 minutos',
            user: 'María García',
            time: '2024-01-14 16:45',
            session: 'S003',
            priority: 'Baja',
            status: 'Pendiente'
        },
        {
            id: 4,
            type: 'Deshidratación',
            message: 'Nivel de hidratación bajo (52%)',
            user: 'Juan Pérez',
            time: '2024-01-14 12:20',
            session: 'S002',
            priority: 'Media',
            status: 'Resuelta'
        },
        {
            id: 5,
            type: 'Estrés Elevado',
            message: 'GSR indica niveles altos de estrés',
            user: 'María García',
            time: '2024-01-13 09:30',
            session: 'S003',
            priority: 'Alta',
            status: 'Pendiente'
        }
    ]

    const handleMarkResolved = (alertId) => {
        alert(`Alerta ${alertId} marcada como resuelta`)
    }

    const handleFilterChange = (field) => (e) => {
        setFilters(prev => ({
            ...prev,
            [field]: e.target.value
        }))
    }

    const clearFilters = () => {
        setFilters({
            type: 'all',
            status: 'all',
            user: ''
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Historial de Alertas</h1>
                <p className="text-sm text-gray-500">Gestión y seguimiento de alertas del sistema</p>
            </div>

            {/* Stats */}
            <AlertsStats stats={alertsStats} />

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField label="Tipo de Alerta">
                        <select
                            value={filters.type}
                            onChange={handleFilterChange('type')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos los tipos</option>
                            <option value="dehydration">Deshidratación</option>
                            <option value="temperature">Temperatura</option>
                            <option value="inactivity">Inactividad</option>
                            <option value="stress">Estrés</option>
                        </select>
                    </FormField>

                    <FormField label="Estado">
                        <select
                            value={filters.status}
                            onChange={handleFilterChange('status')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="pending">Pendientes</option>
                            <option value="resolved">Resueltas</option>
                        </select>
                    </FormField>

                    <FormField label="Usuario">
                        <input
                            type="text"
                            placeholder="Buscar usuario..."
                            value={filters.user}
                            onChange={handleFilterChange('user')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </FormField>

                    <div className="flex items-end">
                        <Button
                            variant="secondary"
                            onClick={clearFilters}
                            className="w-full"
                        >
                            Limpiar Filtros
                        </Button>
                    </div>
                </div>
            </div>

            {/* Alerts List */}
            <AlertsList
                alerts={alerts}
                onMarkResolved={handleMarkResolved}
            />
        </div>
    )
}