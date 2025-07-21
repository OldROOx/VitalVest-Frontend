// src/components/molecules/NavigationItem.jsx - VERSION MEJORADA
import { Icon } from '../atoms/Icon'

export const NavigationItem = ({
                                   icon,
                                   label,
                                   active = false,
                                   onClick,
                                   className = '',
                                   showTooltip = false,
                                   collapsed = false
                               }) => {
    const baseClasses = 'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative group nav-item'
    const activeClasses = active
        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700 shadow-sm'
        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'

    const handleClick = (e) => {
        e.preventDefault();
        onClick();
    };

    return (
        <div className="relative sidebar-item">
            <button
                onClick={handleClick}
                className={`${baseClasses} ${activeClasses} ${className} w-full text-left ${
                    collapsed ? 'justify-center px-2' : ''
                }`}
                title={collapsed ? label : ''}
                aria-label={label}
                aria-expanded={!collapsed}
            >
                <Icon
                    name={icon}
                    size={20}
                    className={`${collapsed ? '' : 'mr-3'} transition-colors duration-200 ${
                        active ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                    }`}
                />
                {!collapsed && (
                    <span className="transition-opacity duration-200 truncate">
                        {label}
                    </span>
                )}

                {/* Indicador de estado activo para modo colapsado */}
                {collapsed && active && (
                    <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-l"></div>
                )}
            </button>

            {/* Tooltip para modo colapsado */}
            {collapsed && (showTooltip || true) && (
                <div className="sidebar-tooltip">
                    {label}
                </div>
            )}
        </div>
    )
}