import { useState } from 'react'
import { Button } from '../components/atoms/Button'
import { FormField } from '../components/molecules/FormField'
import { Icon } from '../components/atoms/Icon'

export default function Login({ onLogin }) {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)

        // Simulación de login
        setTimeout(() => {
            setIsLoading(false)
            onLogin()
        }, 1000)
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
                        <FormField
                            label="Correo Electrónico"
                            type="email"
                            placeholder="usuario@ejemplo.com"
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
                            {isLoading ? 'Ingresando...' : 'Ingresar al Sistema'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}