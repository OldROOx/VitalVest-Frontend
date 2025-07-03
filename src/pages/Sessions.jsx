import { useState } from 'react'
import { SessionsList } from '../components/organisms/SessionsList'
import { Button } from '../components/atoms/Button'
import { FormField } from '../components/molecules/FormField'

export default function Sessions() {
    const [filters, setFilters] = useState({
        date: '',
        user: '',
        alerts: 'all'
    })

    // Datos simulados
    const sessions = [
        {
            id: 'S001',
            date: '2024-01-15',
            duration: '8h 30m',
            user: 'Juan Pérez',
            avgTemp: '36.8°C',
            steps: 8420,
            alerts: 3,
            status: 'Completada'
        },
        {
            id: 'S002',
            date: '2024-01-14',
            duration: '6h 15m',
            user: 'Juan Pérez',
            avgTemp: '37.1°C',
            steps: 6230,
            alerts: 1,
            status: 'Completada'
        },
        {
            id: 'S003',
            date: '2024-01-13',
            duration: '9h 45m',
            user: 'María García',
            avgTemp: '36.5°C',
            steps: 9840,
            alerts: 5,
            status: 'Con Alertas'
        },
        {
            id: 'S004',
            date: '2024-01-12',
            duration: '7h 20m',
            user: 'Juan Pérez',
            avgTemp: '36.9°C',
            steps: 7650,
            alerts: 0,
            status: 'Completada'
        }
    ]

    const handleViewDetails = (sessionId) => {
        alert(`Ver detalles de la sesión ${sessionId}`)
    }

    const handleFilterChange = (field) => (e) => {
        setFilters(prev => ({
            ...prev,
            [field]: e.target.value
        }))
    }

    const clearFilters = () => {
        setFilters({
            date: '',
            user: '',
            alerts: 'all'
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Historial de Sesiones</h1>
                <p className="text-sm text-gray-500">Consulta datos de sesiones anteriores</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                        label="Fecha"
                        type="date"
                        value={filters.date}
                        onChange={handleFilterChange('date')}
                    />

                    <FormField label="Usuario">
                        <input
                            type="text"
                            placeholder="Buscar usuario..."
                            value={filters.user}
                            onChange={handleFilterChange('user')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </FormField>

                    <FormField label="Alertas">
                        <select
                            value={filters.alerts}
                            onChange={handleFilterChange('alerts')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todas las sesiones</option>
                            <option value="with-alerts">Con alertas</option>
                            <option value="no-alerts">Sin alertas</option>
                        </select>
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

            {/* Sessions List */}
            <SessionsList
                sessions={sessions}
                onViewDetails={handleViewDetails}
            />
        </div>
    )
}