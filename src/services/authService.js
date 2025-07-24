// Servicio para manejar autenticación con la API
const API_BASE_URL = 'http://localhost:8080'; // URL de tu API Go

export const authService = {
    async login(credentials) {
        // 🔓 MODO DESARROLLO - BYPASS LOGIN
        console.log('🔓 Login bypass activado para desarrollo');

        // Simular usuario válido
        const userData = {
            id: 1,
            username: credentials.email || 'admin',
            name: 'Usuario de Prueba'
        };

        // Guardar en localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isAuthenticated', 'true');

        return {
            success: true,
            user: userData
        };
    },

    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
    },

    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated() {
        return localStorage.getItem('isAuthenticated') === 'true';
    }
};