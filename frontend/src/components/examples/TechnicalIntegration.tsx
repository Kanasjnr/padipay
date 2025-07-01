'use client'

import React, { useState } from 'react'
import { useTechnicalAPIs } from '@/lib/hooks/useTechnicalAPIs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading'
import { Camera, Users, Share2, Shield, Settings, Smartphone } from 'lucide-react'

export const TechnicalIntegration: React.FC = () => {
  const {
    isInitialized,
    preferences,
    securitySettings,
    biometricCapabilities,
    camera,
    contacts,
    sharing,
    biometric,
    settings
  } = useTechnicalAPIs()

  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Initializing technical APIs...</span>
      </div>
    )
  }

  const handleCameraTest = async () => {
    setIsLoading(true)
    try {
      const result = await camera.openImagePicker({
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 600
      })
      
      if (result.success && result.uri) {
        setSelectedImage(result.uri)
        setLastResult(`Image captured successfully: ${result.width}x${result.height}px`)
      } else {
        setLastResult(`Camera failed: ${result.error}`)
      }
    } catch (error) {
      setLastResult(`Camera error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQRScan = async () => {
    setIsLoading(true)
    try {
      const result = await camera.scanQR()
      if (result.success) {
        setLastResult(`QR Code scanned: ${result.data}`)
      } else {
        setLastResult(`QR scan failed: ${result.error}`)
      }
    } catch (error) {
      setLastResult(`QR scan error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleContactPicker = async () => {
    setIsLoading(true)
    try {
      const contact = await contacts.pickContact()
      if (contact) {
        setLastResult(`Contact selected: ${contact.name} (${contact.phoneNumbers[0]})`)
      } else {
        setLastResult('No contact selected')
      }
    } catch (error) {
      setLastResult(`Contact picker error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async () => {
    setIsLoading(true)
    try {
      const success = await sharing.shareContent({
        title: 'PadiPay Test',
        text: 'Testing the sharing functionality of PadiPay app!',
        url: 'https://padipay.app'
      })
      setLastResult(success ? 'Content shared successfully' : 'Share cancelled')
    } catch (error) {
      setLastResult(`Share error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBiometricAuth = async () => {
    setIsLoading(true)
    try {
      const result = await biometric.authenticate({
        promptMessage: 'Please authenticate to continue'
      })
      
      if (result.success) {
        setLastResult(`Authentication successful: ${result.biometricType}`)
      } else {
        setLastResult(`Authentication failed: ${result.error}`)
      }
    } catch (error) {
      setLastResult(`Biometric error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnableBiometric = async () => {
    setIsLoading(true)
    try {
      const result = await biometric.enableBiometric('user123', 'TestUser')
      if (result.success) {
        setLastResult('Biometric authentication enabled successfully')
      } else {
        setLastResult(`Failed to enable biometric: ${result.error}`)
      }
    } catch (error) {
      setLastResult(`Biometric enable error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePreferences = () => {
    if (preferences) {
      const newTheme = preferences.theme === 'light' ? 'dark' : 'light'
      const updated = {
        ...preferences,
        theme: newTheme as 'light' | 'dark' | 'system'
      }
      
      const success = settings.updatePreferences(updated)
      setLastResult(success ? `Theme changed to ${updated.theme}` : 'Failed to update preferences')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Technical APIs Integration</h1>
        <p className="text-gray-600">Test all device capabilities and permissions</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="font-semibold">Security</h3>
              <div className="flex space-x-2 mt-1">
                <Badge variant={biometric.isSupported ? 'default' : 'secondary'}>
                  {biometric.isSupported ? 'Biometric' : 'No Biometric'}
                </Badge>
                <Badge variant={securitySettings?.deviceLockEnabled ? 'default' : 'secondary'}>
                  {securitySettings?.deviceLockEnabled ? 'Device Lock' : 'No Lock'}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Settings className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="font-semibold">Preferences</h3>
              <div className="flex space-x-2 mt-1">
                <Badge variant="outline">
                  {preferences?.theme || 'system'}
                </Badge>
                <Badge variant="outline">
                  {preferences?.currency || 'NGN'}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-8 w-8 text-purple-600" />
            <div>
              <h3 className="font-semibold">Device</h3>
              <div className="flex space-x-2 mt-1">
                <Badge variant={biometricCapabilities?.deviceSecure ? 'default' : 'secondary'}>
                  {biometricCapabilities?.deviceSecure ? 'Secure' : 'Unsecure'}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Camera & Gallery */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Camera className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Camera & Gallery</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="space-y-3">
              <Button 
                onClick={handleCameraTest} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                Open Image Picker
              </Button>
              <Button 
                onClick={handleQRScan} 
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                Scan QR Code
              </Button>
            </div>
          </div>
          
          <div>
            {selectedImage && (
              <div className="border rounded-lg p-2">
                <img 
                  src={selectedImage} 
                  alt="Selected" 
                  className="w-full h-32 object-cover rounded"
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Contacts */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Users className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-semibold">Contacts</h2>
        </div>
        
        <Button 
          onClick={handleContactPicker} 
          disabled={isLoading}
          className="w-full md:w-auto"
        >
          {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
          Pick Contact
        </Button>
      </Card>

      {/* Sharing */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Share2 className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-semibold">Sharing</h2>
        </div>
        
        <Button 
          onClick={handleShare} 
          disabled={isLoading}
          className="w-full md:w-auto"
        >
          {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
          Test Share
        </Button>
      </Card>

      {/* Biometric Authentication */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-6 w-6 text-red-600" />
          <h2 className="text-xl font-semibold">Biometric Authentication</h2>
        </div>
        
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleBiometricAuth} 
              disabled={isLoading || !biometric.isSupported}
              variant="outline"
            >
              {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Authenticate
            </Button>
            
            <Button 
              onClick={handleEnableBiometric} 
              disabled={isLoading || !biometric.isSupported}
              variant="outline"
            >
              {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Enable Biometric
            </Button>
          </div>
          
          {!biometric.isSupported && (
            <p className="text-sm text-gray-500">
              Biometric authentication is not supported on this device
            </p>
          )}
        </div>
      </Card>

      {/* Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Settings className="h-6 w-6 text-gray-600" />
          <h2 className="text-xl font-semibold">Settings</h2>
        </div>
        
        <Button 
          onClick={handleUpdatePreferences} 
          disabled={!preferences}
          variant="outline"
          className="w-full md:w-auto"
        >
          Toggle Theme ({preferences?.theme})
        </Button>
      </Card>

      {/* Result Display */}
      {lastResult && (
        <Card className="p-4 bg-gray-50">
          <h3 className="font-semibold mb-2">Last Result:</h3>
          <p className="text-sm text-gray-700 font-mono">{lastResult}</p>
        </Card>
      )}
    </div>
  )
} 