// Sharing APIs for Social Media and Messaging Integration

export interface ShareData {
  title?: string
  text?: string
  url?: string
  files?: File[]
}

export interface ShareOptions {
  fallback?: 'copy' | 'modal' | 'none'
  platforms?: SocialPlatform[]
}

export type SocialPlatform = 
  | 'whatsapp' 
  | 'telegram' 
  | 'twitter' 
  | 'facebook' 
  | 'instagram' 
  | 'linkedin' 
  | 'sms' 
  | 'email' 
  | 'copy'

// Check if Web Share API is supported
export const isWebShareSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'share' in navigator
}

// Check if share data is supported
export const canShare = (data: ShareData): boolean => {
  if (!isWebShareSupported()) return false
  return navigator.canShare ? navigator.canShare(data) : true
}

// Native share using Web Share API
export const shareNative = async (data: ShareData): Promise<boolean> => {
  try {
    if (!isWebShareSupported()) {
      throw new Error('Web Share API not supported')
    }

    if (!canShare(data)) {
      throw new Error('Share data not supported')
    }

    await navigator.share(data)
    return true
  } catch (error) {
    console.error('Native share failed:', error)
    return false
  }
}

// Share to specific platforms
const shareUrls = {
  whatsapp: (text: string, url?: string) => 
    `https://wa.me/?text=${encodeURIComponent(text)}${url ? `%20${encodeURIComponent(url)}` : ''}`,
  
  telegram: (text: string, url?: string) => 
    `https://t.me/share/url?url=${encodeURIComponent(url || '')}&text=${encodeURIComponent(text)}`,
  
  twitter: (text: string, url?: string) => 
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}${url ? `&url=${encodeURIComponent(url)}` : ''}`,
  
  facebook: (text: string, url?: string) => 
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url || '')}&quote=${encodeURIComponent(text)}`,
  
  linkedin: (text: string, url?: string) => 
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url || '')}&summary=${encodeURIComponent(text)}`,
  
  sms: (text: string) => 
    `sms:?body=${encodeURIComponent(text)}`,
  
  email: (text: string, subject?: string, url?: string) => 
    `mailto:?subject=${encodeURIComponent(subject || 'Shared from PadiPay')}&body=${encodeURIComponent(text)}${url ? `%0A%0A${encodeURIComponent(url)}` : ''}`
}

// Share to specific platform
export const shareToPlatform = (platform: SocialPlatform, data: ShareData): boolean => {
  try {
    const { title = '', text = '', url } = data
    const shareText = title ? `${title}\n\n${text}` : text

    if (platform === 'copy') {
      return copyToClipboard(shareText + (url ? `\n\n${url}` : ''))
    }

    let shareUrl: string

    switch (platform) {
      case 'whatsapp':
        shareUrl = shareUrls.whatsapp(shareText, url)
        break
      case 'telegram':
        shareUrl = shareUrls.telegram(shareText, url)
        break
      case 'twitter':
        shareUrl = shareUrls.twitter(shareText, url)
        break
      case 'facebook':
        shareUrl = shareUrls.facebook(shareText, url)
        break
      case 'linkedin':
        shareUrl = shareUrls.linkedin(shareText, url)
        break
      case 'sms':
        shareUrl = shareUrls.sms(shareText)
        break
      case 'email':
        shareUrl = shareUrls.email(text, title, url)
        break
      default:
        throw new Error(`Platform ${platform} not supported`)
    }

    // Open in new window/tab
    window.open(shareUrl, '_blank', 'width=600,height=400')
    return true
  } catch (error) {
    console.error(`Failed to share to ${platform}:`, error)
    return false
  }
}

// Copy to clipboard
export const copyToClipboard = (text: string): boolean => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      return successful
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

// Show share modal with platform options
export const showShareModal = (data: ShareData, options: ShareOptions = {}): Promise<boolean> => {
  return new Promise((resolve) => {
    const { platforms = ['whatsapp', 'telegram', 'twitter', 'sms', 'email', 'copy'] } = options

    // Create modal
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50'
    
    const platformIcons = {
      whatsapp: '📲',
      telegram: '✈️',
      twitter: '🐦',
      facebook: '📘',
      instagram: '📷',
      linkedin: '💼',
      sms: '💬',
      email: '📧',
      copy: '📋'
    }

    const platformNames = {
      whatsapp: 'WhatsApp',
      telegram: 'Telegram',
      twitter: 'Twitter',
      facebook: 'Facebook',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      sms: 'SMS',
      email: 'Email',
      copy: 'Copy Link'
    }

    const platformButtons = platforms.map(platform => `
      <button 
        class="share-platform-btn flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors" 
        data-platform="${platform}"
      >
        <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl mb-2">
          ${platformIcons[platform]}
        </div>
        <span class="text-sm text-gray-700">${platformNames[platform]}</span>
      </button>
    `).join('')

    modal.innerHTML = `
      <div class="bg-white rounded-t-lg sm:rounded-lg w-full sm:max-w-md sm:m-4 max-h-96 flex flex-col">
        <div class="p-4 border-b">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Share</h3>
            <button id="close-btn" class="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          ${data.title ? `<p class="text-sm text-gray-600 mt-1">${data.title}</p>` : ''}
        </div>
        <div class="p-4">
          <div class="grid grid-cols-3 gap-2">
            ${platformButtons}
          </div>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    const cleanup = () => {
      document.body.removeChild(modal)
    }

    // Handle platform selection
    modal.addEventListener('click', (e) => {
      const platformBtn = (e.target as Element).closest('.share-platform-btn')
      if (platformBtn) {
        const platform = platformBtn.getAttribute('data-platform') as SocialPlatform
        const success = shareToPlatform(platform, data)
        cleanup()
        resolve(success)
      }
    })

    // Handle close button
    modal.querySelector('#close-btn')?.addEventListener('click', () => {
      cleanup()
      resolve(false)
    })

    // Click outside to cancel
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cleanup()
        resolve(false)
      }
    })
  })
}

