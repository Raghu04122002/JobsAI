const getBaseUrl = () => {
    const url = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || ''
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    if (url.startsWith('localhost')) return `http://${url}`
    return `https://${url}`
}

export const API_BASE_URL = getBaseUrl()
console.log('🔌 API_BASE_URL Configured as:', API_BASE_URL, 'Raw Env:', process.env.NEXT_PUBLIC_API_URL)
