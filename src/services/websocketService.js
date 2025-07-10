// src/services/websocketService.js
class WebSocketService {
    constructor() {
        this.ws = null;
        this.url = 'ws://localhost:8080/ws';  // Cambiado de 3010 a 8080
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
            console.log('Conectando al WebSocket:', this.url);
            this.ws = new WebSocket(this.url);

            this.ws.onopen = (event) => {
                console.log('✅ WebSocket conectado');
                this.reconnectAttempts = 0;
                this.callbacks.onOpen.forEach(callback => callback(event));
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📦 Datos recibidos por WebSocket:', data);
                    this.callbacks.onMessage.forEach(callback => callback(data));
                } catch (error) {
                    console.error('Error al parsear datos del WebSocket:', error);
                }
            };

            this.ws.onclose = (event) => {
                console.log('🔌 WebSocket desconectado');
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
            console.error('Error al crear conexión WebSocket:', error);
        }
    }

    disconnect() {
        if (this.ws) {
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
        } else {
            console.warn('WebSocket no está conectado');
        }
    }

    // Verificar estado de conexión
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}

// Exportar instancia singleton
export const websocketService = new WebSocketService();