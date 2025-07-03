import { Icon } from '../atoms/Icon'

export const NavigationItem = ({
                                   icon,
                                   label,
                                   active = false,
                                   onClick,
                                   className = ''
                               }) => {
    const baseClasses = 'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors'
    const activeClasses = active
        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
        : 'text-gray-700 hover:bg-gray-50'

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${activeClasses} ${className} w-full text-left`}
        >
            <Icon name={icon} size={20} className="mr-3" />
            {label}
        </button>
    )
}