// Secure Storage Utilities for User Preferences and Cached Data

export interface StorageOptions {
  encrypt?: boolean
  ttl?: number // Time to live in milliseconds
  compress?: boolean
}

export interface StoredItem<T> {
  data: T
  timestamp: number
  ttl?: number
  version: string
}

// Storage keys enum for type safety
export enum StorageKeys {
  USER_PREFERENCES = 'padipay_user_preferences',
  TRANSACTION_CACHE = 'padipay_transaction_cache',
  CONTACTS_CACHE = 'padipay_contacts_cache',
  SECURITY_SETTINGS = 'padipay_security_settings',
  ONBOARDING_STATE = 'padipay_onboarding_state',
  THEME_SETTINGS = 'padipay_theme_settings',
  LANGUAGE_SETTINGS = 'padipay_language_settings',
  CURRENCY_SETTINGS = 'padipay_currency_settings',
  NOTIFICATION_SETTINGS = 'padipay_notification_settings',
  BIOMETRIC_SETTINGS = 'padipay_biometric_settings'
}

// Check if storage is available
export const isStorageAvailable = (type: 'localStorage' | 'sessionStorage' = 'localStorage'): boolean => {
  try {
    const storage = window[type]
    const test = '__storage_test__'
    storage.setItem(test, test)
    storage.removeItem(test)
    return true
  } catch {
    return false
  }
}

// Simple encryption/decryption (for demo - use proper encryption in production)
const simpleEncrypt = (text: string, key: string): string => {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return btoa(result)
}

const simpleDecrypt = (encrypted: string, key: string): string => {
  const text = atob(encrypted)
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return result
}

// Get encryption key (in production, use proper key management)
const getEncryptionKey = (): string => {
  return 'padipay_secret_key_2024' // In production, generate and store securely
}

// Set item in storage
export const setStorageItem = <T>(
  key: StorageKeys, 
  value: T, 
  options: StorageOptions = {}
): boolean => {
  try {
    if (!isStorageAvailable()) {
      console.warn('Storage not available')
      return false
    }

    const { encrypt = false, ttl, compress = false } = options
    
    const item: StoredItem<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
      version: '1.0'
    }

    let serialized = JSON.stringify(item)

    // Compress if needed (simple compression)
    if (compress && serialized.length > 1024) {
      // In production, use a proper compression library
      console.log('Compression requested but not implemented')
    }

    // Encrypt if needed
    if (encrypt) {
      serialized = simpleEncrypt(serialized, getEncryptionKey())
    }

    localStorage.setItem(key, serialized)
    return true
  } catch (error) {
    console.error('Failed to set storage item:', error)
    return false
  }
}

// Get item from storage
export const getStorageItem = <T>(
  key: StorageKeys, 
  options: StorageOptions = {}
): T | null => {
  try {
    if (!isStorageAvailable()) {
      return null
    }

    const { encrypt = false } = options
    let stored = localStorage.getItem(key)

    if (!stored) {
      return null
    }

    // Decrypt if needed
    if (encrypt) {
      try {
        stored = simpleDecrypt(stored, getEncryptionKey())
      } catch (error) {
        console.error('Failed to decrypt storage item:', error)
        return null
      }
    }

    const item: StoredItem<T> = JSON.parse(stored)

    // Check TTL
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      localStorage.removeItem(key)
      return null
    }

    return item.data
  } catch (error) {
    console.error('Failed to get storage item:', error)
    return null
  }
}

// Remove item from storage
export const removeStorageItem = (key: StorageKeys): boolean => {
  try {
    if (!isStorageAvailable()) {
      return false
    }

    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('Failed to remove storage item:', error)
    return false
  }
}

// Clear all PadiPay storage
export const clearAllStorage = (): boolean => {
  try {
    if (!isStorageAvailable()) {
      return false
    }

    Object.values(StorageKeys).forEach(key => {
      localStorage.removeItem(key)
    })
    return true
  } catch (error) {
    console.error('Failed to clear storage:', error)
    return false
  }
}

