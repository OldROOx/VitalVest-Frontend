import { useState, useEffect } from 'react'
import './App.css'

// Components
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'
import Alerts from './pages/Alerts'
import Configuration from './pages/Configuration'
import Sync from './pages/Sync'

// Layout
import Layout from './components/organisms/Layout'

// Services
import { authService } from './services/authService'

function App() {
    const [currentPage, setCurrentPage] = useState('login')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [currentUser, setCurrentUser] = useState(null)

    // Verificar si el usuario ya está autenticado al cargar la app
    useEffect(() => {
        const authenticated = authService.isAuthenticated()
        const user = authService.getCurrentUser()

        if (authenticated && user) {
            setIsAuthenticated(true)
            setCurrentUser(user)
            setCurrentPage('dashboard')
        }
    }, [])

    const handleLogin = () => {
        const user = authService.getCurrentUser()
        setIsAuthenticated(true)
        setCurrentUser(user)
        setCurrentPage('dashboard')
    }

    const handleLogout = () => {
        authService.logout()
        setIsAuthenticated(false)
        setCurrentUser(null)
        setCurrentPage('login')
    }

    const renderPage = () => {
        if (!isAuthenticated && currentPage !== 'login') {
            return <Login onLogin={handleLogin} />
        }

        switch (currentPage) {
            case 'login':
                return <Login onLogin={handleLogin} />
            case 'dashboard':
                return <Dashboard />
            case 'sessions':
                return <Sessions />
            case 'alerts':
                return <Alerts />
            case 'configuration':
                return <Configuration />
            case 'sync':
                return <Sync />
            default:
                return <Dashboard />
        }
    }

    if (!isAuthenticated && currentPage === 'login') {
        return renderPage()
    }

    return (
        <Layout
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            onLogout={handleLogout}
            currentUser={currentUser}
        >
            {renderPage()}
        </Layout>
    )
}

export default App