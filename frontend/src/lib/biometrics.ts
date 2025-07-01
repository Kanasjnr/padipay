// Biometric Authentication APIs for Security Settings

export interface BiometricOptions {
  promptMessage?: string
  fallbackLabel?: string
  disableDeviceFallback?: boolean
}

export interface BiometricResult {
  success: boolean
  error?: string
  biometricType?: 'fingerprint' | 'face' | 'voice' | 'none'
  isDeviceLockSupported?: boolean
}

export interface BiometricCapabilities {
  isSupported: boolean
  isEnrolled: boolean
  availableTypes: string[]
  deviceSecure: boolean
}

// Check if biometric authentication is supported
export const isBiometricSupported = async (): Promise<BiometricCapabilities> => {
  try {
    // Web Authentication API (WebAuthn) for biometrics
    if (!window.PublicKeyCredential) {
      return {
        isSupported: false,
        isEnrolled: false,
        availableTypes: [],
        deviceSecure: false
      }
    }

    // Check if WebAuthn is available
    const isWebAuthnSupported = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    
    // For web, we can't directly check enrollment status
    // This would typically be handled by the browser/device
    return {
      isSupported: isWebAuthnSupported,
      isEnrolled: isWebAuthnSupported, // Assume enrolled if supported
      availableTypes: isWebAuthnSupported ? ['platform'] : [],
      deviceSecure: isWebAuthnSupported
    }
  } catch (error) {
    console.error('Error checking biometric support:', error)
    return {
      isSupported: false,
      isEnrolled: false,
      availableTypes: [],
      deviceSecure: false
    }
  }
}

// Authenticate using biometrics (WebAuthn implementation)
export const authenticateWithBiometrics = async (options: BiometricOptions = {}): Promise<BiometricResult> => {
  try {
    const { promptMessage = 'Please verify your identity' } = options

    // Check if biometrics are supported
    const capabilities = await isBiometricSupported()
    if (!capabilities.isSupported) {
      return {
        success: false,
        error: 'Biometric authentication not supported on this device'
      }
    }

    // Create WebAuthn authentication request
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: new Uint8Array(32), // In production, get this from your server
      timeout: 60000,
      userVerification: 'required',
      allowCredentials: [] // In production, use stored credential IDs
    }

    // Request authentication
    const credential = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    }) as PublicKeyCredential | null

    if (credential) {
      return {
        success: true,
        biometricType: 'fingerprint', // WebAuthn doesn't specify exact type
        isDeviceLockSupported: true
      }
    } else {
      return {
        success: false,
        error: 'Authentication was cancelled or failed'
      }
    }
  } catch (error) {
    console.error('Biometric authentication failed:', error)
    
    let errorMessage = 'Biometric authentication failed'
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Authentication was cancelled or not allowed'
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Biometric authentication not supported'
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Security error during authentication'
      }
    }

    return {
      success: false,
      error: errorMessage
    }
  }
}

// Register biometric credentials (for WebAuthn)
export const registerBiometricCredential = async (userId: string, username: string): Promise<BiometricResult> => {
  try {
    // Check if biometrics are supported
    const capabilities = await isBiometricSupported()
    if (!capabilities.isSupported) {
      return {
        success: false,
        error: 'Biometric registration not supported on this device'
      }
    }

    // Create WebAuthn registration request
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: new Uint8Array(32), // In production, get this from your server
      rp: {
        name: 'PadiPay',
        id: window.location.hostname
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: username,
        displayName: username
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        requireResidentKey: false
      },
      timeout: 60000,
      attestation: 'none'
    }

    // Create credential
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    }) as PublicKeyCredential | null

    if (credential) {
      // In production, send credential to server for storage
      return {
        success: true,
        biometricType: 'fingerprint',
        isDeviceLockSupported: true
      }
    } else {
      return {
        success: false,
        error: 'Failed to create biometric credential'
      }
    }
  } catch (error) {
    console.error('Biometric registration failed:', error)
    
    let errorMessage = 'Biometric registration failed'
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Registration was cancelled or not allowed'
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Biometric registration not supported'
      }
    }

    return {
      success: false,
      error: errorMessage
    }
  }
}

