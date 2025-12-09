// src/services/websocketService.js - MEJORADO CON PROTECCIÓN DE CONCURRENCIA
// ✅ CAMBIOS: Agregado lock (isConnecting), cola de mensajes, copia de callbacks
// ⚠️ API COMPATIBLE: Todas las funciones públicas siguen igual

class WebSocketService {
    constructor() {
        this.ws = null;
        this.url = 'ws://100.30.168.141:3000/ws';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000;
        this.callbacks = {
            onOpen: [],
            onMessage: [],
            onClose: [],
            onError: []
        };
        this.isEnabled = true;
        this.isConnecting = false; // ✅ NUEVO: Lock para evitar conexiones múltiples
        this.messageQueue = []; // ✅ NUEVO: Cola de mensajes durante desconexión
    }

    connect() {
        // ✅ NUEVO: Protección contra conexiones concurrentes
        if (this.isConnecting) {
            console.log('⚠️ Ya hay una conexión en progreso');
            return;
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('⚠️ WebSocket ya está conectado');
            return;
        }

        if (!this.isEnabled) {
            console.log('📡 WebSocket deshabilitado');
            return;
        }

        this.isConnecting = true; // ✅ Activar lock

        try {
            console.log('🔌 Conectando al WebSocket:', this.url);
            this.ws = new WebSocket(this.url);

            this.ws.onopen = (event) => {
                this.isConnecting = false; // ✅ Liberar lock
                console.log('✅ WebSocket conectado exitosamente');
                this.reconnectAttempts = 0;

                // ✅ NUEVO: Enviar mensajes en cola
                this.flushMessageQueue();

                // ✅ MEJORADO: Copiar callbacks para evitar race conditions
                const callbacks = [...this.callbacks.onOpen];
                callbacks.forEach(callback => {
                    try {
                        callback(event);
                    } catch (error) {
                        console.error('Error en callback onOpen:', error);
                    }
                });
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📦 Mensaje recibido por WebSocket:', data);

                    // ✅ MEJORADO: Copiar callbacks para evitar race conditions
                    const callbacks = [...this.callbacks.onMessage];
                    callbacks.forEach(callback => {
                        try {
                            callback(data);
                        } catch (error) {
                            console.error('Error en callback onMessage:', error);
                        }
                    });
                } catch (error) {
                    console.error('❌ Error al parsear datos del WebSocket:', error);
                    console.log('Datos raw recibidos:', event.data);
                }
            };

            this.ws.onclose = (event) => {
                this.isConnecting = false; // ✅ Liberar lock
                console.log('🔌 WebSocket desconectado. Código:', event.code, 'Razón:', event.reason);

                // ✅ MEJORADO: Copiar callbacks para evitar race conditions
                const callbacks = [...this.callbacks.onClose];
                callbacks.forEach(callback => {
                    try {
                        callback(event);
                    } catch (error) {
                        console.error('Error en callback onClose:', error);
                    }
                });

                // Intentar reconexión automática
                if (this.isEnabled && event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`🔄 Intentando reconectar WebSocket... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                    setTimeout(() => this.connect(), this.reconnectInterval);
                } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    console.log('❌ Máximo de intentos de reconexión WebSocket alcanzado');
                }
            };

            this.ws.onerror = (error) => {
                this.isConnecting = false; // ✅ Liberar lock
                console.error('❌ Error en WebSocket:', error);

                // ✅ MEJORADO: Copiar callbacks para evitar race conditions
                const callbacks = [...this.callbacks.onError];
                callbacks.forEach(callback => {
                    try {
                        callback(error);
                    } catch (err) {
                        console.error('Error en callback onError:', err);
                    }
                });
            };

        } catch (error) {
            this.isConnecting = false; // ✅ Liberar lock en caso de error
            console.error('❌ Error al crear conexión WebSocket:', error);

            const callbacks = [...this.callbacks.onError];
            callbacks.forEach(callback => {
                try {
                    callback(error);
                } catch (err) {
                    console.error('Error en callback onError:', err);
                }
            });
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

    // Métodos para registrar callbacks (API sin cambios)
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

    // ✅ NUEVO: Método para enviar datos con cola
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const jsonData = JSON.stringify(data);
            console.log('📤 Enviando datos por WebSocket:', jsonData);
            this.ws.send(jsonData);
        } else {
            console.warn('⚠️ WebSocket no está conectado, agregando a cola');
            this.messageQueue.push(data);
        }
    }

    // ✅ NUEVO: Enviar mensajes en cola
    flushMessageQueue() {
        if (this.messageQueue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log(`📤 Enviando ${this.messageQueue.length} mensajes en cola`);
            while (this.messageQueue.length > 0) {
                const message = this.messageQueue.shift();
                this.send(message);
            }
        }
    }

    // Verificar estado de conexión (API sin cambios)
    isConnected() {
        return this.isEnabled && this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    // Obtener estado detallado (API sin cambios)
    getConnectionState() {
        if (!this.isEnabled) return 'DISABLED';
        if (this.isConnecting) return 'CONNECTING'; // ✅ Ahora reporta estado de conexión
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

    // Obtener estadísticas (API sin cambios)
    getStats() {
        return {
            url: this.url,
            state: this.getConnectionState(),
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts,
            isConnected: this.isConnected(),
            isEnabled: this.isEnabled,
            queuedMessages: this.messageQueue.length // ✅ NUEVO: Mostrar mensajes en cola
        };
    }
}

// Exportar instancia singleton (API sin cambios)
export const websocketService = new WebSocketService();