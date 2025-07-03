export const Chart = ({
                          data,
                          type = 'line',
                          title,
                          className = ''
                      }) => {
    // Simulación simple de gráfico con barras CSS
    if (type === 'bar') {
        const maxValue = Math.max(...data.map(d => d.value))

        return (
            <div className={`p-4 ${className}`}>
                {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
                <div className="flex items-end space-x-2 h-32">
                    {data.map((item, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                            <div
                                className="bg-blue-500 w-full rounded-t"
                                style={{
                                    height: `${(item.value / maxValue) * 100}%`,
                                    minHeight: '4px'
                                }}
                            />
                            <span className="text-xs text-gray-600 mt-2">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Simulación de gráfico de línea
    return (
        <div className={`p-4 ${className}`}>
            {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
            <div className="h-32 flex items-end justify-between">
                {data.map((point, index) => (
                    <div
                        key={index}
                        className="w-2 bg-blue-500 rounded-t"
                        style={{
                            height: `${point.value}%`
                        }}
                    />
                ))}
            </div>
        </div>
    )
}