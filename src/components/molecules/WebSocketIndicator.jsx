// src/components/molecules/WebSocketIndicator.jsx
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
        if (!lastMessage) return 'Sin datos';

        const now = new Date();
        const messageTime = new Date(lastMessage.timestamp || now);
        const diffSeconds = Math.floor((now - messageTime) / 1000);

        if (diffSeconds < 60) return 'Ahora';
        if (diffSeconds < 3600) return `hace ${Math.floor(diffSeconds / 60)}m`;
        return `hace ${Math.floor(diffSeconds / 3600)}h`;
    };

    return (
        <div className={`flex items-center space-x-3 ${className}`}>
            {/* Indicador de estado */}
            <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${isConnected ? 'animate-pulse' : ''}`}></div>
                <span className="text-sm font-medium text-gray-700">
                    {getStatusText()}
                </span>
            </div>

            {/* Información adicional */}
            <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Icon name="activity" size={12} />
                <span>Última actualización: {getLastUpdateText()}</span>
            </div>

            {/* Botón de reconexión */}
            {!isConnected && onReconnect && (
                <button
                    onClick={onReconnect}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                >
                    Reconectar
                </button>
            )}

            {/* Badge de estado */}
            <Badge
                variant={isConnected ? 'success' : 'danger'}
                size="sm"
            >
                {isConnected ? 'Online' : 'Offline'}
            </Badge>
        </div>
    );
};