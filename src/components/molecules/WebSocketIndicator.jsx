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




        </div>
    );
};