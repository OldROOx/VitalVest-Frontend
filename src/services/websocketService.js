// src/services/websocketService.js - CORREGIDO PARA TU BACKEND
class WebSocketService {
    constructor() {
        this.ws = null;
        this.url = 'ws://localhost:8080/ws';  // Tu API Go corre en 8080
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
                    console.log('📦 Datos recibidos por WebSocket:', data);

                    // Tu backend envía datos con esta estructura según tu dominio:
                    // {
                    //   "temperatura": float64,
                    //   "presion": float64,
                    //   "humedad": float64,
                    //   "aceleracion": {"x": float64, "y": float64, "z": float64},
                    //   "giroscopio": {"x": float64, "y": float64, "z": float64}
                    // }

                    this.callbacks.onMessage.forEach(callback => callback(data));
                } catch (error) {
                    console.error('❌ Error al parsear datos del WebSocket:', error);
                    console.log('Raw data:', event.data);
                }
            };

            this.ws.onclose = (event) => {
                console.log('🔌 WebSocket desconectado:', event.code, event.reason);
                this.callbacks.onClose.forEach(callback => callback(event));

                // Intentar reconexión automática
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`🔄 Intentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                    setTimeout(() => this.connect(), this.reconnectInterval);
                } else {
                    console.log('❌ Máximo de intentos de reconexión alcanzado');
                }
            };

            this.ws.onerror = (error) => {
                console.error('❌ Error en WebSocket:', error);
                this.callbacks.onError.forEach(callback => callback(error));
            };

        } catch (error) {
            console.error('❌ Error al crear conexión WebSocket:', error);
        }
    }

    disconnect() {
        if (this.ws) {
            console.log('🔌 Cerrando conexión WebSocket manualmente');
            this.ws.close();
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
            this.ws.send(JSON.stringify(data));
            console.log('📤 Datos enviados por WebSocket:', data);
        } else {
            console.warn('⚠️ WebSocket no está conectado, no se pueden enviar datos');
        }
    }

    // Verificar estado de conexión
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    // Obtener estado detallado
    getConnectionState() {
        if (!this.ws) return 'DISCONNECTED';

        switch (this.ws.readyState) {
            case WebSocket.CONNECTING: return 'CONNECTING';
            case WebSocket.OPEN: return 'OPEN';
            case WebSocket.CLOSING: return 'CLOSING';
            case WebSocket.CLOSED: return 'CLOSED';
            default: return 'UNKNOWN';
        }
    }
}

// Exportar instancia singleton
export const websocketService = new WebSocketService();