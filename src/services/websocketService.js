// src/services/websocketService.js - WEBSOCKET DESHABILITADO TEMPORALMENTE
class WebSocketService {
    constructor() {
        this.ws = null;
        this.url = 'http://100.28.244.240'; // Tu servidor WebSocket (si está disponible)
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3; // Reducido para evitar spam
        this.reconnectInterval = 5000; // Aumentado a 5 segundos
        this.callbacks = {
            onOpen: [],
            onMessage: [],
            onClose: [],
            onError: []
        };
        this.isEnabled = false; // WEBSOCKET DESHABILITADO POR DEFECTO
    }

    connect() {
        // WebSocket deshabilitado temporalmente para usar solo API REST
        if (!this.isEnabled) {
            console.log('📡 WebSocket deshabilitado - usando solo API REST');
            // Simular conexión fallida para que el hook funcione correctamente
            setTimeout(() => {
                this.callbacks.onClose.forEach(callback => callback({ code: 1000, reason: 'WebSocket deshabilitado' }));
            }, 100);
            return;
        }

        try {
            console.log('🔌 Intentando conectar al WebSocket:', this.url);
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

                // Intentar reconexión automática solo si está habilitado
                if (this.isEnabled && event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`🔄 Intentando reconectar WebSocket... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                    setTimeout(() => this.connect(), this.reconnectInterval);
                } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    console.log('❌ Máximo de intentos de reconexión WebSocket alcanzado');
                }
            };

            this.ws.onerror = (error) => {
                console.error('❌ Error en WebSocket:', error);
                this.callbacks.onError.forEach(callback => callback(error));
            };

        } catch (error) {
            console.error('❌ Error al crear conexión WebSocket:', error);
            this.callbacks.onError.forEach(callback => callback(error));
        }
    }

    disconnect() {
        if (this.ws) {
            console.log('🔌 Desconectando WebSocket...');
            this.ws.close(1000, 'Desconexión manual');
            this.ws = null;
        }
    }

    // Habilitar WebSocket
    enable() {
        console.log('🔌 Habilitando WebSocket...');
        this.isEnabled = true;
        this.connect();
    }

    // Deshabilitar WebSocket
    disable() {
        console.log('🔌 Deshabilitando WebSocket...');
        this.isEnabled = false;
        this.disconnect();
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

    // Método para enviar datos
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const jsonData = JSON.stringify(data);
            console.log('📤 Enviando datos por WebSocket:', jsonData);
            this.ws.send(jsonData);
        } else {
            console.warn('⚠️ WebSocket no está conectado o está deshabilitado');
        }
    }

    // Verificar estado de conexión
    isConnected() {
        return this.isEnabled && this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    // Obtener estado detallado
    getConnectionState() {
        if (!this.isEnabled) return 'DISABLED';
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

    // Obtener estadísticas
    getStats() {
        return {
            url: this.url,
            state: this.getConnectionState(),
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts,
            isConnected: this.isConnected(),
            isEnabled: this.isEnabled
        };
    }
}

// Exportar instancia singleton
export const websocketService = new WebSocketService();