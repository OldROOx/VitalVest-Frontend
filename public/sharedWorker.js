// public/sharedWorker.js - ARCHIVO NUEVO (faltaba)
// Este archivo es necesario para que useSharedWorker funcione
// Sin él, cada pestaña crea su propia conexión WebSocket

let ws = null;
let apiPollingInterval = null;
let authToken = null;
let connections = new Set();

let state = {
    isWebSocketConnected: false,
    isApiPolling: false,
    sensorData: {},
    lastUpdate: null,
    connections: 0
};

function safeBroadcast(message) {
    const connectionsCopy = Array.from(connections);
    connectionsCopy.forEach(port => {
        try {
            port.postMessage(message);
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            connections.delete(port);
        }
    });
}

function startWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('⚠️ WebSocket ya está conectado');
        return;
    }

    console.log('🔌 Shared Worker: Iniciando WebSocket...');
    ws = new WebSocket('ws://100.30.168.141:3000/ws');

    ws.onopen = () => {
        state.isWebSocketConnected = true;
        safeBroadcast({ type: 'WS_STATUS', connected: true });
        console.log('✅ Shared Worker: WebSocket conectado');
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            state.sensorData = data;
            state.lastUpdate = new Date().toISOString();
            safeBroadcast({ type: 'WS_DATA', data: data, timestamp: state.lastUpdate });
        } catch (error) {
            console.error('Error parseando mensaje WebSocket:', error);
        }
    };

    ws.onclose = () => {
        state.isWebSocketConnected = false;
        safeBroadcast({ type: 'WS_STATUS', connected: false });
        console.log('🔴 Shared Worker: WebSocket desconectado');
    };

    ws.onerror = (error) => {
        safeBroadcast({ type: 'WS_ERROR', error: 'Error de conexión WebSocket' });
        console.error('❌ Error WebSocket:', error);
    };
}

function stopWebSocket() {
    if (ws) {
        ws.close();
        ws = null;
        state.isWebSocketConnected = false;
    }
}

async function startApiPolling(interval = 3000) {
    if (state.isApiPolling) {
        console.log('⚠️ API Polling ya está activo');
        return;
    }

    state.isApiPolling = true;

    const fetchData = async () => {
        if (!authToken) return;

        try {
            const [bme, gsr, mlx, mpu] = await Promise.allSettled([
                fetch('http://100.30.168.141:8080/bme', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                }),
                fetch('http://100.30.168.141:8080/gsr', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                }),
                fetch('http://100.30.168.141:8080/mlx', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                }),
                fetch('http://100.30.168.141:8080/mpu', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                })
            ]);

            const apiData = {
                BME: bme.status === 'fulfilled' && bme.value.ok ? await bme.value.json() : null,
                GSR: gsr.status === 'fulfilled' && gsr.value.ok ? await gsr.value.json() : null,
                MLX: mlx.status === 'fulfilled' && mlx.value.ok ? await mlx.value.json() : null,
                MPU: mpu.status === 'fulfilled' && mpu.value.ok ? await mpu.value.json() : null
            };

            safeBroadcast({ type: 'API_DATA', data: apiData, timestamp: new Date().toISOString() });
        } catch (error) {
            safeBroadcast({ type: 'API_ERROR', error: error.message });
        }
    };

    fetchData();
    apiPollingInterval = setInterval(fetchData, interval);
}

function stopApiPolling() {
    if (apiPollingInterval) {
        clearInterval(apiPollingInterval);
        apiPollingInterval = null;
        state.isApiPolling = false;
    }
}

self.onconnect = (event) => {
    const port = event.ports[0];
    connections.add(port);

    console.log(`📊 Nueva conexión. Total: ${connections.size}`);

    port.postMessage({
        type: 'WORKER_READY',
        state: { ...state, connections: connections.size }
    });

    port.onmessage = (e) => {
        const { type, data } = e.data;

        switch (type) {
            case 'START_WEBSOCKET':
                startWebSocket();
                break;
            case 'STOP_WEBSOCKET':
                stopWebSocket();
                break;
            case 'START_API_POLLING':
                startApiPolling(data?.interval || 3000);
                break;
            case 'STOP_API_POLLING':
                stopApiPolling();
                break;
            case 'SET_AUTH_TOKEN':
                authToken = data?.token;
                break;
            case 'GET_STATE':
                port.postMessage({
                    type: 'STATE_UPDATE',
                    state: { ...state, connections: connections.size }
                });
                break;
            case 'PING':
                port.postMessage({ type: 'PONG' });
                break;
        }
    };

    port.start();
};