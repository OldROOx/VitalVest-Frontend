// Componente de Debug para WebSocket - Agregar temporalmente al Dashboard
// Para diagnosticar qué datos están llegando exactamente

export const WebSocketDebugger = ({ sensorData, lastMessage }) => {
    return (
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
            <h3 className="text-white font-bold mb-3">🔍 DEBUG WEBSOCKET</h3>

            <div className="space-y-3">
                <div>
                    <h4 className="text-yellow-400 font-semibold">📨 Último mensaje crudo:</h4>
                    <pre className="bg-gray-800 p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(lastMessage, null, 2)}
                    </pre>
                </div>

                <div>
                    <h4 className="text-yellow-400 font-semibold">🏷️ SensorData procesado:</h4>
                    <pre className="bg-gray-800 p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(sensorData, null, 2)}
                    </pre>
                </div>

                <div>
                    <h4 className="text-yellow-400 font-semibold">✅ Sensores con datos:</h4>
                    <ul className="list-disc list-inside text-xs">
                        {sensorData?.temperatura !== null && (
                            <li className="text-green-400">BME280 Temperatura: {sensorData.temperatura}°C</li>
                        )}
                        {sensorData?.humedad !== null && (
                            <li className="text-green-400">BME280 Humedad: {sensorData.humedad}%</li>
                        )}
                        {sensorData?.presion !== null && (
                            <li className="text-green-400">BME280 Presión: {sensorData.presion} hPa</li>
                        )}
                        {sensorData?.temperatura_objeto !== null && (
                            <li className="text-green-400">MLX90614 Temp Corporal: {sensorData.temperatura_objeto}°C</li>
                        )}
                        {sensorData?.pasos !== null && (
                            <li className="text-green-400">MPU6050 Pasos: {sensorData.pasos}</li>
                        )}
                        {sensorData?.conductancia !== null && (
                            <li className="text-green-400">GSR Conductancia: {sensorData.conductancia}</li>
                        )}
                    </ul>
                </div>

                <div>
                    <h4 className="text-yellow-400 font-semibold">❌ Sensores SIN datos:</h4>
                    <ul className="list-disc list-inside text-xs">
                        {sensorData?.temperatura === null && (
                            <li className="text-red-400">BME280 Temperatura: NULL</li>
                        )}
                        {sensorData?.temperatura_objeto === null && (
                            <li className="text-red-400">MLX90614 Temp Corporal: NULL</li>
                        )}
                        {sensorData?.pasos === null && (
                            <li className="text-red-400">MPU6050 Pasos: NULL</li>
                        )}
                        {sensorData?.conductancia === null && (
                            <li className="text-red-400">GSR Conductancia: NULL</li>
                        )}
                    </ul>
                </div>

                <div>
                    <h4 className="text-yellow-400 font-semibold">🕐 Última actualización:</h4>
                    <p className="text-xs">
                        {lastMessage?.timestamp ? new Date(lastMessage.timestamp).toLocaleString() : 'No hay timestamp'}
                    </p>
                </div>
            </div>
        </div>
    );
};