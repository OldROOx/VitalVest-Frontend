// src/components/organisms/Layout.jsx
import { useState } from 'react';
import { Icon } from '../atoms/Icon';
import { Button } from '../atoms/Button';
import { NavigationItem } from '../molecules/NavigationItem';
import { WebSocketIndicator } from '../molecules/WebSocketIndicator';
import { useWebSocket } from '../../hooks/useWebSocket';

export default function Layout({ children, currentPage, onNavigate, onLogout, currentUser }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { isConnected, lastMessage, reconnect } = useWebSocket();

    const navigation = [
        { id: 'dashboard', name: 'Dashboard', icon: 'dashboard' },
        { id: 'sessions', name: 'Sesiones', icon: 'sessions' },
        { id: 'alerts', name: 'Alertas', icon: 'alerts' },
        { id: 'configuration', name: 'Configuración', icon: 'config' },
        { id: 'sync', name: 'Sincronización', icon: 'sync' }
    ];

    return (
        <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <div className={`bg-white w-64 min-h-screen shadow-lg flex-shrink-0 ${
                sidebarOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden'
            } lg:relative lg:block`}>
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Icon name="vitalvest" size={32} color="white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">VitalVest</h1>
                            <p className="text-sm text-gray-500">Panel de Control Local</p>
                        </div>
                    </div>
                </div>

                {/* WebSocket Status en el sidebar */}
                <div className="p-4 border-b border-gray-200">
                    <WebSocketIndicator
                        isConnected={isConnected}
                        lastMessage={lastMessage}
                        onReconnect={reconnect}
                    />
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2">
                    {navigation.map((item) => (
                        <NavigationItem
                            key={item.id}
                            icon={item.icon}
                            label={item.name}
                            active={currentPage === item.id}
                            onClick={() => onNavigate(item.id)}
                        />
                    ))}
                </nav>

                {/* User section */}
                <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-gray-300 p-2 rounded-full">
                                <Icon name="user" size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {currentUser?.username || 'Usuario'}
                                </p>
                                <p className="text-xs text-gray-500">Conectado</p>
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={onLogout}
                            className="p-2"
                            title="Cerrar sesión"
                        >
                            <Icon name="close" size={16} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0 w-full">
                {/* Top header */}
                <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center justify-between p-4 w-full">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="secondary"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 lg:hidden"
                            >
                                <Icon name="menu" size={20} />
                            </Button>
                            <h1 className="text-lg font-semibold text-gray-900 lg:hidden">VitalVest</h1>
                        </div>

                        {/* WebSocket status en el header (visible en móvil) */}
                        <div className="flex items-center space-x-4">
                            <div className="lg:hidden">
                                <WebSocketIndicator
                                    isConnected={isConnected}
                                    lastMessage={lastMessage}
                                    onReconnect={reconnect}
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto p-4 md:p-6 w-full bg-gray-50">
                    <div className="w-full max-w-none">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}