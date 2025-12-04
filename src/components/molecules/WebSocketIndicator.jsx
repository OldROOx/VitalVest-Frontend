// src/components/molecules/WebSocketIndicator.jsx - CORREGIDO
import { Icon } from '../atoms/Icon';
import { Badge } from '../atoms/Badge';

export const WebSocketIndicator = ({
                                       isConnected,
                                       onReconnect,
                                       lastMessage,
                                       className = ''
                                   }) => {
    const getStatusColor = () => {
        return isConnected ? 'bg-green-500' : 'bg-red-500';
    };

    const getStatusText = () => {
        return isConnected ? 'Conectado' : 'Desconectado';
    };

    const getLastUpdateText = () => {
        if (!lastMessage || !lastMessage.timestamp) return 'Sin datos';

        const now = new Date();
        const messageTime = new Date(lastMessage.timestamp);
        const diffSeconds = Math.floor((now - messageTime) / 1000);

        if (diffSeconds < 10) return 'Ahora';
        if (diffSeconds < 60) return `hace ${diffSeconds}s`;
        if (diffSeconds < 3600) return `hace ${Math.floor(diffSeconds / 60)}m`;
        return `hace ${Math.floor(diffSeconds / 3600)}h`;
    };

    return (
        <div className={`flex items-center space-x-3 ${className}`}>
            {/* Indicador de estado */}
            <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${isConnected ? 'animate-pulse' : ''}`}></div>
                <span className="text-sm font-medium text-gray-700">
                    Estado
                </span>
            </div>

            {/* Badge de estado */}
            <Badge variant={isConnected ? 'success' : 'danger'} size="sm">
                {getStatusText()}
            </Badge>

            {/* Última actualización */}
            {lastMessage && (
                <span className="text-xs text-gray-500">
                    {getLastUpdateText()}
                </span>
            )}

            {/* Botón de reconexión */}
            {!isConnected && onReconnect && (
                <button
                    onClick={onReconnect}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    title="Reconectar WebSocket"
                >
                    <Icon name="sync" size={12} />
                    <span>Reconectar</span>
                </button>
            )}

            {/* Información adicional en modo conectado */}
            {isConnected && lastMessage && (
                <div className="text-xs text-gray-500">
                    {Object.keys(lastMessage).filter(key => key !== 'timestamp').length} sensores activos
                </div>
            )}
        </div>
    );
};