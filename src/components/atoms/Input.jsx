export const Input = ({
                          type = 'text',
                          placeholder,
                          value,
                          onChange,
                          disabled = false,
                          error = false,
                          className = '',
                          ...props
                      }) => {
    const baseClasses = 'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors'
    const errorClasses = error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
    const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'

    return (
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`${baseClasses} ${errorClasses} ${disabledClasses} ${className}`}
            {...props}
        />
    )
}