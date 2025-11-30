// public/sharedWorker.js
console.log('🚀 Shared Worker iniciado');

// Estado compartido entre todas las pestañas
let state = {
    websocket: null,
    apiPolling: null,
    connections: new Set(), // Pestañas conectadas
    sensorData: {},
    isWebSocketConnected: false,
    isApiPolling: false
};

// Configuración
const CONFIG = {
    WS_URL: 'ws://100.28.244.240:3000/ws',
    API_BASE_URL: 'https://vivaltest-back.namixcode.cc',
    POLLING_INTERVAL: 3000,
    MAX_RECONNECT_ATTEMPTS: 5,
    RECONNECT_INTERVAL: 3000
};

let reconnectAttempts = 0;

// ============================================
// WEBSOCKET
// ============================================
function connectWebSocket() {
    if (state.websocket) {
        console.log('⚠️ WebSocket ya existe, cerrando anterior...');
        state.websocket.close();
    }

    try {
        console.log('🔌 Conectando WebSocket desde Shared Worker...');
        state.websocket = new WebSocket(CONFIG.WS_URL);

        state.websocket.onopen = () => {
            console.log('✅ WebSocket conectado en Shared Worker');
            state.isWebSocketConnected = true;
            reconnectAttempts = 0;
            broadcastToAll({
                type: 'WS_STATUS',
                connected: true
            });
        };

        state.websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📦 Datos WebSocket recibidos:', data);

                state.sensorData = {
                    ...state.sensorData,
                    ...data,
                    timestamp: new Date().toISOString()
                };

                broadcastToAll({
                    type: 'WS_DATA',
                    data: state.sensorData
                });
            } catch (error) {
                console.error('❌ Error parseando WebSocket:', error);
            }
        };

        state.websocket.onclose = (event) => {
            console.log('🔌 WebSocket cerrado. Código:', event.code);
            state.isWebSocketConnected = false;

            broadcastToAll({
                type: 'WS_STATUS',
                connected: false
            });

            // Reconexión automática
            if (event.code !== 1000 && reconnectAttempts < CONFIG.MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                console.log(`🔄 Reconectando... (${reconnectAttempts}/${CONFIG.MAX_RECONNECT_ATTEMPTS})`);
                setTimeout(connectWebSocket, CONFIG.RECONNECT_INTERVAL);
            }
        };

        state.websocket.onerror = (error) => {
            console.error('❌ Error WebSocket:', error);
            broadcastToAll({
                type: 'WS_ERROR',
                error: 'Error de conexión WebSocket'
            });
        };
    } catch (error) {
        console.error('❌ Error creando WebSocket:', error);
    }
}

function disconnectWebSocket() {
    if (state.websocket) {
        console.log('🔌 Desconectando WebSocket...');
        state.websocket.close(1000, 'Cerrado manualmente');
        state.websocket = null;
        state.isWebSocketConnected = false;
    }
}

// ============================================
// API POLLING
// ============================================
async function fetchApiData() {
    try {
        const token = state.authToken; // Se establecerá desde las pestañas

        if (!token) {
            console.warn('⚠️ No hay token de autenticación');
            return;
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // Peticiones paralelas a todos los endpoints
        const [bmeRes, gsrRes, mlxRes, mpuRes] = await Promise.allSettled([
            fetch(`${CONFIG.API_BASE_URL}/bme`, { headers }),
            fetch(`${CONFIG.API_BASE_URL}/gsr`, { headers }),
            fetch(`${CONFIG.API_BASE_URL}/mlx`, { headers }),
            fetch(`${CONFIG.API_BASE_URL}/mpu`, { headers })
        ]);

        const apiData = {
            BME: bmeRes.status === 'fulfilled' && bmeRes.value.ok
                ? await bmeRes.value.json() : null,
            GSR: gsrRes.status === 'fulfilled' && gsrRes.value.ok
                ? await gsrRes.value.json() : null,
            MLX: mlxRes.status === 'fulfilled' && mlxRes.value.ok
                ? await mlxRes.value.json() : null,
            MPU: mpuRes.status === 'fulfilled' && mpuRes.value.ok
                ? await mpuRes.value.json() : null,
            timestamp: new Date().toISOString()
        };

        console.log('📊 Datos API obtenidos:', apiData);

        broadcastToAll({
            type: 'API_DATA',
            data: apiData
        });

    } catch (error) {
        console.error('❌ Error en API polling:', error);
        broadcastToAll({
            type: 'API_ERROR',
            error: error.message
        });
    }
}

function startApiPolling(interval = CONFIG.POLLING_INTERVAL) {
    if (state.apiPolling) {
        console.log('⚠️ Polling ya está activo');
        return;
    }

    console.log('🔄 Iniciando API polling cada', interval, 'ms');
    state.isApiPolling = true;

    // Primera petición inmediata
    fetchApiData();

    // Polling periódico
    state.apiPolling = setInterval(() => {
        fetchApiData();
    }, interval);
}

function stopApiPolling() {
    if (state.apiPolling) {
        console.log('⏹️ Deteniendo API polling');
        clearInterval(state.apiPolling);
        state.apiPolling = null;
        state.isApiPolling = false;
    }
}

// ============================================
// COMUNICACIÓN CON PESTAÑAS
// ============================================
function broadcastToAll(message) {
    state.connections.forEach(port => {
        try {
            port.postMessage(message);
        } catch (error) {
            console.error('❌ Error enviando mensaje a pestaña:', error);
        }
    });
}

// Manejar nuevas conexiones de pestañas
self.onconnect = (event) => {
    const port = event.ports[0];
    state.connections.add(port);

    console.log(`📱 Nueva pestaña conectada. Total: ${state.connections.size}`);

    // Enviar estado actual a la nueva pestaña
    port.postMessage({
        type: 'WORKER_READY',
        state: {
            isWebSocketConnected: state.isWebSocketConnected,
            isApiPolling: state.isApiPolling,
            sensorData: state.sensorData,
            connections: state.connections.size
        }
    });

    port.onmessage = (e) => {
        const { type, data } = e.data;
        console.log('📨 Mensaje recibido de pestaña:', type, data);

        switch (type) {
            case 'START_WEBSOCKET':
                connectWebSocket();
                break;

            case 'STOP_WEBSOCKET':
                disconnectWebSocket();
                break;

            case 'START_API_POLLING':
                startApiPolling(data?.interval);
                break;

            case 'STOP_API_POLLING':
                stopApiPolling();
                break;

            case 'SET_AUTH_TOKEN':
                state.authToken = data?.token;
                console.log('🔐 Token de autenticación actualizado');
                break;

            case 'GET_STATE':
                port.postMessage({
                    type: 'STATE_UPDATE',
                    state: {
                        isWebSocketConnected: state.isWebSocketConnected,
                        isApiPolling: state.isApiPolling,
                        sensorData: state.sensorData,
                        connections: state.connections.size
                    }
                });
                break;

            case 'PING':
                port.postMessage({ type: 'PONG' });
                break;

            default:
                console.warn('⚠️ Tipo de mensaje desconocido:', type);
        }
    };

    port.start();

    // Limpiar cuando la pestaña se desconecta
    port.onmessageerror = () => {
        console.log('❌ Error en puerto de pestaña');
        state.connections.delete(port);
    };
};

// ============================================
// INICIALIZACIÓN
// ============================================
console.log('✅ Shared Worker listo para recibir conexiones');