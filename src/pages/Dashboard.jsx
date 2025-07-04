// src/pages/Dashboard.jsx
import { DashboardStats } from '../components/organisms/DashboardStats'
import { SimpleChart } from '../components/molecules/SimpleChart.jsx' // ← Cambio aquí

export default function Dashboard() {
    // Datos simulados
    const stats = {
        bodyTemp: 36.9,
        steps: 8200,
        ambientTemp: 25.9,
        hydration: 71
    }

    // Datos para gráfico de pasos diarios (barras)
    const stepsData = [
        { label: 'Lun', value: 6800 },
        { label: 'Mar', value: 8200 },
        { label: 'Mié', value: 7500 },
        { label: 'Jue', value: 9100 },
        { label: 'Vie', value: 7800 },
        { label: 'Sáb', value: 10200 },
        { label: 'Dom', value: 6400 }
    ]

    // Datos para gráfico de temperatura corporal (línea)
    const temperatureData = [
        { label: '00:00', value: 36.2 },
        { label: '04:00', value: 35.8 },
        { label: '08:00', value: 36.5 },
        { label: '12:00', value: 37.1 },
        { label: '16:00', value: 37.3 },
        { label: '20:00', value: 36.8 },
        { label: '24:00', value: 36.4 }
    ]

    const recommendations = [
        {
            type: 'success',
            text: 'Temperatura corporal en rango normal'
        },
        {
            type: 'warning',
            text: 'Recomendación: Aumentar actividad física para alcanzar meta diaria'
        },
        {
            type: 'info',
            text: 'Hidratación adecuada - Continuar con rutina actual'
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">Última actualización: hace 2 min</p>
            </div>

            {/* Stats Cards */}
            <DashboardStats stats={stats} />

            {/* Charts Section con Chart.js */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de pasos diarios */}
                <div className="bg-white rounded-lg border border-gray-200">
                    <SimpleChart
                        type="bar"
                        title="Pasos Diarios"
                        data={stepsData}
                    />
                </div>

                {/* Gráfico de temperatura corporal */}
                <div className="bg-white rounded-lg border border-gray-200">
                    <SimpleChart
                        type="line"
                        title="Temperatura Corporal (24h)"
                        data={temperatureData}
                    />
                </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hidratación de la Piel</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Nivel actual</span>
                            <span className="text-lg font-semibold text-blue-600">71%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: '71%' }}
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            Nivel detectado por sensor GSR
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas y Recomendaciones</h3>
                    <div className="space-y-3">
                        {recommendations.map((rec, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded-lg text-sm ${
                                    rec.type === 'success' ? 'bg-green-50 text-green-800' :
                                        rec.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                                            'bg-blue-50 text-blue-800'
                                }`}
                            >
                                {rec.text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}