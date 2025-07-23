// src/components/molecules/TestWebSocketButton.jsx - PARA TU API GO
import { useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';

export const TestWebSocketButton = ({ className = '' }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [lastResponse, setLastResponse] = useState(null);

    const sendTestData = async () => {
        setIsLoading(true);

        try {
            // Datos de prueba que coinciden exactamente con tu estructura Go
            // Basado en tu domain/Sensors.go
            const testData = {
                temperatura: 22.5 + Math.random() * 15, // Temperatura
                presion: 1013 + Math.random() * 50,     // Presión
                humedad: 45 + Math.random() * 30,       // Humedad
                aceleracion: {
                    x: (Math.random() - 0.5) * 4,       // Aceleración en X
                    y: (Math.random() - 0.5) * 4,       // Aceleración en Y
                    z: (Math.random() - 0.5) * 4        // Aceleración en Z
                },
                giroscopio: {
                    x: (Math.random() - 0.5) * 200,     // Velocidad angular en X
                    y: (Math.random() - 0.5) * 200,     // Velocidad angular en Y
                    z: (Math.random() - 0.5) * 200      // Velocidad angular en Z
                }
            };

            console.log('📤 Enviando datos de prueba a tu API Go:', testData);

            // Enviar datos a TU endpoint Go
            const response = await fetch('http://localhost:8080/sendData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Respuesta de tu servidor Go:', result);
                setLastResponse(`✅ Éxito: ${result.message || 'Datos enviados'}`);
            } else {
                const errorText = await response.text();
                console.error('❌ Error del servidor Go:', response.status, errorText);
                setLastResponse(`❌ Error ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error('❌ Error al conectar con tu API Go:', error);
            setLastResponse(`❌ Error de conexión: ${error.message}`);
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
                        temperatura: 36.5 + Math.random() * 2, // Temperatura corporal
                        presion: 1013 + Math.random() * 10,
                        humedad: 60 + Math.random() * 20,
                        aceleracion: { x: 0, y: 0, z: 0 },
                        giroscopio: { x: 0, y: 0, z: 0 }
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
                        temperatura: 39.5, // Fiebre alta
                        presion: 950,      // Presión baja
                        humedad: 90,       // Humedad muy alta
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
                const result = await response.json();
                console.log(`✅ Datos ${sensorType} enviados correctamente:`, result);
                setLastResponse(`✅ ${sensorType}: ${result.message || 'Enviado'}`);
            } else {
                console.error(`❌ Error al enviar datos ${sensorType}:`, response.status);
                setLastResponse(`❌ Error ${sensorType}: ${response.status}`);
            }
        } catch (error) {
            console.error(`❌ Error al enviar datos ${sensorType}:`, error);
            setLastResponse(`❌ Error ${sensorType}: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Verificar estado del WebSocket
    const checkWebSocketStatus = async () => {
        try {
            const response = await fetch('http://localhost:8080/ws-status');
            if (response.ok) {
                const status = await response.json();
                console.log('📊 Estado del WebSocket:', status);
                setLastResponse(`📊 ${status.clients_connected} clientes conectados`);
            }
        } catch (error) {
            console.error('❌ Error al verificar estado WebSocket:', error);
            setLastResponse(`❌ Error verificando WebSocket: ${error.message}`);
        }
    };

    return (
        <div className={`flex flex-col space-y-3 ${className}`}>
            {/* Título */}
            <h4 className="font-medium text-gray-800">Pruebas WebSocket API Go</h4>

            {/* Botón principal */}
            <Button
                variant="primary"
                onClick={sendTestData}
                disabled={isLoading}
                className="flex items-center space-x-2"
            >
                <Icon name="activity" size={16} className={isLoading ? 'animate-spin' : ''} />
                <span>{isLoading ? 'Enviando...' : 'Enviar Datos Aleatorios'}</span>
            </Button>

            {/* Botones específicos */}
            <div className="grid grid-cols-2 gap-2">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => sendSpecificSensorData('temperature')}
                    disabled={isLoading}
                    className="text-xs"
                >
                    🌡️ Temperatura
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
                    ⚠️ Valores Extremos
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={checkWebSocketStatus}
                    disabled={isLoading}
                    className="text-xs"
                >
                    📊 Estado WS
                </Button>
            </div>

            {/* Resultado */}
            {lastResponse && (
                <div className="p-2 bg-gray-100 rounded text-xs">
                    <p className="font-mono">{lastResponse}</p>
                </div>
            )}

            <div className="text-xs text-gray-500 space-y-1">
                <p>✅ Conecta a tu API Go en localhost:8080</p>
                <p>📡 WebSocket: ws://localhost:8080/ws</p>
                <p>📤 Endpoint: POST /sendData</p>
                <p>🔍 Estado: GET /ws-status</p>
            </div>
        </div>
    );
};