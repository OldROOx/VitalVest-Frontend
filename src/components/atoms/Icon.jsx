export const Icon = ({ name, size = 20, className = '', color = 'currentColor' }) => {
    // Para el logo VitalVest, usar la imagen directamente
    if (name === 'vitalvest') {
        return (
            <img
                src="/vitalvest-logo.png"
                alt="VitalVest Logo"
                width={size}
                height={size}
                className={className}
                style={{ filter: color === 'white' ? 'brightness(0) invert(1)' : 'none' }}
            />
        )
    }

    const icons = {
        dashboard: (
            <svg width={size} height={size} className={className} fill={color} viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
        ),
        sessions: (
            <svg width={size} height={size} className={className} fill={color} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
        ),
        alerts: (
            <svg width={size} height={size} className={className} fill={color} viewBox="0 0 20 20">
                <path d="M10 2L3 14h14l-7-12zM10 12a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
        ),
        config: (
            <svg width={size} height={size} className={className} fill={color} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
        ),
        sync: (
            <svg width={size} height={size} className={className} fill={color} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
        ),
        heart: (
            <svg width={size} height={size} className={className} fill={color} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
        ),
        thermometer: (
            <svg width={size} height={size} className={className} fill={color} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a6 6 0 01-6-6V6a6 6 0 1112 0v6a6 6 0 01-6 6zM10 4a2 2 0 00-2 2v6a2 2 0 104 0V6a2 2 0 00-2-2z" clipRule="evenodd" />
            </svg>
        ),
        droplet: (
            <svg width={size} height={size} className={className} fill={color} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2l5.5 8.5A5.5 5.5 0 0110 16a5.5 5.5 0 01-5.5-5.5L10 2z" clipRule="evenodd" />
            </svg>
        ),
        activity: (
            <svg width={size} height={size} className={className} fill={color} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h1.586l.707-.707a1 1 0 011.414 0L10 10.586l2.293-2.293a1 1 0 011.414 0l.707.707H16a1 1 0 110 2h-2.414l-1.707-1.707L10 11.414l-1.879-1.879L6.414 11H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
        ),
        user: (
            <svg width={size} height={size} className={className} fill={color} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
        ),
        wifi: (
            <svg width={size} height={size} className={className} fill={color} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
        ),
        menu: (
            <svg width={size} height={size} className={className} fill={color} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
        ),
        close: (
            <svg width={size} height={size} className={className} fill={color} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        ),
        eye: (
            <svg width={size} height={size} className={className} fill={color} viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
        )
    }

    return icons[name] || null
}