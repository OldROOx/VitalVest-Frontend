import { useState } from 'react'
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

function App() {
    const [currentPage, setCurrentPage] = useState('login')
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    const handleLogin = () => {
        setIsAuthenticated(true)
        setCurrentPage('dashboard')
    }

    const handleLogout = () => {
        setIsAuthenticated(false)
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
        >
            {renderPage()}
        </Layout>
    )
}

export default App