// src/services/websocketService.js - VERSIÓN CORREGIDA
class WebSocketService {
    constructor() {
        this.ws = null;
        this.url = 'ws://localhost:3000/ws';  // Usar puerto 3000 según tu backend
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000;
        this.callbacks = {
            onOpen: [],
            onMessage: [],
            onClose: [],
            onError: []
        };
    }

    connect() {
        try {
            console.log('🔌 Conectando al WebSocket:', this.url);
            this.ws = new WebSocket(this.url);

            this.ws.onopen = (event) => {
                console.log('✅ WebSocket conectado exitosamente');
                this.reconnectAttempts = 0;
                this.callbacks.onOpen.forEach(callback => callback(event));
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📦 Mensaje recibido por WebSocket:', data);

                    // Validar que los datos tengan la estructura esperada
                    if (data && typeof data === 'object') {
                        this.callbacks.onMessage.forEach(callback => callback(data));
                    } else {
                        console.warn('⚠️ Datos recibidos no tienen formato válido:', data);
                    }
                } catch (error) {
                    console.error('❌ Error al parsear datos del WebSocket:', error);
                    console.log('Datos raw recibidos:', event.data);
                }
            };

            this.ws.onclose = (event) => {
                console.log('🔌 WebSocket desconectado. Código:', event.code, 'Razón:', event.reason);
                this.callbacks.onClose.forEach(callback => callback(event));

                // Intentar reconexión automática solo si no fue cerrado intencionalmente
                if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`🔄 Intentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                    setTimeout(() => this.connect(), this.reconnectInterval);
                } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    console.log('❌ Máximo de intentos de reconexión alcanzado');
                }
            };

            this.ws.onerror = (error) => {
                console.error('❌ Error en WebSocket:', error);
                console.log('URL del WebSocket:', this.url);
                console.log('Estado actual:', this.ws ? this.ws.readyState : 'No inicializado');
                this.callbacks.onError.forEach(callback => callback(error));
            };

        } catch (error) {
            console.error('❌ Error al crear conexión WebSocket:', error);
        }
    }

    disconnect() {
        if (this.ws) {
            console.log('🔌 Desconectando WebSocket...');
            this.ws.close(1000, 'Desconexión manual'); // Código 1000 = cierre normal
            this.ws = null;
        }
    }

    // Métodos para registrar callbacks
    onOpen(callback) {
        this.callbacks.onOpen.push(callback);
    }

    onMessage(callback) {
        this.callbacks.onMessage.push(callback);
    }

    onClose(callback) {
        this.callbacks.onClose.push(callback);
    }

    onError(callback) {
        this.callbacks.onError.push(callback);
    }

    // Método para enviar datos (opcional)
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const jsonData = JSON.stringify(data);
            console.log('📤 Enviando datos por WebSocket:', jsonData);
            this.ws.send(jsonData);
        } else {
            console.warn('⚠️ WebSocket no está conectado. Estado:', this.ws ? this.ws.readyState : 'No inicializado');
        }
    }

    // Verificar estado de conexión
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    // Obtener estado detallado de la conexión
    getConnectionState() {
        if (!this.ws) return 'NO_INITIALIZED';

        switch (this.ws.readyState) {
            case WebSocket.CONNECTING:
                return 'CONNECTING';
            case WebSocket.OPEN:
                return 'OPEN';
            case WebSocket.CLOSING:
                return 'CLOSING';
            case WebSocket.CLOSED:
                return 'CLOSED';
            default:
                return 'UNKNOWN';
        }
    }

    // Método para cambiar la URL del WebSocket
    setUrl(newUrl) {
        if (this.isConnected()) {
            console.warn('⚠️ Cerrando conexión actual antes de cambiar URL');
            this.disconnect();
        }
        this.url = newUrl;
        console.log('🔧 URL del WebSocket cambiada a:', this.url);
    }

    // Método para hacer ping al servidor (si el servidor lo soporta)
    ping() {
        if (this.isConnected()) {
            this.send({ type: 'ping', timestamp: new Date().toISOString() });
        }
    }

    // Método para obtener estadísticas de la conexión
    getStats() {
        return {
            url: this.url,
            state: this.getConnectionState(),
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts,
            isConnected: this.isConnected()
        };
    }
}

// Exportar instancia singleton
export const websocketService = new WebSocketService();