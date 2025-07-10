export const Chart = ({
                          data,
                          type = 'line',
                          title,
                          className = ''
                      }) => {
    // Gráfico de línea preciso con ejes y sombreado
    if (type === 'line') {
        const maxValue = Math.max(...data.map(d => d.value))
        const minValue = Math.min(...data.map(d => d.value))
        const range = maxValue - minValue || 1

        // Dimensiones del SVG
        const svgWidth = 500
        const svgHeight = 320
        const paddingLeft = 80
        const paddingRight = 30
        const paddingTop = 30
        const paddingBottom = 70
        const chartWidth = svgWidth - paddingLeft - paddingRight
        const chartHeight = svgHeight - paddingTop - paddingBottom

        // Generar ticks para el eje Y
        const yTicks = []
        const tickCount = 6
        for (let i = 0; i <= tickCount; i++) {
            const value = minValue + (range / tickCount) * i
            yTicks.push({
                value: value,
                y: paddingTop + chartHeight - (i / tickCount) * chartHeight,
                label: value.toFixed(1)
            })
        }

        // Calcular puntos de la gráfica
        const points = data.map((item, index) => {
            const x = paddingLeft + (index / (data.length - 1)) * chartWidth
            const y = paddingTop + (1 - (item.value - minValue) / range) * chartHeight
            return { x, y, value: item.value, label: item.label }
        })

        // Crear path para la línea
        const pathData = points.map((point, index) => {
            return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
        }).join(' ')

        // Crear path para el área sombreada
        const areaPath = `${pathData} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${paddingLeft} ${paddingTop + chartHeight} Z`

        return (
            <div className={`p-6 ${className}`}>
                {title && <h3 className="text-lg font-semibold mb-6 text-gray-900">{title}</h3>}

                <div className="relative bg-white rounded-lg border border-gray-200 p-4">
                    <svg
                        width={svgWidth}
                        height={svgHeight}
                        className="w-full h-auto"
                        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    >
                        {/* Definiciones */}
                        <defs>
                            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style={{stopColor: '#3B82F6', stopOpacity: 0.3}} />
                                <stop offset="100%" style={{stopColor: '#3B82F6', stopOpacity: 0.1}} />
                            </linearGradient>
                        </defs>

                        {/* Líneas de cuadrícula horizontal */}
                        {yTicks.map((tick, index) => (
                            <line
                                key={index}
                                x1={paddingLeft}
                                y1={tick.y}
                                x2={paddingLeft + chartWidth}
                                y2={tick.y}
                                stroke="#F3F4F6"
                                strokeWidth="1"
                            />
                        ))}

                        {/* Líneas de cuadrícula vertical */}
                        {points.map((point, index) => (
                            <line
                                key={index}
                                x1={point.x}
                                y1={paddingTop}
                                x2={point.x}
                                y2={paddingTop + chartHeight}
                                stroke="#F3F4F6"
                                strokeWidth="1"
                            />
                        ))}

                        {/* Ejes principales */}
                        <line
                            x1={paddingLeft}
                            y1={paddingTop}
                            x2={paddingLeft}
                            y2={paddingTop + chartHeight}
                            stroke="#6B7280"
                            strokeWidth="2"
                        />
                        <line
                            x1={paddingLeft}
                            y1={paddingTop + chartHeight}
                            x2={paddingLeft + chartWidth}
                            y2={paddingTop + chartHeight}
                            stroke="#6B7280"
                            strokeWidth="2"
                        />

                        {/* Área sombreada */}
                        <path
                            d={areaPath}
                            fill="url(#areaGradient)"
                            stroke="none"
                        />

                        {/* Línea principal */}
                        <path
                            d={pathData}
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Puntos */}
                        {points.map((point, index) => (
                            <g key={index}>
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r="5"
                                    fill="#3B82F6"
                                    stroke="#ffffff"
                                    strokeWidth="2"
                                />
                            </g>
                        ))}

                        {/* Etiquetas del eje Y con °C */}
                        {yTicks.map((tick, index) => (
                            <text
                                key={index}
                                x={paddingLeft - 25}
                                y={tick.y + 5}
                                textAnchor="end"
                                fontSize="12"
                                fill="#6B7280"
                                fontFamily="system-ui, sans-serif"
                            >
                                {tick.label}°C
                            </text>
                        ))}

                        {/* Etiquetas del eje X */}
                        {points.map((point, index) => (
                            <text
                                key={index}
                                x={point.x}
                                y={paddingTop + chartHeight + 25}
                                textAnchor="middle"
                                fontSize="12"
                                fill="#6B7280"
                                fontFamily="system-ui, sans-serif"
                            >
                                {point.label}
                            </text>
                        ))}

                        {/* Título del eje Y */}
                        <text
                            x={8}
                            y={paddingTop + chartHeight / 2}
                            textAnchor="middle"
                            fontSize="13"
                            fill="#374151"
                            fontFamily="system-ui, sans-serif"
                            fontWeight="500"
                            transform={`rotate(-90 8 ${paddingTop + chartHeight / 2})`}
                        >
                            Temperatura Corporal
                        </text>

                        {/* Título del eje X */}
                        <text
                            x={paddingLeft + chartWidth / 2}
                            y={svgHeight - 15}
                            textAnchor="middle"
                            fontSize="13"
                            fill="#374151"
                            fontFamily="system-ui, sans-serif"
                            fontWeight="500"
                        >
                            Hora del Día
                        </text>
                    </svg>
                </div>

                {/* Texto contextual agregado */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">
                        Monitoreo de temperatura corporal durante las últimas 24 horas
                    </p>
                    <p className="text-xs text-gray-500">
                        Rango normal: 36.1°C - 37.2°C | Promedio actual: {(data.reduce((sum, item) => sum + item.value, 0) / data.length).toFixed(1)}°C
                    </p>
                </div>
            </div>
        )
    }

    // Gráfico de barras
    if (type === 'bar') {
        const maxValue = Math.max(...data.map(d => d.value))

        return (
            <div className={`p-6 ${className}`}>
                {title && <h3 className="text-lg font-semibold mb-6 text-gray-900">{title}</h3>}

                <div className="relative h-52 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                    {/* Etiquetas del eje Y con unidades */}
                    <div className="absolute left-8 top-4 bottom-16 flex flex-col justify-between text-xs text-gray-600 font-medium">
                        <span>{Math.round(maxValue / 1000)}k</span>
                        <span>{Math.round(maxValue * 0.75 / 1000)}k</span>
                        <span>{Math.round(maxValue * 0.5 / 1000)}k</span>
                        <span>{Math.round(maxValue * 0.25 / 1000)}k</span>
                        <span>0</span>
                    </div>
                    <div className="absolute left-1 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 font-medium transform -rotate-90 origin-center">
                        Actividad (Pasos)
                    </div>

                    {/* Título del eje X para barras */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 font-medium">
                        Días de la Semana
                    </div>

                    <div className="flex items-end justify-between h-full ml-16 mr-4 space-x-3">
                        {data.map((item, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center">
                                <div className="w-full relative group">
                                    <div
                                        className="bg-gradient-to-t from-blue-500 to-blue-400 w-full rounded-t-lg shadow-md transition-all duration-500 ease-out hover:shadow-lg"
                                        style={{
                                            height: `${Math.min((item.value / maxValue) * 170, 170)}px`,
                                            minHeight: '10px'
                                        }}
                                    />
                                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent to-white opacity-20 rounded-t-lg"></div>

                                    {/* Valor en la parte superior de cada barra */}
                                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700">
                                        {(item.value / 1000).toFixed(1)}k
                                    </div>
                                </div>
                                <span className="text-xs text-gray-600 mt-3 font-medium">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Texto contextual agregado */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">
                        Actividad física registrada por el acelerómetro durante la semana
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                        Total esta semana: <span className="font-semibold text-gray-700">{data.reduce((sum, item) => sum + item.value, 0).toLocaleString()}</span> pasos
                    </p>
                    <p className="text-xs text-gray-500">
                        Meta diaria recomendada: 8,000 pasos | Promedio diario: {Math.round(data.reduce((sum, item) => sum + item.value, 0) / data.length).toLocaleString()} pasos
                    </p>
                </div>
            </div>
        )
    }

    return null
}