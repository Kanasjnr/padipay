// Contacts Access Utilities
export interface Contact {
  id: string
  name: string
  phoneNumbers: string[]
  emails?: string[]
  avatar?: string
  displayName: string
}

export interface ContactsPermission {
  granted: boolean
  message?: string
}

// Check if contacts API is available (limited in web browsers)
export const isContactsAvailable = (): boolean => {
  // Contacts API is very limited in web browsers for privacy reasons
  // Most implementations will need to use a contact picker or manual entry
  return 'contacts' in navigator || 'contactsManager' in navigator
}

// Request contacts permission
export const requestContactsPermission = async (): Promise<ContactsPermission> => {
  try {
    // For web, we can only check if the API is available
    // Actual permission is requested when accessing contacts
    if (!isContactsAvailable()) {
      return {
        granted: false,
        message: 'Contacts API not available in this browser'
      }
    }

    return {
      granted: true,
      message: 'Contacts permission available'
    }
  } catch (error) {
    return {
      granted: false,
      message: error instanceof Error ? error.message : 'Permission denied'
    }
  }
}

// Get all contacts (limited web implementation)
export const getAllContacts = async (): Promise<Contact[]> => {
  try {
    // Web browsers have limited access to contacts for privacy
    // This would typically require user interaction for each contact selection
    
    // Return mock contacts for demo purposes
    const mockContacts: Contact[] = [
      {
        id: '1',
        name: 'Kemi Adebayo',
        phoneNumbers: ['+234 810 123 4567'],
        emails: ['kemi@email.com'],
        displayName: 'Kemi Adebayo',
        avatar: undefined
      },
      {
        id: '2',
        name: 'John Mwangi',
        phoneNumbers: ['+254 712 345 678'],
        emails: ['john@email.com'],
        displayName: 'John Mwangi',
        avatar: undefined
      },
      {
        id: '3',
        name: 'Aisha Mohammed',
        phoneNumbers: ['+233 244 567 890'],
        emails: ['aisha@email.com'],
        displayName: 'Aisha Mohammed',
        avatar: undefined
      }
    ]

    return mockContacts
  } catch (error) {
    console.error('Failed to get contacts:', error)
    return []
  }
}

// Search contacts by name or phone
export const searchContacts = async (query: string): Promise<Contact[]> => {
  const allContacts = await getAllContacts()
  
  if (!query.trim()) {
    return allContacts
  }

  const searchTerm = query.toLowerCase()
  return allContacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm) ||
    contact.phoneNumbers.some(phone => phone.includes(searchTerm)) ||
    contact.emails?.some(email => email.toLowerCase().includes(searchTerm))
  )
}

// Show contact picker
export const showContactPicker = async (): Promise<Contact | null> => {
  return new Promise(async (resolve) => {
    const contacts = await getAllContacts()
    
    // Create modal for contact selection
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    
    const contactList = contacts.map(contact => `
      <div class="contact-item p-3 border-b hover:bg-gray-50 cursor-pointer" data-contact='${JSON.stringify(contact)}'>
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span class="text-blue-600 font-semibold text-sm">
              ${contact.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <p class="font-medium text-gray-900">${contact.name}</p>
            <p class="text-sm text-gray-600">${contact.phoneNumbers[0]}</p>
          </div>
        </div>
      </div>
    `).join('')

    modal.innerHTML = `
      <div class="bg-white rounded-lg m-4 max-w-md w-full max-h-96 flex flex-col">
        <div class="p-4 border-b">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Select Contact</h3>
            <button id="close-btn" class="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <input 
            id="search-input" 
            type="text" 
            placeholder="Search contacts..." 
            class="w-full mt-3 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div id="contacts-list" class="flex-1 overflow-y-auto">
          ${contactList}
        </div>
      </div>
    `

    document.body.appendChild(modal)

    const cleanup = () => {
      document.body.removeChild(modal)
    }

    // Handle contact selection
    modal.addEventListener('click', (e) => {
      const contactItem = (e.target as Element).closest('.contact-item')
      if (contactItem) {
        const contactData = JSON.parse(contactItem.getAttribute('data-contact') || '{}')
        cleanup()
        resolve(contactData)
      }
    })

    // Handle close button
    modal.querySelector('#close-btn')?.addEventListener('click', () => {
      cleanup()
      resolve(null)
    })

    // Handle search
    const searchInput = modal.querySelector('#search-input') as HTMLInputElement
    const contactsList = modal.querySelector('#contacts-list')
    
    searchInput?.addEventListener('input', async (e) => {
      const query = (e.target as HTMLInputElement).value
      const filteredContacts = await searchContacts(query)
      
      const newContactList = filteredContacts.map(contact => `
        <div class="contact-item p-3 border-b hover:bg-gray-50 cursor-pointer" data-contact='${JSON.stringify(contact)}'>
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="text-blue-600 font-semibold text-sm">
                ${contact.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <p class="font-medium text-gray-900">${contact.name}</p>
              <p class="text-sm text-gray-600">${contact.phoneNumbers[0]}</p>
            </div>
          </div>
        </div>
      `).join('')
      
      if (contactsList) {
        contactsList.innerHTML = newContactList
      }
    })

    // Click outside to cancel
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cleanup()
        resolve(null)
      }
    })
  })
}

// Add contact to device (if supported)
export const addContact = async (contact: Omit<Contact, 'id'>): Promise<boolean> => {
  try {
    // In a real app, this would integrate with the device's contact API
    // For web, we can only suggest the user to manually add the contact
    
    // Create a vCard format for easy sharing
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
TEL:${contact.phoneNumbers[0]}
${contact.emails ? `EMAIL:${contact.emails[0]}` : ''}
END:VCARD`

    // Create downloadable vCard file
    const blob = new Blob([vCard], { type: 'text/vcard' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${contact.name.replace(/\s+/g, '_')}.vcf`
    link.click()
    
    URL.revokeObjectURL(url)
    return true
  } catch (error) {
    console.error('Failed to add contact:', error)
    return false
  }
}

// Format phone number for display
export const formatPhoneNumber = (phone: string, countryCode?: string): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Format based on length and country
  if (digits.length === 11 && digits.startsWith('234')) {
    // Nigerian number
    return `+234 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`
  } else if (digits.length === 10 && !digits.startsWith('234')) {
    // Local number without country code
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  
  // Default formatting
  return phone
}

// Validate phone number
export const isValidPhoneNumber = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
} 