// Device lock authentication (fallback)
export const authenticateWithDeviceLock = async (): Promise<BiometricResult> => {
  try {
    // For web, we can simulate device lock with a password prompt
    // In a real mobile app, this would use device PIN/pattern/password
    
    return new Promise((resolve) => {
      const modal = document.createElement('div')
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 m-4 max-w-sm w-full">
          <h3 class="text-lg font-semibold mb-4">Device Authentication</h3>
          <p class="text-gray-600 mb-4">Enter your device passcode to continue</p>
          <input 
            id="passcode-input" 
            type="password" 
            placeholder="Enter passcode" 
            class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
          <div class="flex space-x-3">
            <button id="cancel-btn" class="flex-1 p-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
              Cancel
            </button>
            <button id="authenticate-btn" class="flex-1 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Authenticate
            </button>
          </div>
        </div>
      `

      document.body.appendChild(modal)

      const cleanup = () => {
        document.body.removeChild(modal)
      }

      const passcodeInput = modal.querySelector('#passcode-input') as HTMLInputElement
      passcodeInput?.focus()

      // Handle authentication
      modal.querySelector('#authenticate-btn')?.addEventListener('click', () => {
        const passcode = passcodeInput?.value
        cleanup()
        
        if (passcode && passcode.length >= 4) {
          resolve({
            success: true,
            biometricType: 'none',
            isDeviceLockSupported: true
          })
        } else {
          resolve({
            success: false,
            error: 'Invalid passcode'
          })
        }
      })

      // Handle cancel
      modal.querySelector('#cancel-btn')?.addEventListener('click', () => {
        cleanup()
        resolve({
          success: false,
          error: 'Authentication cancelled'
        })
      })

      // Handle enter key
      passcodeInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const passcode = passcodeInput.value
          cleanup()
          
          if (passcode && passcode.length >= 4) {
            resolve({
              success: true,
              biometricType: 'none',
              isDeviceLockSupported: true
            })
          } else {
            resolve({
              success: false,
              error: 'Invalid passcode'
            })
          }
        }
      })

      // Click outside to cancel
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          cleanup()
          resolve({
            success: false,
            error: 'Authentication cancelled'
          })
        }
      })
    })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Device lock authentication failed'
    }
  }
}

// Combined authentication with fallback
export const authenticateUser = async (options: BiometricOptions = {}): Promise<BiometricResult> => {
  try {
    // Try biometric authentication first
    const capabilities = await isBiometricSupported()
    
    if (capabilities.isSupported && capabilities.isEnrolled) {
      const biometricResult = await authenticateWithBiometrics(options)
      if (biometricResult.success) {
        return biometricResult
      }
    }

    // Fallback to device lock if biometric fails
    if (!options.disableDeviceFallback) {
      return await authenticateWithDeviceLock()
    }

    return {
      success: false,
      error: 'No authentication method available'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    }
  }
}

// Biometric settings management
export interface BiometricSettings {
  enabled: boolean
  registeredAt?: number
  lastUsed?: number
  failedAttempts: number
  lockedUntil?: number
}

// Enable biometric authentication
export const enableBiometricAuth = async (userId: string, username: string): Promise<BiometricResult> => {
  try {
    // First check if biometrics are supported
    const capabilities = await isBiometricSupported()
    if (!capabilities.isSupported) {
      return {
        success: false,
        error: 'Biometric authentication is not supported on this device'
      }
    }

    // Register biometric credential
    const registrationResult = await registerBiometricCredential(userId, username)
    if (!registrationResult.success) {
      return registrationResult
    }

    // Save settings to storage
    const settings: BiometricSettings = {
      enabled: true,
      registeredAt: Date.now(),
      failedAttempts: 0
    }

    localStorage.setItem('padipay_biometric_settings', JSON.stringify(settings))

    return {
      success: true,
      biometricType: registrationResult.biometricType
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enable biometric authentication'
    }
  }
}

// Disable biometric authentication
export const disableBiometricAuth = (): boolean => {
  try {
    // Remove settings from storage
    localStorage.removeItem('padipay_biometric_settings')
    
    // In production, also remove credentials from server
    return true
  } catch (error) {
    console.error('Failed to disable biometric authentication:', error)
    return false
  }
}

// Get biometric settings
export const getBiometricSettings = (): BiometricSettings | null => {
  try {
    const stored = localStorage.getItem('padipay_biometric_settings')
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error('Failed to get biometric settings:', error)
    return null
  }
}

// Update biometric settings
export const updateBiometricSettings = (settings: Partial<BiometricSettings>): boolean => {
  try {
    const current = getBiometricSettings() || {
      enabled: false,
      failedAttempts: 0
    }

    const updated = { ...current, ...settings }
    localStorage.setItem('padipay_biometric_settings', JSON.stringify(updated))
    return true
  } catch (error) {
    console.error('Failed to update biometric settings:', error)
    return false
  }
} 