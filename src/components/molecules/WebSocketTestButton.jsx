// src/components/molecules/WebSocketTestButton.jsx
import { useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';

export const WebSocketTestButton = ({ className = '' }) => {
    const [isLoading, setIsLoading] = useState(false);

    const sendTestData = async () => {
        setIsLoading(true);

        try {
            // Datos de prueba que simulan los sensores
            const testData = {
                BME: {
                    temperatura_ambiente: 22.5 + Math.random() * 5,
                    humedad_relativa: 45 + Math.random() * 20
                },
                GSR: {
                    conductancia: 0.5 + Math.random() * 0.3,
                    estado_hidratacion: Math.random() > 0.5 ? "Normal" : "Bajo"
                },
                MLX: {
                    temperatura_corporal: 36.5 + Math.random() * 1.5
                },
                MPU: {
                    aceleracion_x: Math.random() * 2 - 1,
                    aceleracion_y: Math.random() * 2 - 1,
                    aceleracion_z: Math.random() * 2 - 1,
                    pasos: Math.floor(Math.random() * 1000) + 2000,
                    nivel_actividad: Math.random() > 0.6 ? "Alto" : "Moderado"
                }
            };

            // Enviar datos al endpoint del WebSocket
            const response = await fetch('http://localhost:8080/sendData', {  // Cambiado de 3010 a 8080
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testData)
            });

            if (response.ok) {
                console.log('✅ Datos de prueba enviados correctamente');
            } else {
                console.error('❌ Error al enviar datos de prueba');
            }
        } catch (error) {
            console.error('❌ Error al enviar datos de prueba:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={sendTestData}
            disabled={isLoading}
            className={`flex items-center space-x-2 ${className}`}
        >
            <Icon name="activity" size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Enviando...' : 'Enviar Datos de Prueba'}</span>
        </Button>
    );
};