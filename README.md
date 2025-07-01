# PadiPay 🚀

**Fast, Secure, and User-Friendly Web3 Payments for Africa**

PadiPay is a modern Web3 payment application designed specifically for the African market, combining blockchain technology with intuitive user experience. Built with Next.js, TypeScript, and comprehensive device API integrations.

[![Next.js](https://img.shields.io/badge/Next.js-13+-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0+-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🌟 Features

### 💰 Core Payment Features
- **Smart Amount Calculator** - Interactive number pad with currency formatting
- **Multi-Currency Support** - NGN, USD, EUR, GHS, KES, and more African currencies
- **Contact Integration** - Send money directly to contacts with phone number lookup
- **QR Code Payments** - Generate and scan QR codes for instant payments
- **Transaction History** - Comprehensive transaction tracking with search and filters
- **Payment Confirmation** - Detailed review screens with fee breakdown

### 🔐 Security & Authentication
- **Biometric Authentication** - Fingerprint/Face ID login with WebAuthn
- **Device Lock Integration** - PIN/password fallback authentication
- **2FA Support** - Two-factor authentication for enhanced security
- **Security Center** - Comprehensive security score and monitoring
- **Encrypted Storage** - Secure local storage for sensitive data

### 📱 Mobile-First Experience
- **Responsive Design** - Optimized for mobile, tablet, and desktop
- **Progressive Web App** - Installable with offline capabilities
- **Touch Gestures** - Swipe, pinch, and tap interactions
- **Camera Integration** - Profile pictures and document scanning
- **Push Notifications** - Real-time transaction and security alerts

### 🎨 User Experience
- **Smooth Animations** - Success animations with confetti effects
- **Loading States** - Skeleton screens and progress indicators
- **Error Handling** - Comprehensive error boundaries and user feedback
- **Dark/Light Mode** - System preference or manual theme selection
- **Accessibility** - Screen reader support and keyboard navigation

### 🌍 African Market Focus
- **Multi-Language Support** - English with planned local language support
- **Regional Currencies** - Support for major African currencies
- **Local Payment Methods** - Integration with popular African payment providers
- **Cultural UI/UX** - Design patterns familiar to African users

## 🏗️ Technical Architecture

### Frontend Stack
```
├── Next.js 13+ (App Router)
├── TypeScript 5.0+
├── Tailwind CSS 3.0+
├── Shadcn/UI Components
├── Lucide React Icons
├── React Hook Form
└── Zustand (State Management)
```

### Smart Contract
```
├── Hardhat Development Environment
├── Solidity Smart Contracts
├── TypeScript Testing Suite
├── Deployment Scripts
└── Contract Verification
```

### Device APIs & Integrations
```
├── Camera & Gallery Access
├── Contact Picker Integration
├── Secure Local Storage
├── Biometric Authentication (WebAuthn)
├── Social Media Sharing
├── Animation System
└── Progressive Web App Features
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/padipay.git
cd padipay
```

2. **Install dependencies**
```bash
# Frontend
cd frontend
npm install

# Smart Contract
cd ../contract
npm install
```

3. **Environment Setup**
```bash
# Frontend (.env.local)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STORAGE_KEY=your-encryption-key
NEXT_PUBLIC_WEBAUTHN_RP_ID=localhost
NEXT_PUBLIC_WEBAUTHN_RP_NAME=PadiPay

# Contract (.env)
PRIVATE_KEY=your-private-key
INFURA_API_KEY=your-infura-key
ETHERSCAN_API_KEY=your-etherscan-key
```

4. **Start Development Servers**
```bash
# Frontend (Terminal 1)
cd frontend
npm run dev

# Smart Contract Node (Terminal 2)
cd contract
npx hardhat node
```

5. **Deploy Contracts** (Optional)
```bash
cd contract
npx hardhat run scripts/deploy.ts --network localhost
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
padipay/
├── frontend/                 # Next.js Frontend Application
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   │   ├── auth/        # Authentication components
│   │   │   ├── forms/       # Form components
│   │   │   ├── layout/      # Layout components
│   │   │   ├── transaction/ # Payment & transaction components
│   │   │   ├── wallet/      # Wallet & dashboard components
│   │   │   └── ui/          # Reusable UI components
│   │   ├── lib/             # Utility libraries
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── camera.ts    # Camera & gallery APIs
│   │   │   ├── contacts.ts  # Contact picker APIs
│   │   │   ├── storage.ts   # Secure storage utilities
│   │   │   ├── animations.ts# Animation system
│   │   │   ├── sharing.ts   # Social sharing APIs
│   │   │   ├── biometrics.ts# Biometric authentication
│   │   │   └── utils.ts     # General utilities
│   │   └── styles/          # Global styles
│   ├── public/              # Static assets
│   └── package.json
├── contract/                # Smart Contract Development
│   ├── contracts/           # Solidity contracts
│   ├── scripts/             # Deployment scripts
│   ├── test/                # Contract tests
│   └── hardhat.config.ts    # Hardhat configuration
└── README.md
```

## 🎯 Usage Examples

### Basic Payment Flow
```typescript
import { useTechnicalAPIs } from '@/lib/hooks/useTechnicalAPIs'

export const SendMoney = () => {
  const { contacts, sharing } = useTechnicalAPIs()

  const handleSendMoney = async () => {
    // 1. Pick recipient from contacts
    const contact = await contacts.pickContact()
    
    // 2. Process payment (your payment logic)
    const result = await processPayment({
      recipient: contact.phoneNumbers[0],
      amount: 1000,
      currency: 'NGN'
    })
    
    // 3. Share transaction receipt
    if (result.success) {
      await sharing.shareReceipt(
        result.transactionId,
        1000,
        'NGN',
        contact.name
      )
    }
  }

  return (
    <Button onClick={handleSendMoney}>
      Send Money
    </Button>
  )
}
```

### Camera Integration
```typescript
import { useCamera } from '@/lib/hooks/useTechnicalAPIs'

export const ProfilePicture = () => {
  const { openImagePicker } = useCamera()

  const handleUpdatePhoto = async () => {
    const result = await openImagePicker({
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800
    })
    
    if (result.success) {
      // Use result.uri for display
      // Use result.base64 for upload
      await uploadProfilePicture(result.base64)
    }
  }

  return (
    <Button onClick={handleUpdatePhoto}>
      Update Photo
    </Button>
  )
}
```

### Biometric Authentication
```typescript
import { useBiometric } from '@/lib/hooks/useTechnicalAPIs'

export const SecureAction = () => {
  const { authenticate, isSupported } = useBiometric()

  const handleSecureAction = async () => {
    if (isSupported) {
      const result = await authenticate({
        promptMessage: 'Authenticate to continue'
      })
      
      if (result.success) {
        // Perform secure action
        proceedWithSecureAction()
      }
    }
  }

  return (
    <Button 
      onClick={handleSecureAction}
      disabled={!isSupported}
    >
      Secure Action
    </Button>
  )
}
```

## 🧪 Testing

### Run Tests
```bash
# Frontend tests
cd frontend
npm run test

# Contract tests
cd contract
npm run test

# E2E tests
npm run test:e2e
```

### Test Technical APIs
```typescript
import { TechnicalIntegration } from '@/components/examples/TechnicalIntegration'

// Full-featured test component
<TechnicalIntegration />
```

## 🔧 Configuration

### Feature Flags
```typescript
// lib/config.ts
export const FEATURES = {
  BIOMETRIC_AUTH: true,
  CONTACT_PICKER: true,
  CAMERA_UPLOAD: true,
  SOCIAL_SHARING: true,
  ANIMATIONS: true,
  QR_PAYMENTS: true,
  MULTI_CURRENCY: true
}
```

### Supported Currencies
```typescript
export const CURRENCIES = {
  NGN: { name: 'Nigerian Naira', symbol: '₦', decimals: 2 },
  USD: { name: 'US Dollar', symbol: '$', decimals: 2 },
  EUR: { name: 'Euro', symbol: '€', decimals: 2 },
  GHS: { name: 'Ghanaian Cedi', symbol: '₵', decimals: 2 },
  KES: { name: 'Kenyan Shilling', symbol: 'KSh', decimals: 2 },
  ZAR: { name: 'South African Rand', symbol: 'R', decimals: 2 }
}
```

## 🔒 Security Features

### Data Protection
- **End-to-end Encryption** - All sensitive data encrypted
- **Secure Storage** - Local storage with encryption
- **No Plain Text Secrets** - All keys and passwords hashed
- **Session Management** - Secure session handling

### Authentication Methods
- **Biometric Login** - Fingerprint/Face ID
- **Device Lock** - PIN/Pattern/Password
- **2FA Support** - TOTP and SMS verification
- **Social Login** - OAuth integration (planned)

### Privacy Protection
- **No Data Collection** - User data stays on device
- **Permission-Based Access** - Explicit user consent
- **Audit Logging** - Security event tracking
- **Data Portability** - Export user data

## 🌐 API Documentation

### Camera & Gallery
```typescript
// Image picker with options
const result = await showImagePicker({
  quality: 0.8,
  maxWidth: 1024,
  maxHeight: 1024,
  source: 'prompt' // 'camera' | 'gallery' | 'prompt'
})

// QR code scanning
const qrResult = await scanQRCode()
```

### Contacts Integration
```typescript
// Contact picker
const contact = await showContactPicker()

// Search contacts
const results = await searchContacts('John')
```

### Secure Storage
```typescript
// Store user preferences
setUserPreferences({
  theme: 'dark',
  currency: 'NGN',
  notifications: { transactions: true }
})

// Retrieve preferences
const preferences = getUserPreferences()
```

### Social Sharing
```typescript
// Share transaction receipt
await shareTransactionReceipt(
  'tx_123',
  1000,
  'NGN',
  'John Doe'
)

// Share payment link
await sharePaymentLink(500, 'USD', 'Alice', 'pay.link/abc')
```

## 🚢 Deployment

### Frontend Deployment (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

### Smart Contract Deployment
```bash
# Deploy to testnet
npx hardhat run scripts/deploy.ts --network goerli

# Deploy to mainnet
npx hardhat run scripts/deploy.ts --network mainnet
```

### Environment Variables (Production)
```env
NEXT_PUBLIC_APP_URL=https://padipay.app
NEXT_PUBLIC_STORAGE_KEY=production-encryption-key
NEXT_PUBLIC_WEBAUTHN_RP_ID=padipay.app
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_INFURA_PROJECT_ID=your-infura-id
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- **TypeScript** - Strict mode enabled
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **Husky** - Pre-commit hooks
- **Conventional Commits** - Commit message format

## 🐛 Known Issues

### Browser Compatibility
- **Safari iOS < 14** - Limited WebAuthn support
- **Firefox** - Some biometric features unavailable
- **Chrome Android** - Full feature support

### Technical Limitations
- **Web Contacts API** - Limited browser support
- **QR Scanning** - Requires library integration for production
- **Push Notifications** - Service worker implementation needed

## 🛣️ Roadmap

### Q1 2024
- [ ] Advanced biometric authentication (voice, iris)
- [ ] NFC payment integration  
- [ ] Offline transaction queuing
- [ ] Multi-language support (French, Swahili, Yoruba)

### Q2 2024
- [ ] Cross-chain payment support
- [ ] DeFi integration (lending, staking)
- [ ] Merchant payment solutions
- [ ] Analytics dashboard

### Q3 2024
- [ ] Mobile app (React Native)
- [ ] Hardware wallet integration
- [ ] Advanced security features
- [ ] Enterprise solutions

## 📊 Performance

### Core Web Vitals
- **LCP**: < 2.5s (First Contentful Paint)
- **FID**: < 100ms (First Input Delay)  
- **CLS**: < 0.1 (Cumulative Layout Shift)

### Bundle Sizes
- **Initial JS**: ~150KB gzipped
- **CSS**: ~25KB gzipped
- **Images**: WebP format, lazy loading
- **Fonts**: Variable fonts, preloaded

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Shadcn/UI** - Beautiful component library
- **Lucide React** - Comprehensive icon set
- **Tailwind CSS** - Utility-first CSS framework
- **Next.js** - React framework for production
- **African Developer Community** - Inspiration and feedback

## 📞 Support

- **Documentation**: [docs.padipay.app](https://docs.padipay.app)
- **Discord**: [Join our community](https://discord.gg/padipay)
- **Email**: support@padipay.app
- **Twitter**: [@PadiPayApp](https://twitter.com/PadiPayApp)

---

<div align="center">
  <strong>Built with ❤️ for Africa by the PadiPay Team</strong>
</div>
