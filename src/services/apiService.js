// src/services/apiService.js
const API_BASE_URL = 'http://localhost:8080';

class ApiService {
    constructor() {
        this.isPolling = false;
        this.pollingInterval = null;
        this.callbacks = {
            onData: [],
            onError: [],
            onConnection: []
        };
        this.lastData = null;
    }

    // Métodos para registrar callbacks
    onData(callback) {
        this.callbacks.onData.push(callback);
    }

    onError(callback) {
        this.callbacks.onError.push(callback);
    }

    onConnection(callback) {
        this.callbacks.onConnection.push(callback);
    }

    // Iniciar polling automático
    startPolling(intervalMs = 2000) {
        if (this.isPolling) return;

        this.isPolling = true;
        console.log('🚀 Iniciando polling de API cada', intervalMs, 'ms');

        // Obtener datos inmediatamente
        this.fetchAllData();

        // Configurar intervalo
        this.pollingInterval = setInterval(() => {
            this.fetchAllData();
        }, intervalMs);
    }

    // Detener polling
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.isPolling = false;
        console.log('⏹️ Polling de API detenido');
    }

    // Obtener todos los datos y notificar a los componentes
    async fetchAllData() {
        try {
            const sensorData = await this.getAllSensorData();
            const users = await this.getUsers();

            if (sensorData) {
                // Transformar datos al formato esperado por el frontend
                const transformedData = this.transformSensorData(sensorData);

                // Actualizar cache local
                this.lastData = {
                    sensors: transformedData,
                    users: users,
                    timestamp: new Date().toISOString()
                };

                // Notificar a todos los componentes suscritos
                this.callbacks.onData.forEach(callback => {
                    callback(this.lastData);
                });

                // Notificar estado de conexión
                this.callbacks.onConnection.forEach(callback => {
                    callback(true);
                });
            }
        } catch (error) {
            console.error('❌ Error en fetchAllData:', error);
            this.callbacks.onError.forEach(callback => callback(error));
            this.callbacks.onConnection.forEach(callback => callback(false));
        }
    }

    // Obtener datos de todos los sensores
    async getAllSensorData() {
        try {
            const [bmeData, gsrData, mlxData, mpuData] = await Promise.all([
                this.getBMEData(),
                this.getGSRData(),
                this.getMLXData(),
                this.getMPUData()
            ]);

            return {
                BME: bmeData,
                GSR: gsrData,
                MLX: mlxData,
                MPU: mpuData
            };
        } catch (error) {
            console.error('Error obteniendo datos de sensores:', error);
            throw error;
        }
    }

    // Obtener datos del sensor BME280
    async getBMEData() {
        try {
            const response = await fetch(`${API_BASE_URL}/bme`);
            if (!response.ok) throw new Error(`BME HTTP ${response.status}`);
            const result = await response.json();
            return result.BME || [];
        } catch (error) {
            console.error('Error obteniendo datos BME:', error);
            return [];
        }
    }

    // Obtener datos del sensor GSR
    async getGSRData() {
        try {
            const response = await fetch(`${API_BASE_URL}/gsr`);
            if (!response.ok) throw new Error(`GSR HTTP ${response.status}`);
            const result = await response.json();
            return result.GSR || [];
        } catch (error) {
            console.error('Error obteniendo datos GSR:', error);
            return [];
        }
    }

    // Obtener datos del sensor MLX90614
    async getMLXData() {
        try {
            const response = await fetch(`${API_BASE_URL}/mlx`);
            if (!response.ok) throw new Error(`MLX HTTP ${response.status}`);
            const result = await response.json();
            return result.MLX || [];
        } catch (error) {
            console.error('Error obteniendo datos MLX:', error);
            return [];
        }
    }

    // Obtener datos del sensor MPU6050
    async getMPUData() {
        try {
            const response = await fetch(`${API_BASE_URL}/mpu`);
            if (!response.ok) throw new Error(`MPU HTTP ${response.status}`);
            const result = await response.json();
            return result.MPU || [];
        } catch (error) {
            console.error('Error obteniendo datos MPU:', error);
            return [];
        }
    }

    // Obtener usuarios
    async getUsers() {
        try {
            const response = await fetch(`${API_BASE_URL}/users`);
            if (!response.ok) throw new Error(`Users HTTP ${response.status}`);
            const users = await response.json();
            return users || [];
        } catch (error) {
            console.error('Error obteniendo usuarios:', error);
            return [];
        }
    }

    // Transformar datos de sensores al formato esperado por el frontend
    transformSensorData(sensorData) {
        const { BME, GSR, MLX, MPU } = sensorData;

        // Obtener los datos más recientes de cada sensor
        const latestBME = BME && BME.length > 0 ? BME[BME.length - 1] : null;
        const latestGSR = GSR && GSR.length > 0 ? GSR[GSR.length - 1] : null;
        const latestMLX = MLX && MLX.length > 0 ? MLX[MLX.length - 1] : null;
        const latestMPU = MPU && MPU.length > 0 ? MPU[MPU.length - 1] : null;

        return {
            // Datos actuales (más recientes)
            current: {
                temperatura_ambiente: latestBME?.temperatura_ambiente || null,
                humedad_relativa: latestBME?.humedad_relativa || null,
                conductancia: latestGSR?.conductancia || null,
                estado_hidratacion: latestGSR?.estado_hidratacion || null,
                temperatura_corporal: latestMLX?.temperatura_corporal || null,
                aceleracion_x: latestMPU?.aceleracion_x || null,
                aceleracion_y: latestMPU?.aceleracion_y || null,
                aceleracion_z: latestMPU?.aceleracion_z || null,
                pasos: latestMPU?.pasos || null,
                nivel_actividad: latestMPU?.nivel_actividad || null
            },
            // Datos históricos para gráficas
            history: {
                BME: BME || [],
                GSR: GSR || [],
                MLX: MLX || [],
                MPU: MPU || []
            },
            // Estadísticas
            stats: this.calculateStats(sensorData)
        };
    }

    // Calcular estadísticas de los datos
    calculateStats(sensorData) {
        const { BME, GSR, MLX, MPU } = sensorData;

        // Estadísticas de temperatura corporal
        const mlxTemps = MLX?.map(d => d.temperatura_corporal).filter(t => t != null) || [];
        const avgBodyTemp = mlxTemps.length > 0 ?
            mlxTemps.reduce((a, b) => a + b, 0) / mlxTemps.length : null;

        // Estadísticas de pasos
        const totalSteps = MPU?.reduce((total, d) => total + (d.pasos || 0), 0) || 0;

        // Estadísticas de temperatura ambiente
        const bmeTemps = BME?.map(d => d.temperatura_ambiente).filter(t => t != null) || [];
        const avgAmbientTemp = bmeTemps.length > 0 ?
            bmeTemps.reduce((a, b) => a + b, 0) / bmeTemps.length : null;

        // Estadísticas de hidratación
        const gsrValues = GSR?.map(d => d.conductancia).filter(c => c != null) || [];
        const avgHydration = gsrValues.length > 0 ?
            (gsrValues.reduce((a, b) => a + b, 0) / gsrValues.length) * 100 : null;

        return {
            bodyTemp: {
                current: mlxTemps.length > 0 ? mlxTemps[mlxTemps.length - 1] : null,
                average: avgBodyTemp,
                min: mlxTemps.length > 0 ? Math.min(...mlxTemps) : null,
                max: mlxTemps.length > 0 ? Math.max(...mlxTemps) : null,
                count: mlxTemps.length
            },
            steps: {
                total: totalSteps,
                count: MPU?.length || 0
            },
            ambientTemp: {
                current: bmeTemps.length > 0 ? bmeTemps[bmeTemps.length - 1] : null,
                average: avgAmbientTemp,
                min: bmeTemps.length > 0 ? Math.min(...bmeTemps) : null,
                max: bmeTemps.length > 0 ? Math.max(...bmeTemps) : null
            },
            hydration: {
                current: gsrValues.length > 0 ? gsrValues[gsrValues.length - 1] * 100 : null,
                average: avgHydration
            }
        };
    }

    // Métodos para obtener datos específicos por ID
    async getBMEById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/bme/${id}`);
            if (!response.ok) throw new Error(`BME by ID HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Error obteniendo BME ${id}:`, error);
            return null;
        }
    }

    async getGSRById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/gsr/${id}`);
            if (!response.ok) throw new Error(`GSR by ID HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Error obteniendo GSR ${id}:`, error);
            return null;
        }
    }

    async getMLXById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/mlx/${id}`);
            if (!response.ok) throw new Error(`MLX by ID HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Error obteniendo MLX ${id}:`, error);
            return null;
        }
    }

    async getMPUById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/mpu/${id}`);
            if (!response.ok) throw new Error(`MPU by ID HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Error obteniendo MPU ${id}:`, error);
            return null;
        }
    }

    // Métodos para crear nuevos registros
    async createBME(data) {
        try {
            const response = await fetch(`${API_BASE_URL}/bme`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creando BME:', error);
            throw error;
        }
    }

    async createGSR(data) {
        try {
            const response = await fetch(`${API_BASE_URL}/gsr`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creando GSR:', error);
            throw error;
        }
    }

    async createMLX(data) {
        try {
            const response = await fetch(`${API_BASE_URL}/mlx`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creando MLX:', error);
            throw error;
        }
    }

    async createMPU(data) {
        try {
            const response = await fetch(`${API_BASE_URL}/mpu`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creando MPU:', error);
            throw error;
        }
    }

    // Verificar estado del servidor
    async checkServerStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/ws-status`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error verificando estado del servidor:', error);
            return null;
        }
    }

    // Obtener datos más recientes
    getLastData() {
        return this.lastData;
    }

    // Verificar si está haciendo polling
    isPollingActive() {
        return this.isPolling;
    }
}

// Exportar instancia singleton
export const apiService = new ApiService();