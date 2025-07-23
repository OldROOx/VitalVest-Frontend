// src/components/molecules/WebSocketTestButton.jsx - VERSIÓN CORREGIDA
import { useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';

export const WebSocketTestButton = ({ className = '' }) => {
    const [isLoading, setIsLoading] = useState(false);

    const sendTestData = async () => {
        setIsLoading(true);

        try {
            // Datos de prueba que coinciden con la estructura del backend Go
            const testData = {
                bme280: {
                    temperatura: 22.5 + Math.random() * 15,
                    presion: 1013 + Math.random() * 50,
                    humedad: 45 + Math.random() * 30
                },
                mpu6050: {
                    aceleracion: {
                        x: (Math.random() - 0.5) * 4,
                        y: (Math.random() - 0.5) * 4,
                        z: (Math.random() - 0.5) * 4
                    },
                    giroscopio: {
                        x: (Math.random() - 0.5) * 200,
                        y: (Math.random() - 0.5) * 200,
                        z: (Math.random() - 0.5) * 200
                    }
                },
                mlx90614: {
                    temperatura_ambiente: 20 + Math.random() * 10,
                    temp_objeto: 36 + Math.random() * 2
                }
            };

            console.log('📤 Enviando datos de prueba:', testData);

            // Enviar datos al endpoint del WebSocket
            const response = await fetch('http://localhost:3000/sendData', {
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
                        bme280: {
                            temperatura: 25 + Math.random() * 10,
                            presion: 1013 + Math.random() * 10,
                            humedad: 60 + Math.random() * 20
                        },
                        mlx90614: {
                            temperatura_ambiente: 22 + Math.random() * 5,
                            temp_objeto: 36.5 + Math.random() * 2
                        }
                    };
                    break;

                case 'motion':
                    testData = {
                        mpu6050: {
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
                        }
                    };
                    break;

                case 'extreme':
                    testData = {
                        bme280: {
                            temperatura: 40,
                            presion: 950,
                            humedad: 90
                        },
                        mpu6050: {
                            aceleracion: {
                                x: 3.5,
                                y: -2.8,
                                z: 4.1
                            },
                            giroscopio: {
                                x: 150,
                                y: -120,
                                z: 180
                            }
                        },
                        mlx90614: {
                            temperatura_ambiente: 35,
                            temp_objeto: 39.5
                        }
                    };
                    break;

                default:
                    testData = {
                        bme280: {
                            temperatura: 25 + Math.random() * 10,
                            presion: 1013 + Math.random() * 20,
                            humedad: 50 + Math.random() * 20
                        },
                        mpu6050: {
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
                        },
                        mlx90614: {
                            temperatura_ambiente: 22 + Math.random() * 5,
                            temp_objeto: 36 + Math.random() * 1
                        }
                    };
            }

            const response = await fetch('http://localhost:3000/sendData', {
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
                <br />
                <span className="font-mono">Endpoint: http://localhost:3000/sendData</span>
            </p>
        </div>
    );
};