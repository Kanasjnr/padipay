// Camera and Gallery Access Utilities
export interface CameraOptions {
  quality?: number // 0-1, default 0.8
  maxWidth?: number
  maxHeight?: number
  allowEdit?: boolean
  mediaTypes?: 'photo' | 'video' | 'mixed'
  source?: 'camera' | 'gallery' | 'prompt'
}

export interface CameraResult {
  success: boolean
  uri?: string
  base64?: string
  width?: number
  height?: number
  fileSize?: number
  error?: string
}

// Check if camera is available
export const isCameraAvailable = (): boolean => {
  if (typeof navigator === 'undefined') return false
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

// Check if file input is supported (for gallery access)
export const isGalleryAvailable = (): boolean => {
  if (typeof document === 'undefined') return false
  const input = document.createElement('input')
  input.type = 'file'
  return input.accept !== undefined
}

// Request camera permission
export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    if (!isCameraAvailable()) return false
    
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach(track => track.stop()) // Stop the stream immediately
    return true
  } catch (error) {
    console.warn('Camera permission denied:', error)
    return false
  }
}

// Capture image from camera (web implementation)
export const captureImage = async (options: CameraOptions = {}): Promise<CameraResult> => {
  const { quality = 0.8, maxWidth = 1024, maxHeight = 1024 } = options

  try {
    if (!isCameraAvailable()) {
      throw new Error('Camera not available')
    }

    // Create video element for camera preview
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Canvas context not available')
    }

    // Get camera stream
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: maxWidth },
        height: { ideal: maxHeight },
        facingMode: 'user' // Front camera for selfies
      } 
    })

    video.srcObject = stream
    video.play()

    // Wait for video to be ready
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve
    })

    // Set canvas size
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0)

    // Stop the stream
    stream.getTracks().forEach(track => track.stop())

    // Convert to base64
    const base64 = canvas.toDataURL('image/jpeg', quality)
    
    return {
      success: true,
      uri: base64,
      base64: base64.split(',')[1],
      width: canvas.width,
      height: canvas.height
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Camera capture failed'
    }
  }
}

// Select image from gallery
export const selectFromGallery = async (options: CameraOptions = {}): Promise<CameraResult> => {
  const { quality = 0.8, maxWidth = 1024, maxHeight = 1024 } = options

  return new Promise((resolve) => {
    if (!isGalleryAvailable()) {
      resolve({
        success: false,
        error: 'Gallery not available'
      })
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment' // Use camera if available

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) {
        resolve({
          success: false,
          error: 'No file selected'
        })
        return
      }

      try {
        // Create canvas for image processing
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        if (!ctx) {
          throw new Error('Canvas context not available')
        }

        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width *= ratio
            height *= ratio
          }

          canvas.width = width
          canvas.height = height

          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height)
          const base64 = canvas.toDataURL('image/jpeg', quality)

          resolve({
            success: true,
            uri: base64,
            base64: base64.split(',')[1],
            width,
            height,
            fileSize: file.size
          })
        }

        img.onerror = () => {
          resolve({
            success: false,
            error: 'Failed to load image'
          })
        }

        img.src = URL.createObjectURL(file)
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Image processing failed'
        })
      }
    }

    input.click()
  })
}

// Show image picker with options
export const showImagePicker = async (options: CameraOptions = {}): Promise<CameraResult> => {
  const { source = 'prompt' } = options

  if (source === 'camera') {
    return captureImage(options)
  } else if (source === 'gallery') {
    return selectFromGallery(options)
  } else {
    // Show prompt to user
    return new Promise((resolve) => {
      const modal = document.createElement('div')
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 m-4 max-w-sm w-full">
          <h3 class="text-lg font-semibold mb-4">Select Image Source</h3>
          <div class="space-y-3">
            <button id="camera-btn" class="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              📷 Take Photo
            </button>
            <button id="gallery-btn" class="w-full p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              🖼️ Choose from Gallery
            </button>
            <button id="cancel-btn" class="w-full p-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
              Cancel
            </button>
          </div>
        </div>
      `

      document.body.appendChild(modal)

      const cleanup = () => {
        document.body.removeChild(modal)
      }

      modal.querySelector('#camera-btn')?.addEventListener('click', async () => {
        cleanup()
        const result = await captureImage(options)
        resolve(result)
      })

      modal.querySelector('#gallery-btn')?.addEventListener('click', async () => {
        cleanup()
        const result = await selectFromGallery(options)
        resolve(result)
      })

      modal.querySelector('#cancel-btn')?.addEventListener('click', () => {
        cleanup()
        resolve({
          success: false,
          error: 'User cancelled'
        })
      })

      // Click outside to cancel
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          cleanup()
          resolve({
            success: false,
            error: 'User cancelled'
          })
        }
      })
    })
  }
}

// QR Code Scanner (using web APIs)
export interface QRScanResult {
  success: boolean
  data?: string
  error?: string
}

export const scanQRCode = async (): Promise<QRScanResult> => {
  try {
    if (!isCameraAvailable()) {
      throw new Error('Camera not available')
    }

    // For web implementation, we'd typically use a library like zxing-js
    // For now, return a mock implementation
    return new Promise((resolve) => {
      // In a real implementation, you'd integrate with a QR scanning library
      // like zxing-js/library or qr-scanner
      setTimeout(() => {
        resolve({
          success: true,
          data: 'sample-qr-data'
        })
      }, 2000)
    })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'QR scan failed'
    }
  }
} 