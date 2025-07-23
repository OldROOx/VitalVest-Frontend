// src/components/organisms/Layout.jsx - VERSION MEJORADA CON SIDEBAR DESLIZABLE
import { useState, useRef, useEffect } from 'react';
import { Icon } from '../atoms/Icon';
import { Button } from '../atoms/Button';
import { NavigationItem } from '../molecules/NavigationItem';
import { WebSocketIndicator } from '../molecules/WebSocketIndicator';
import { useWebSocket } from '../../hooks/useWebSocket';

export default function Layout({ children, currentPage, onNavigate, onLogout, currentUser }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragCurrentX, setDragCurrentX] = useState(0);
    const [sidebarTransform, setSidebarTransform] = useState(0);

    const sidebarRef = useRef(null);
    const { isConnected, lastMessage, reconnect } = useWebSocket();

    const navigation = [
        { id: 'dashboard', name: 'Dashboard', icon: 'dashboard' },
        { id: 'sessions', name: 'Sesiones', icon: 'sessions' },
        { id: 'configuration', name: 'Configuración', icon: 'config' },
        { id: 'sync', name: 'Sincronización', icon: 'sync' }
    ];

    // Función para manejar el inicio del arrastre
    const handleMouseDown = (e) => {
        if (window.innerWidth >= 1024) { // Solo en desktop
            setIsDragging(true);
            setDragStartX(e.clientX);
            setDragCurrentX(e.clientX);
            document.body.style.userSelect = 'none';
        }
    };

    const handleTouchStart = (e) => {
        if (window.innerWidth >= 1024) { // Solo en desktop
            setIsDragging(true);
            setDragStartX(e.touches[0].clientX);
            setDragCurrentX(e.touches[0].clientX);
        }
    };

    // Función para manejar el movimiento del arrastre
    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - dragStartX;
        const maxDrag = -200; // Máximo arrastre hacia la izquierda
        const clampedDelta = Math.min(0, Math.max(maxDrag, deltaX));

        setDragCurrentX(e.clientX);
        setSidebarTransform(clampedDelta);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;

        const deltaX = e.touches[0].clientX - dragStartX;
        const maxDrag = -200;
        const clampedDelta = Math.min(0, Math.max(maxDrag, deltaX));

        setDragCurrentX(e.touches[0].clientX);
        setSidebarTransform(clampedDelta);
    };

    // Función para manejar el final del arrastre
    const handleDragEnd = () => {
        if (!isDragging) return;

        const deltaX = dragCurrentX - dragStartX;
        const threshold = -100; // Umbral para colapsar

        if (deltaX < threshold) {
            setSidebarCollapsed(true);
        } else {
            setSidebarCollapsed(false);
        }

        setIsDragging(false);
        setSidebarTransform(0);
        document.body.style.userSelect = '';
    };

    // Event listeners globales para el arrastre
    useEffect(() => {
        const handleGlobalMouseMove = (e) => handleMouseMove(e);
        const handleGlobalMouseUp = () => handleDragEnd();
        const handleGlobalTouchMove = (e) => handleTouchMove(e);
        const handleGlobalTouchEnd = () => handleDragEnd();

        if (isDragging) {
            document.addEventListener('mousemove', handleGlobalMouseMove);
            document.addEventListener('mouseup', handleGlobalMouseUp);
            document.addEventListener('touchmove', handleGlobalTouchMove);
            document.addEventListener('touchend', handleGlobalTouchEnd);
        }

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
            document.removeEventListener('touchmove', handleGlobalTouchMove);
            document.removeEventListener('touchend', handleGlobalTouchEnd);
        };
    }, [isDragging, dragStartX, dragCurrentX]);

    // Función para alternar colapso del sidebar
    const toggleSidebarCollapse = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    // Calcular estilos del sidebar
    const getSidebarStyles = () => {
        let transform = sidebarTransform;

        if (sidebarCollapsed && !isDragging) {
            transform = -200; // Sidebar colapsado
        }

        return {
            transform: `translateX(${transform}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            width: sidebarCollapsed ? '64px' : '256px'
        };
    };

    return (
        <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <div
                ref={sidebarRef}
                className={`bg-white min-h-screen shadow-lg flex-shrink-0 relative ${
                    sidebarOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden'
                } lg:relative lg:block`}
                style={window.innerWidth >= 1024 ? getSidebarStyles() : {}}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                {/* Barra de arrastre visual */}
                <div className={`absolute right-0 top-0 bottom-0 w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors duration-200 ${
                    isDragging ? 'bg-blue-500' : ''
                } hidden lg:block`}>
                    <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-8 bg-gray-400 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                </div>

                {/* Botón para colapsar/expandir */}
                <button
                    onClick={toggleSidebarCollapse}
                    className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-300 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors duration-200 z-10 hidden lg:flex"
                    title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                >
                    <Icon
                        name={sidebarCollapsed ? 'menu' : 'close'}
                        size={12}
                        className="text-gray-600"
                    />
                </button>

                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Icon name="vitalvest" size={32} color="white" />
                        </div>
                        {!sidebarCollapsed && (
                            <div className="transition-opacity duration-200">
                                <h1 className="text-xl font-bold text-gray-900">VitalVest</h1>
                                <p className="text-sm text-gray-500">Panel de Control Local</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* WebSocket Status en el sidebar */}


                {/* Navigation */}
                <nav className="p-4 space-y-2">
                    {navigation.map((item) => (
                        <div key={item.id} className="relative group">
                            <NavigationItem
                                icon={item.icon}
                                label={sidebarCollapsed ? '' : item.name}
                                active={currentPage === item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`${sidebarCollapsed ? 'justify-center px-2' : ''} transition-all duration-200`}
                            />
                            {/* Tooltip para modo colapsado */}
                            {sidebarCollapsed && (
                                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                                    {item.name}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* User section */}
                <div className={`absolute bottom-0 ${sidebarCollapsed ? 'w-16' : 'w-64'} p-4 border-t border-gray-200 bg-white transition-all duration-200`}>
                    <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
                            <div className="bg-gray-300 p-2 rounded-full">
                                <Icon name="user" size={20} />
                            </div>
                            {!sidebarCollapsed && (
                                <div className="transition-opacity duration-200">
                                    <p className="text-sm font-medium text-gray-900">
                                        {currentUser?.username || 'Usuario'}
                                    </p>
                                    <p className="text-xs text-gray-500">Conectado</p>
                                </div>
                            )}
                        </div>
                        {!sidebarCollapsed && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={onLogout}
                                className="p-2 transition-opacity duration-200"
                                title="Cerrar sesión"
                            >
                                <Icon name="close" size={16} />
                            </Button>
                        )}
                    </div>
                    {/* Tooltip para botón de logout en modo colapsado */}
                    {sidebarCollapsed && (
                        <div className="mt-2 flex justify-center">
                            <button
                                onClick={onLogout}
                                className="p-1 rounded hover:bg-gray-100 transition-colors duration-200 group relative"
                                title="Cerrar sesión"
                            >
                                <Icon name="close" size={16} className="text-gray-600" />
                                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                                    Cerrar sesión
                                </div>
                            </button>
                        </div>
                    )}
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

                            {/* Botón para expandir sidebar cuando está colapsado (solo desktop) */}
                            {sidebarCollapsed && (
                                <Button
                                    variant="secondary"
                                    onClick={toggleSidebarCollapse}
                                    className="p-2 hidden lg:flex"
                                    title="Expandir sidebar"
                                >
                                    <Icon name="menu" size={20} />
                                </Button>
                            )}
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

            {/* Indicador visual de arrastre */}
            {isDragging && (
                <div className="fixed inset-0 pointer-events-none z-50">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-lg"></div>
                </div>
            )}
        </div>
    );
}