// Share with automatic fallback
export const share = async (data: ShareData, options: ShareOptions = {}): Promise<boolean> => {
  const { fallback = 'modal' } = options

  // Try native share first
  if (isWebShareSupported() && canShare(data)) {
    const success = await shareNative(data)
    if (success) return true
  }

  // Fallback options
  switch (fallback) {
    case 'copy':
      const shareText = data.title ? `${data.title}\n\n${data.text}` : data.text || ''
      return copyToClipboard(shareText + (data.url ? `\n\n${data.url}` : ''))
    
    case 'modal':
      return showShareModal(data, options)
    
    case 'none':
      return false
    
    default:
      return false
  }
}

// Specific sharing functions for common use cases

// Share payment link
export const sharePaymentLink = (amount: number, currency: string, recipient: string, link: string): Promise<boolean> => {
  const data: ShareData = {
    title: 'PadiPay Payment Request',
    text: `${recipient} is requesting ${currency} ${amount.toLocaleString()} via PadiPay`,
    url: link
  }
  
  return share(data, {
    platforms: ['whatsapp', 'telegram', 'sms', 'email', 'copy']
  })
}

// Share transaction receipt
export const shareTransactionReceipt = (transactionId: string, amount: number, currency: string, recipient: string): Promise<boolean> => {
  const data: ShareData = {
    title: 'PadiPay Transaction Receipt',
    text: `Successfully sent ${currency} ${amount.toLocaleString()} to ${recipient}\n\nTransaction ID: ${transactionId}\n\nPowered by PadiPay`,
    url: `https://padipay.app/receipt/${transactionId}`
  }
  
  return share(data, {
    platforms: ['whatsapp', 'telegram', 'twitter', 'email', 'copy']
  })
}

// Share app referral
export const shareAppReferral = (referralCode: string): Promise<boolean> => {
  const data: ShareData = {
    title: 'Join PadiPay - Fast & Secure Payments',
    text: `Join me on PadiPay for fast, secure payments across Africa! Use my referral code: ${referralCode} and get bonus rewards.`,
    url: `https://padipay.app/join?ref=${referralCode}`
  }
  
  return share(data, {
    platforms: ['whatsapp', 'telegram', 'twitter', 'facebook', 'sms', 'copy']
  })
}

// Share QR code
export const shareQRCode = (qrCodeUrl: string, purpose: string = 'payment'): Promise<boolean> => {
  const data: ShareData = {
    title: `PadiPay ${purpose} QR Code`,
    text: `Scan this QR code for ${purpose} with PadiPay`,
    url: qrCodeUrl
  }
  
  return share(data, {
    platforms: ['whatsapp', 'telegram', 'email', 'copy']
  })
}

// Generate shareable links
export const generateShareableLink = (type: 'payment' | 'profile' | 'referral', data: Record<string, any>): string => {
  const baseUrl = 'https://padipay.app'
  
  switch (type) {
    case 'payment':
      return `${baseUrl}/pay?amount=${data.amount}&currency=${data.currency}&to=${encodeURIComponent(data.recipient)}&ref=${data.transactionId}`
    
    case 'profile':
      return `${baseUrl}/profile/${data.userId}?name=${encodeURIComponent(data.name)}`
    
    case 'referral':
      return `${baseUrl}/join?ref=${data.referralCode}&from=${encodeURIComponent(data.referrerName)}`
    
    default:
      return baseUrl
  }
} 