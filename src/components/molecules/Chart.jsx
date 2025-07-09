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
        const svgHeight = 300
        const paddingLeft = 50
        const paddingRight = 30
        const paddingTop = 30
        const paddingBottom = 50
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

                        {/* Etiquetas del eje Y */}
                        {yTicks.map((tick, index) => (
                            <text
                                key={index}
                                x={paddingLeft - 10}
                                y={tick.y + 5}
                                textAnchor="end"
                                fontSize="12"
                                fill="#6B7280"
                                fontFamily="system-ui, sans-serif"
                            >
                                {tick.label}
                            </text>
                        ))}

                        {/* Etiquetas del eje X */}
                        {points.map((point, index) => (
                            <text
                                key={index}
                                x={point.x}
                                y={paddingTop + chartHeight + 20}
                                textAnchor="middle"
                                fontSize="12"
                                fill="#6B7280"
                                fontFamily="system-ui, sans-serif"
                            >
                                {point.label}
                            </text>
                        ))}
                    </svg>
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
                    <div className="flex items-end justify-between h-full space-x-3">
                        {data.map((item, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center">
                                <div className="w-full relative">
                                    <div
                                        className="bg-gradient-to-t from-blue-500 to-blue-400 w-full rounded-t-lg shadow-md transition-all duration-500 ease-out hover:shadow-lg"
                                        style={{
                                            height: `${Math.min((item.value / maxValue) * 190, 190)}px`,
                                            minHeight: '10px'
                                        }}
                                    />
                                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent to-white opacity-20 rounded-t-lg"></div>
                                </div>
                                <span className="text-xs text-gray-600 mt-3 font-medium">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Resumen */}
                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">
                        Total esta semana: <span className="font-semibold text-gray-700">{data.reduce((sum, item) => sum + item.value, 0).toLocaleString()}</span> pasos
                    </p>
                </div>
            </div>
        )
    }

    return null
}