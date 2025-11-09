import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom' // Importado
import './App.css'

// Components
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Configuration from './pages/Configuration'

// Layout
import Layout from './components/organisms/Layout'

// Services
import { authService } from './services/authService'

function App() {
    // Eliminamos currentPage y onNavigate
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [currentUser, setCurrentUser] = useState(null)
    const navigate = useNavigate(); // Hook para manejar la navegación programática

    // Verificar si el usuario ya está autenticado al cargar la app
    useEffect(() => {
        const authenticated = authService.isAuthenticated()
        const user = authService.getCurrentUser()

        if (authenticated && user) {
            setIsAuthenticated(true)
            setCurrentUser(user)
        }
    }, [])

    const handleLogin = () => {
        const user = authService.getCurrentUser()
        setIsAuthenticated(true)
        setCurrentUser(user)
        navigate('/dashboard'); // Redirige al Dashboard después del login
    }

    const handleLogout = () => {
        authService.logout()
        setIsAuthenticated(false)
        setCurrentUser(null)
        navigate('/login'); // Redirige al Login después del logout
    }

    // Componente wrapper para rutas protegidas
    const ProtectedRoute = ({ element: Element, ...rest }) => {
        return isAuthenticated ? (
            <Layout onLogout={handleLogout} currentUser={currentUser}>
                <Element />
            </Layout>
        ) : (
            <Navigate to="/login" replace />
        );
    };

    // La página de Login ya no necesita Layout
    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    // Una vez autenticado, usamos Routes y ProtectedRoute
    return (
        <div className="w-full h-screen layout-container">
            <Routes>
                <Route path="/login" element={<Navigate to="/dashboard" replace />} />

                {/* Rutas Protegidas que usan el Layout */}
                <Route path="/dashboard" element={<ProtectedRoute element={Dashboard} />} />
                <Route path="/configuration" element={<ProtectedRoute element={Configuration} />} />

                {/* Redireccionar la ruta raíz y cualquier otra a Dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </div>
    )
}

export default App