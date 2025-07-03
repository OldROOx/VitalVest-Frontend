import { Input } from '../atoms/Input'

export const FormField = ({
                              label,
                              error,
                              required = false,
                              className = '',
                              children,
                              ...inputProps
                          }) => {
    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            {children || <Input error={!!error} {...inputProps} />}
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
        </div>
    )
}