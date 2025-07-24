// src/services/authService.js - CONFIGURADO PARA TU BACKEND CON JWT
const API_BASE_URL = 'https://vivaltest-back.namixcode.cc';

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
                    passwords: credentials.password  // Tu backend usa "passwords" no "password"
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
                // Guardar token JWT y datos del usuario
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('isAuthenticated', 'true');

                console.log('💾 Token y usuario guardados en localStorage');

                return {
                    success: true,
                    user: data.user,
                    token: data.token
                };
            } else if (Array.isArray(data) && data.length > 0) {
                // Si tu backend devuelve un array como el código Go que veo
                const userData = data[0];

                // Simular token ya que tu backend actual no parece devolverlo
                const fakeToken = btoa(JSON.stringify({ user: userData.username, exp: Date.now() + 86400000 }));

                localStorage.setItem('token', fakeToken);
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('isAuthenticated', 'true');

                console.log('💾 Usuario guardado en localStorage (sin JWT real)');

                return {
                    success: true,
                    user: userData,
                    token: fakeToken
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

        // Verificar que tenemos tanto la flag como el token
        return isAuth && token !== null;
    },

    getToken() {
        return localStorage.getItem('token');
    },

    // Verificar si el token está expirado (opcional)
    isTokenExpired() {
        const token = this.getToken();
        if (!token) return true;

        try {
            // Decodificar JWT básico (sin librerías)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;

            return payload.exp < currentTime;
        } catch (error) {
            console.error('Error verificando expiración del token:', error);
            return true;
        }
    },

    // Renovar token automáticamente si es necesario
    async refreshTokenIfNeeded() {
        if (this.isTokenExpired()) {
            console.log('🔄 Token expirado, cerrando sesión...');
            this.logout();
            return false;
        }
        return true;
    }
};