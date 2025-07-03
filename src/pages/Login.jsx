import { useState } from 'react'
import { Button } from '../components/atoms/Button'
import { FormField } from '../components/molecules/FormField'
import { Icon } from '../components/atoms/Icon'
import { authService } from '../services/authService'

export default function Login({ onLogin }) {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validaciones básicas
        const newErrors = {}
        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido'
        }
        if (!formData.password.trim()) {
            newErrors.password = 'La contraseña es requerida'
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        setIsLoading(true)
        setErrors({})

        try {
            const result = await authService.login(formData)

            if (result.success) {
                onLogin() // Llama a la función para cambiar el estado en App
            } else {
                setErrors({
                    general: result.error || 'Error al iniciar sesión'
                })
            }
        } catch (error) {
            setErrors({
                general: 'Error de conexión. Verifica que la API esté funcionando.'
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (field) => (e) => {
        setFormData(prev => ({
            ...prev,
            [field]: e.target.value
        }))
        // Limpiar error del campo
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }))
        }
    }

    return (
        <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-blue-600 p-3 rounded-lg">
                        <Icon name="heart" size={32} color="white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
                    VitalVest
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Accede a tu panel de monitoreo personal
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {errors.general && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-800">{errors.general}</p>
                            </div>
                        )}

                        <FormField
                            label="Usuario / Email"
                            type="text"
                            placeholder="Ingresa tu usuario"
                            value={formData.email}
                            onChange={handleChange('email')}
                            error={errors.email}
                            required
                        />

                        <FormField
                            label="Contraseña"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange('password')}
                            error={errors.password}
                            required
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? 'Verificando...' : 'Ingresar al Sistema'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            Conectado a: localhost:8080
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}