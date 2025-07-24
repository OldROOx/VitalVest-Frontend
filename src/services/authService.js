const API_BASE_URL = 'https://vivaltest-back.namixcode.cc';

export const authService = {
    async login(credentials) {
        try {
            console.log('Intentando login con:', credentials.email);

            const response = await fetch(`${API_BASE_URL}/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: credentials.email,
                    password: credentials.password
                })
            });

            const data = await response.json();
            console.log('Respuesta del servidor:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Error en el login');
            }

            if (data && Array.isArray(data) && data.length > 0) {
                const userData = data[0];
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('isAuthenticated', 'true');

                return {
                    success: true,
                    user: userData
                };
            } else {
                throw new Error('Credenciales incorrectas');
            }
        } catch (error) {
            console.error('Error en login:', error);
            return {
                success: false,
                error: error.message || 'Error de conexión con el servidor'
            };
        }
    },

    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('token');
    },

    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated() {
        return localStorage.getItem('isAuthenticated') === 'true';
    },

    getToken() {
        return localStorage.getItem('token');
    }
};