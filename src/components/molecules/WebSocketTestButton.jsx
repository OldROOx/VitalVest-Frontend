// src/components/molecules/WebSocketTestButton.jsx
import { useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';

export const WebSocketTestButton = ({ className = '' }) => {
    const [isLoading, setIsLoading] = useState(false);

    const sendTestData = async () => {
        setIsLoading(true);

        try {
            // Datos de prueba que coinciden con la nueva estructura del WebSocket
            const testData = {
                temperatura: 22.5 + Math.random() * 15, // Temperatura ambiente/corporal
                presion: 1013 + Math.random() * 50, // Presión atmosférica
                humedad: 45 + Math.random() * 30, // Humedad relativa
                aceleracion: {
                    x: (Math.random() - 0.5) * 4, // Aceleración en X
                    y: (Math.random() - 0.5) * 4, // Aceleración en Y
                    z: (Math.random() - 0.5) * 4  // Aceleración en Z
                },
                giroscopio: {
                    x: (Math.random() - 0.5) * 200, // Velocidad angular en X
                    y: (Math.random() - 0.5) * 200, // Velocidad angular en Y
                    z: (Math.random() - 0.5) * 200  // Velocidad angular en Z
                }
            };

            console.log('📤 Enviando datos de prueba:', testData);

            // Enviar datos al endpoint del WebSocket
            const response = await fetch('http://localhost:8080/sendData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Respuesta del servidor:', result);
                console.log('✅ Datos de prueba enviados correctamente');
            } else {
                const errorText = await response.text();
                console.error('❌ Error del servidor:', response.status, errorText);
            }
        } catch (error) {
            console.error('❌ Error al enviar datos de prueba:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Función para enviar datos específicos de cada tipo de sensor
    const sendSpecificSensorData = async (sensorType) => {
        setIsLoading(true);

        try {
            let testData = {};

            switch (sensorType) {
                case 'temperature':
                    testData = {
                        temperatura: 36.5 + Math.random() * 2, // Temperatura corporal normal
                        presion: 1013 + Math.random() * 10,
                        humedad: 60 + Math.random() * 20
                    };
                    break;

                case 'motion':
                    testData = {
                        temperatura: 25,
                        presion: 1013,
                        humedad: 50,
                        aceleracion: {
                            x: Math.random() * 2 - 1,
                            y: Math.random() * 2 - 1,
                            z: Math.random() * 2 - 1
                        },
                        giroscopio: {
                            x: Math.random() * 100 - 50,
                            y: Math.random() * 100 - 50,
                            z: Math.random() * 100 - 50
                        }
                    };
                    break;

                case 'extreme':
                    testData = {
                        temperatura: 39.5, // Fiebre
                        presion: 950,      // Presión baja
                        humedad: 90,       // Humedad alta
                        aceleracion: {
                            x: 3.5,  // Movimiento intenso
                            y: -2.8,
                            z: 4.1
                        },
                        giroscopio: {
                            x: 150,  // Rotación rápida
                            y: -120,
                            z: 180
                        }
                    };
                    break;

                default:
                    // Datos normales por defecto
                    testData = {
                        temperatura: 25 + Math.random() * 10,
                        presion: 1013 + Math.random() * 20,
                        humedad: 50 + Math.random() * 20,
                        aceleracion: {
                            x: Math.random() - 0.5,
                            y: Math.random() - 0.5,
                            z: Math.random() - 0.5
                        },
                        giroscopio: {
                            x: Math.random() * 50 - 25,
                            y: Math.random() * 50 - 25,
                            z: Math.random() * 50 - 25
                        }
                    };
            }

            const response = await fetch('http://localhost:8080/sendData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testData)
            });

            if (response.ok) {
                console.log(`✅ Datos ${sensorType} enviados correctamente`);
            } else {
                console.error(`❌ Error al enviar datos ${sensorType}`);
            }
        } catch (error) {
            console.error(`❌ Error al enviar datos ${sensorType}:`, error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`flex flex-col space-y-2 ${className}`}>
            {/* Botón principal */}
            <Button
                variant="outline"
                onClick={sendTestData}
                disabled={isLoading}
                className="flex items-center space-x-2"
            >
                <Icon name="activity" size={16} className={isLoading ? 'animate-spin' : ''} />
                <span>{isLoading ? 'Enviando...' : 'Enviar Datos de Prueba'}</span>
            </Button>

            {/* Botones específicos */}
            <div className="flex space-x-2">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => sendSpecificSensorData('temperature')}
                    disabled={isLoading}
                    className="text-xs"
                >
                    🌡️ Temp
                </Button>

                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => sendSpecificSensorData('motion')}
                    disabled={isLoading}
                    className="text-xs"
                >
                    🏃 Movimiento
                </Button>

                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => sendSpecificSensorData('extreme')}
                    disabled={isLoading}
                    className="text-xs"
                >
                    ⚠️ Extremo
                </Button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
                Envía datos de prueba al WebSocket para ver las gráficas en tiempo real
            </p>
        </div>
    );
};