// Get storage usage info
export const getStorageInfo = () => {
  if (!isStorageAvailable()) {
    return { supported: false, used: 0, remaining: 0 }
  }

  let used = 0
  Object.values(StorageKeys).forEach(key => {
    const item = localStorage.getItem(key)
    if (item) {
      used += item.length
    }
  })

  // Estimate total storage (5MB is typical for localStorage)
  const estimated = 5 * 1024 * 1024
  
  return {
    supported: true,
    used,
    remaining: estimated - used,
    usedMB: (used / (1024 * 1024)).toFixed(2),
    remainingMB: ((estimated - used) / (1024 * 1024)).toFixed(2)
  }
}

// Specific storage functions for different data types

// User Preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  currency: string
  notifications: {
    transactions: boolean
    security: boolean
    marketing: boolean
    sound: boolean
    vibration: boolean
  }
  privacy: {
    showBalance: boolean
    requirePinForTransactions: boolean
    biometricEnabled: boolean
  }
  accessibility: {
    fontSize: 'small' | 'medium' | 'large'
    highContrast: boolean
    screenReader: boolean
  }
}

export const setUserPreferences = (preferences: UserPreferences): boolean => {
  return setStorageItem(StorageKeys.USER_PREFERENCES, preferences, { encrypt: true })
}

export const getUserPreferences = (): UserPreferences | null => {
  return getStorageItem<UserPreferences>(StorageKeys.USER_PREFERENCES, { encrypt: true })
}

// Transaction Cache
export interface CachedTransaction {
  id: string
  amount: number
  currency: string
  recipient: string
  timestamp: number
  status: 'pending' | 'completed' | 'failed'
}

export const setCachedTransactions = (transactions: CachedTransaction[]): boolean => {
  return setStorageItem(StorageKeys.TRANSACTION_CACHE, transactions, { 
    encrypt: true, 
    ttl: 24 * 60 * 60 * 1000 // 24 hours
  })
}

export const getCachedTransactions = (): CachedTransaction[] => {
  return getStorageItem<CachedTransaction[]>(StorageKeys.TRANSACTION_CACHE, { encrypt: true }) || []
}

// Security Settings
export interface SecuritySettings {
  biometricEnabled: boolean
  twoFactorEnabled: boolean
  deviceLockEnabled: boolean
  autoLockTimeout: number // minutes
  lastSecurityCheck: number
  trustedDevices: string[]
}

export const setSecuritySettings = (settings: SecuritySettings): boolean => {
  return setStorageItem(StorageKeys.SECURITY_SETTINGS, settings, { encrypt: true })
}

export const getSecuritySettings = (): SecuritySettings | null => {
  return getStorageItem<SecuritySettings>(StorageKeys.SECURITY_SETTINGS, { encrypt: true })
}

// Onboarding State
export interface OnboardingState {
  completed: boolean
  currentStep: number
  skippedSteps: string[]
  completedAt?: number
}

export const setOnboardingState = (state: OnboardingState): boolean => {
  return setStorageItem(StorageKeys.ONBOARDING_STATE, state)
}

export const getOnboardingState = (): OnboardingState | null => {
  return getStorageItem<OnboardingState>(StorageKeys.ONBOARDING_STATE)
}

// Cache management
export const cleanExpiredCache = (): void => {
  Object.values(StorageKeys).forEach(key => {
    // This will automatically remove expired items
    getStorageItem(key)
  })
}

// Initialize storage with default values
export const initializeStorage = (): void => {
  // Set default user preferences if not exists
  if (!getUserPreferences()) {
    const defaultPreferences: UserPreferences = {
      theme: 'system',
      language: 'en',
      currency: 'NGN',
      notifications: {
        transactions: true,
        security: true,
        marketing: false,
        sound: true,
        vibration: true
      },
      privacy: {
        showBalance: true,
        requirePinForTransactions: true,
        biometricEnabled: false
      },
      accessibility: {
        fontSize: 'medium',
        highContrast: false,
        screenReader: false
      }
    }
    setUserPreferences(defaultPreferences)
  }

  // Set default security settings if not exists
  if (!getSecuritySettings()) {
    const defaultSecurity: SecuritySettings = {
      biometricEnabled: false,
      twoFactorEnabled: false,
      deviceLockEnabled: true,
      autoLockTimeout: 5,
      lastSecurityCheck: Date.now(),
      trustedDevices: []
    }
    setSecuritySettings(defaultSecurity)
  }

  // Clean expired cache
  cleanExpiredCache()
} 