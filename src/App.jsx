// src/App.jsx - ACTUALIZADO
import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import './App.css'

// Components
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Configuration from './pages/Configuration'

// Layout
import Layout from './components/organisms/Layout'

// Services
import { authService } from './services/authService'

// ✨ NUEVO: Hook de Shared Worker
import { useSharedWorker } from './hooks/useSharedWorker'

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [currentUser, setCurrentUser] = useState(null)
    const navigate = useNavigate()

    // ✨ NUEVO: Inicializar Shared Worker
    const {
        isConnected: workerConnected,
        wsConnected,
        apiPolling,
        sensorData,
        apiData,
        startWebSocket,
        startApiPolling,
        updateAuthToken,
        workerStats
    } = useSharedWorker()

    // Verificar autenticación al cargar
    useEffect(() => {
        const authenticated = authService.isAuthenticated()
        const user = authService.getCurrentUser()
        const token = authService.getToken()

        if (authenticated && user && token) {
            setIsAuthenticated(true)
            setCurrentUser(user)

            // ✨ NUEVO: Actualizar token en Shared Worker
            updateAuthToken(token)
        }
    }, [updateAuthToken])

    // ✨ NUEVO: Iniciar servicios cuando esté autenticado
    useEffect(() => {
        if (isAuthenticated && workerConnected) {
            console.log('🚀 Iniciando servicios en Shared Worker...')
            startWebSocket()
            startApiPolling(3000)
        }
    }, [isAuthenticated, workerConnected, startWebSocket, startApiPolling])

    const handleLogin = () => {
        const user = authService.getCurrentUser()
        const token = authService.getToken()

        setIsAuthenticated(true)
        setCurrentUser(user)

        // ✨ NUEVO: Actualizar token en worker
        if (token) {
            updateAuthToken(token)
        }

        navigate('/dashboard')
    }

    const handleLogout = () => {
        authService.logout()
        setIsAuthenticated(false)
        setCurrentUser(null)
        navigate('/login')
    }

    // Componente wrapper para rutas protegidas
    const ProtectedRoute = ({ element: Element, ...rest }) => {
        return isAuthenticated ? (
            <Layout
                onLogout={handleLogout}
                currentUser={currentUser}
                workerStats={workerStats} // ✨ NUEVO: Pasar stats del worker
            >
                <Element />
            </Layout>
        ) : (
            <Navigate to="/login" replace />
        )
    }

    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        )
    }

    return (
        <div className="w-full h-screen layout-container">
            {/* ✨ NUEVO: Indicador de Shared Worker */}
            {workerConnected && (
                <div className="fixed bottom-4 right-4 z-50">
                    <div className="bg-green-100 border border-green-400 text-green-800 px-3 py-2 rounded-lg shadow-lg text-xs flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Shared Worker Activo</span>
                        <span className="font-mono">({workerStats.connections} tabs)</span>
                    </div>
                </div>
            )}

            <Routes>
                <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<ProtectedRoute element={Dashboard} />} />
                <Route path="/configuration" element={<ProtectedRoute element={Configuration} />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </div>
    )
}

export default App