'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  showImagePicker, 
  captureImage, 
  selectFromGallery, 
  scanQRCode,
  type CameraOptions, 
  type CameraResult,
  type QRScanResult
} from '../camera'
import { 
  showContactPicker, 
  getAllContacts,
  searchContacts
} from '../contacts'
import { 
  initializeStorage,
  getUserPreferences,
  setUserPreferences,
  getSecuritySettings,
  setSecuritySettings,
  type UserPreferences,
  type SecuritySettings
} from '../storage'
import { 
  share,
  sharePaymentLink,
  shareTransactionReceipt,
  shareAppReferral
} from '../sharing'
import { 
  authenticateUser,
  enableBiometricAuth,
  disableBiometricAuth,
  isBiometricSupported,
  getBiometricSettings,
  type BiometricOptions,
  type BiometricResult,
  type BiometricCapabilities,
  type BiometricSettings
} from '../biometrics'

// Combined hook for all technical APIs
export const useTechnicalAPIs = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [preferences, setPreferencesState] = useState<UserPreferences | null>(null)
  const [securitySettings, setSecuritySettingsState] = useState<SecuritySettings | null>(null)
  const [biometricCapabilities, setBiometricCapabilities] = useState<BiometricCapabilities | null>(null)
  const [biometricSettings, setBiometricSettingsState] = useState<BiometricSettings | null>(null)

  // Initialize storage and load settings
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize storage with defaults
        initializeStorage()
        
        // Load user preferences
        const userPrefs = getUserPreferences()
        setPreferencesState(userPrefs)
        
        // Load security settings
        const securityPrefs = getSecuritySettings()
        setSecuritySettingsState(securityPrefs)
        
        // Check biometric capabilities
        const capabilities = await isBiometricSupported()
        setBiometricCapabilities(capabilities)
        
        // Load biometric settings
        const biometricPrefs = getBiometricSettings()
        setBiometricSettingsState(biometricPrefs)
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize technical APIs:', error)
        setIsInitialized(true) // Still mark as initialized to avoid infinite loading
      }
    }

    initialize()
  }, [])

  // Camera functions
  const openImagePicker = useCallback(async (options?: CameraOptions): Promise<CameraResult> => {
    return await showImagePicker(options)
  }, [])

  const takePhoto = useCallback(async (options?: CameraOptions): Promise<CameraResult> => {
    return await captureImage(options)
  }, [])

  const selectImage = useCallback(async (options?: CameraOptions): Promise<CameraResult> => {
    return await selectFromGallery(options)
  }, [])

  const scanQR = useCallback(async (): Promise<QRScanResult> => {
    return await scanQRCode()
  }, [])

  return {
    // Initialization state
    isInitialized,
    
    // Current settings
    preferences,
    securitySettings,
    biometricCapabilities,
    biometricSettings,
    
    // Camera & Gallery
    camera: {
      openImagePicker,
      takePhoto,
      selectImage,
      scanQR
    },
    
    // Contacts
    contacts: {
      pickContact: showContactPicker,
      getContacts: getAllContacts,
      findContacts: searchContacts
    },
    
    // Sharing
    sharing: {
      shareContent: share,
      sharePayment: sharePaymentLink,
      shareReceipt: shareTransactionReceipt,
      shareReferral: shareAppReferral
    },
    
    // Biometric Authentication
    biometric: {
      authenticate: authenticateUser,
      enableBiometric: enableBiometricAuth,
      disableBiometric: disableBiometricAuth,
      isSupported: biometricCapabilities?.isSupported || false,
      isEnrolled: biometricCapabilities?.isEnrolled || false
    },
    
    // Settings Management
    settings: {
      updatePreferences: setUserPreferences,
      updateSecuritySettings: setSecuritySettings
    }
  }
}

// Hook for camera operations only
export const useCamera = () => {
  const openImagePicker = useCallback(async (options?: CameraOptions): Promise<CameraResult> => {
    return await showImagePicker(options)
  }, [])

  const takePhoto = useCallback(async (options?: CameraOptions): Promise<CameraResult> => {
    return await captureImage(options)
  }, [])

  const selectImage = useCallback(async (options?: CameraOptions): Promise<CameraResult> => {
    return await selectFromGallery(options)
  }, [])

  const scanQR = useCallback(async (): Promise<QRScanResult> => {
    return await scanQRCode()
  }, [])

  return {
    openImagePicker,
    takePhoto,
    selectImage,
    scanQR
  }
}

// Hook for biometric authentication only
export const useBiometric = () => {
  const [capabilities, setCapabilities] = useState<BiometricCapabilities | null>(null)
  const [settings, setSettingsState] = useState<BiometricSettings | null>(null)

  useEffect(() => {
    const loadBiometricData = async () => {
      const caps = await isBiometricSupported()
      setCapabilities(caps)
      
      const savedSettings = getBiometricSettings()
      setSettingsState(savedSettings)
    }

    loadBiometricData()
  }, [])

  const authenticate = useCallback(async (options?: BiometricOptions): Promise<BiometricResult> => {
    return await authenticateUser(options)
  }, [])

  const enable = useCallback(async (userId: string, username: string): Promise<BiometricResult> => {
    const result = await enableBiometricAuth(userId, username)
    
    if (result.success) {
      const newSettings = getBiometricSettings()
      setSettingsState(newSettings)
    }
    
    return result
  }, [])

  const disable = useCallback((): boolean => {
    const success = disableBiometricAuth()
    
    if (success) {
      setSettingsState(null)
    }
    
    return success
  }, [])

  return {
    capabilities,
    settings,
    authenticate,
    enable,
    disable,
    isSupported: capabilities?.isSupported || false,
    isEnrolled: capabilities?.isEnrolled || false,
    isEnabled: settings?.enabled || false
  }
} 