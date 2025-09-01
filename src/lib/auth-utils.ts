// Utility để kiểm tra và debug authentication
export const authUtils = {
    /**
     * Kiểm tra xem user có đang đăng nhập không
     */
    isAuthenticated(): boolean {
        if (typeof window === 'undefined') return false

        const token = this.getAuthToken()
        return !!token
    },

    /**
     * Lấy authentication token từ storage
     */
    getAuthToken(): string | null {
        if (typeof window === 'undefined') return null

        // Kiểm tra auth-storage trước (có thể chứa token thực sự)
        const authStorage = localStorage.getItem('auth-storage')
        if (authStorage) {
            try {
                const authData = JSON.parse(authStorage)
                console.log('🔐 Auth storage found:', authData)

                // Tìm token trong auth-storage
                if (authData.accessToken) {
                    console.log('✅ Found accessToken in auth-storage')
                    return authData.accessToken
                }
                if (authData.token) {
                    console.log('✅ Found token in auth-storage')
                    return authData.token
                }
            } catch (e) {
                console.warn('❌ Could not parse auth-storage')
            }
        }

        // Kiểm tra currentUser token
        const currentUser = localStorage.getItem('currentUser')
        if (currentUser) {
            try {
                const userData = JSON.parse(currentUser)
                console.log('👤 Current user found:', userData)

                if (userData.token) {
                    console.log('✅ Found token in currentUser')
                    return userData.token
                }
            } catch (e) {
                console.warn('❌ Could not parse currentUser')
            }
        }

        const tokenSources = {
            'localStorage.accessToken': localStorage.getItem('accessToken'),
            'localStorage.token': localStorage.getItem('token'),
            'sessionStorage.accessToken': sessionStorage.getItem('accessToken'),
            'sessionStorage.token': sessionStorage.getItem('token'),
            'localStorage.authToken': localStorage.getItem('authToken'),
            'localStorage.jwt': localStorage.getItem('jwt'),
            'localStorage.userToken': localStorage.getItem('userToken')
        }

        // Log tất cả token sources để debug
        console.log('🔐 Auth Debug - Available tokens:', tokenSources)

        // Trả về token đầu tiên tìm thấy
        for (const [source, token] of Object.entries(tokenSources)) {
            if (token) {
                console.log('✅ Using token from:', source)
                return token
            }
        }

        console.warn('❌ No authentication token found!')
        return null
    },

    /**
     * Kiểm tra token có hợp lệ không (hỗ trợ cả JWT và non-JWT)
     */
    isTokenValid(token: string): boolean {
        if (!token) return false

        // Kiểm tra JWT format
        if (this.isJWTToken(token)) {
            return this.validateJWT(token)
        } else {
            // Nếu không phải JWT, kiểm tra độ dài tối thiểu
            console.log('🔑 Non-JWT token detected, checking minimum length...')
            const isValid = token.length >= 10 // Token phải có ít nhất 10 ký tự
            console.log(`✅ Non-JWT token length: ${token.length}, valid: ${isValid}`)
            return isValid
        }
    },

    /**
     * Kiểm tra xem token có phải JWT không
     */
    isJWTToken(token: string): boolean {
        // JWT có format: header.payload.signature (3 phần được phân tách bởi dấu chấm)
        const parts = token.split('.')
        return parts.length === 3
    },

    /**
     * Validate JWT token
     */
    validateJWT(token: string): boolean {
        try {
            const parts = token.split('.')
            if (parts.length !== 3) {
                console.warn('❌ Invalid JWT format - expected 3 parts')
                return false
            }

            // Decode payload để kiểm tra expiration
            const payload = JSON.parse(atob(parts[1]))
            const now = Math.floor(Date.now() / 1000)

            if (payload.exp && payload.exp < now) {
                console.warn('❌ JWT token has expired')
                return false
            }

            console.log('✅ JWT token appears valid')
            return true
        } catch (error) {
            console.error('❌ Error validating JWT token:', error)
            return false
        }
    },

    /**
     * Debug authentication status
     */
    debugAuthStatus(): void {
        console.log('🔍 === AUTHENTICATION DEBUG ===')
        console.log('Window available:', typeof window !== 'undefined')
        console.log('Is authenticated:', this.isAuthenticated())

        const token = this.getAuthToken()
        if (token) {
            console.log('Token found:', `${token.substring(0, 20)}...`)
            console.log('Token type:', this.isJWTToken(token) ? 'JWT' : 'Non-JWT')
            console.log('Token valid:', this.isTokenValid(token))

            if (this.isJWTToken(token)) {
                try {
                    const parts = token.split('.')
                    const payload = JSON.parse(atob(parts[1]))
                    console.log('JWT payload:', payload)
                } catch (e) {
                    console.log('Could not decode JWT payload')
                }
            } else {
                console.log('Non-JWT token length:', token.length)
            }
        } else {
            console.log('No token found')
        }

        // Log tất cả storage items
        if (typeof window !== 'undefined') {
            console.log('localStorage items:', Object.keys(localStorage))
            console.log('sessionStorage items:', Object.keys(sessionStorage))
        }

        console.log('=== END AUTH DEBUG ===')
    },

    /**
     * Clear tất cả authentication data
     */
    clearAuth(): void {
        if (typeof window === 'undefined') return

        const authKeys = [
            'accessToken', 'token', 'authToken', 'jwt', 'userToken'
        ]

        authKeys.forEach(key => {
            localStorage.removeItem(key)
            sessionStorage.removeItem(key)
        })

        console.log('🧹 Cleared all authentication data')
    },

    /**
     * Kiểm tra xem có cần login không
     */
    needsLogin(): boolean {
        return !this.isAuthenticated()
    },

    /**
     * Hướng dẫn user cách lấy token thực sự
     */
    showLoginInstructions(): void {
        console.log('🔐 === LOGIN INSTRUCTIONS ===')
        console.log('Để sử dụng video call, bạn cần:')
        console.log('1. Đăng nhập vào ứng dụng')
        console.log('2. Hoặc kiểm tra localStorage/sessionStorage có token hợp lệ')
        console.log('3. Token phải là JWT thực sự từ server (không phải token demo)')
        console.log('4. Nếu đã có token, hãy kiểm tra xem có bị expired không')
        console.log('=== END LOGIN INSTRUCTIONS ===')
    }
}
