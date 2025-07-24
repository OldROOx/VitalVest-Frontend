// src/services/apiService.js - CONFIGURADO PARA TU BACKEND
const API_BASE_URL = 'https://vivaltest-back.namixcode.cc';

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
    startPolling(intervalMs = 3000) {
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

    // Obtener todos los datos - ADAPTADO A TU ESTRUCTURA
    async fetchAllData() {
        try {
            const sensorData = await this.getAllSensorData();
            const users = await this.getUsers();

            if (sensorData) {
                const transformedData = this.transformSensorData(sensorData);

                this.lastData = {
                    sensors: transformedData,
                    users: users,
                    timestamp: new Date().toISOString()
                };

                this.callbacks.onData.forEach(callback => {
                    callback(this.lastData);
                });

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

    // BME280 - Con autenticación
    async getBMEData() {
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };

            // Solo agregar Authorization si tenemos token
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/bme`, { headers });
            if (!response.ok) throw new Error(`BME HTTP ${response.status}`);
            const result = await response.json();
            return result.BME || [];
        } catch (error) {
            console.error('Error obteniendo datos BME:', error);
            return [];
        }
    }

    // GSR - Con autenticación
    async getGSRData() {
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/gsr`, { headers });
            if (!response.ok) throw new Error(`GSR HTTP ${response.status}`);
            const result = await response.json();
            return result.GSR || [];
        } catch (error) {
            console.error('Error obteniendo datos GSR:', error);
            return [];
        }
    }

    // MLX90614 - Con autenticación
    async getMLXData() {
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/mlx`, { headers });
            if (!response.ok) throw new Error(`MLX HTTP ${response.status}`);
            const result = await response.json();
            return result.MLX || [];
        } catch (error) {
            console.error('Error obteniendo datos MLX:', error);
            return [];
        }
    }

    // MPU6050 - Con autenticación
    async getMPUData() {
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/mpu`, { headers });
            if (!response.ok) throw new Error(`MPU HTTP ${response.status}`);
            const result = await response.json();
            return result.MPU || [];
        } catch (error) {
            console.error('Error obteniendo datos MPU:', error);
            return [];
        }
    }

    // Usuarios - Con autenticación
    async getUsers() {
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/users`, { headers });
            if (!response.ok) throw new Error(`Users HTTP ${response.status}`);
            const users = await response.json();
            return users || [];
        } catch (error) {
            console.error('Error obteniendo usuarios:', error);
            return [];
        }
    }

    // Transformar datos según tu estructura
    transformSensorData(sensorData) {
        const { BME, GSR, MLX, MPU } = sensorData;

        const latestBME = BME && BME.length > 0 ? BME[BME.length - 1] : null;
        const latestGSR = GSR && GSR.length > 0 ? GSR[GSR.length - 1] : null;
        const latestMLX = MLX && MLX.length > 0 ? MLX[MLX.length - 1] : null;
        const latestMPU = MPU && MPU.length > 0 ? MPU[MPU.length - 1] : null;

        return {
            current: {
                // BME280 - temperatura, humedad, presion
                temperatura_ambiente: latestBME?.temperatura || null,
                humedad_relativa: latestBME?.humedad || null,
                presion: latestBME?.presion || null,

                // GSR - conductancia, estado_hidratacion
                conductancia: latestGSR?.conductancia || null,
                estado_hidratacion: latestGSR?.estado_hidratacion || null,

                // MLX90614 - temperatura_objeto
                temperatura_corporal: latestMLX?.temperatura_objeto || null,

                // MPU6050 - pasos, fecha
                pasos: latestMPU?.pasos || null,
                fecha_actividad: latestMPU?.fecha || null
            },
            history: {
                BME: BME || [],
                GSR: GSR || [],
                MLX: MLX || [],
                MPU: MPU || []
            },
            stats: this.calculateStats(sensorData)
        };
    }

    // Calcular estadísticas
    calculateStats(sensorData) {
        const { BME, GSR, MLX, MPU } = sensorData;

        const mlxTemps = MLX?.map(d => d.temperatura_objeto).filter(t => t != null) || [];
        const avgBodyTemp = mlxTemps.length > 0 ?
            mlxTemps.reduce((a, b) => a + b, 0) / mlxTemps.length : null;

        const totalSteps = MPU?.reduce((total, d) => total + (d.pasos || 0), 0) || 0;

        const bmeTemps = BME?.map(d => d.temperatura).filter(t => t != null) || [];
        const avgAmbientTemp = bmeTemps.length > 0 ?
            bmeTemps.reduce((a, b) => a + b, 0) / bmeTemps.length : null;

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

    // Crear nuevos registros - CON AUTENTICACIÓN
    async createBME(data) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/bme`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    temperatura: data.temperatura,
                    humedad: data.humedad,
                    presion: data.presion
                })
            });
            if (!response.ok) throw new Error(`Error creando BME: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error creando BME:', error);
            throw error;
        }
    }

    async createGSR(data) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/gsr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    conductancia: data.conductancia,
                    estado_hidratacion: data.estado_hidratacion
                })
            });
            if (!response.ok) throw new Error(`Error creando GSR: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error creando GSR:', error);
            throw error;
        }
    }

    async createMLX(data) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/mlx`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    temperatura_ambiente: data.temperatura_ambiente,
                    temperatura_objeto: data.temperatura_objeto
                })
            });
            if (!response.ok) throw new Error(`Error creando MLX: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error creando MLX:', error);
            throw error;
        }
    }

    async createMPU(data) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/mpu`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    pasos: data.pasos
                })
            });
            if (!response.ok) throw new Error(`Error creando MPU: ${response.status}`);
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

    getLastData() {
        return this.lastData;
    }

    isPollingActive() {
        return this.isPolling;
    }
}

export const apiService = new ApiService();