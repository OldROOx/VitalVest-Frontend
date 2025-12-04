// src/services/authService.js - CORREGIDO PARA TU BACKEND
const API_BASE_URL = 'http://100.30.168.141:8080';

export const authService = {
    async login(credentials) {
        try {
            console.log('🔐 Intentando login con:', credentials.email);

            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: credentials.email,
                    passwords: credentials.password
                })
            });

            console.log('📡 Respuesta del servidor - Status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Error de conexión' }));
                throw new Error(errorData.error || `Error HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Login exitoso. Datos recibidos:', data);

            // Tu backend devuelve: { "token": "jwt_token", "user": {...} }
            if (data && data.token && data.user) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('isAuthenticated', 'true');

                console.log('💾 Token y usuario guardados en localStorage');

                return {
                    success: true,
                    user: data.user,
                    token: data.token
                };
            } else {
                throw new Error('Respuesta del servidor inválida');
            }

        } catch (error) {
            console.error('❌ Error en login:', error);
            return {
                success: false,
                error: error.message || 'Error de conexión con el servidor'
            };
        }
    },

    logout() {
        console.log('🚪 Cerrando sesión...');
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('token');
        console.log('✅ Sesión cerrada correctamente');
    },

    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated() {
        const isAuth = localStorage.getItem('isAuthenticated') === 'true';
        const token = localStorage.getItem('token');
        return isAuth && token !== null;
    },

    getToken() {
        return localStorage.getItem('token');
    }
};