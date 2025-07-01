"use client"

import React, { useState } from 'react'
import { 
  Search, 
  HelpCircle, 
  MessageCircle, 
  Phone, 
  Mail,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  BookOpen,
  Video,
  FileText,
  ExternalLink,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

interface HelpCenterProps {
  onBack?: () => void
  onContactSupport?: (method: string) => void
}

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  helpful: number
  notHelpful: number
}

interface HelpArticle {
  id: string
  title: string
  description: string
  category: string
  readTime: number
  popular: boolean
}

export default function HelpCenter({ onBack, onContactSupport }: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const categories = [
    { id: 'all', name: 'All Topics', count: 24 },
    { id: 'payments', name: 'Payments', count: 8 },
    { id: 'security', name: 'Security', count: 6 },
    { id: 'account', name: 'Account', count: 5 },
    { id: 'technical', name: 'Technical', count: 5 }
  ]

  const faqs: FAQItem[] = [
    {
      id: '1',
      question: 'How do I send money to someone?',
      answer: 'To send money, tap the "Send" button on your home screen, enter the recipient\'s phone number or select from contacts, enter the amount, and confirm the transaction with your PIN.',
      category: 'payments',
      helpful: 45,
      notHelpful: 3
    },
    {
      id: '2',
      question: 'Is my money safe with PadiPay?',
      answer: 'Yes, your money is completely safe. We use bank-level encryption, secure servers, and are regulated by the Central Bank. Your funds are also insured and held in licensed banks.',
      category: 'security',
      helpful: 62,
      notHelpful: 1
    },
    {
      id: '3',
      question: 'What are the transaction limits?',
      answer: 'Daily limits depend on your verification level: Basic (₦50,000), Intermediate (₦200,000), Advanced (₦1,000,000). Single transaction limit is ₦100,000.',
      category: 'payments',
      helpful: 38,
      notHelpful: 2
    },
    {
      id: '4',
      question: 'How do I verify my account?',
      answer: 'Go to Settings > KYC Verification. Upload a valid ID (National ID, Driver\'s License, or Passport), take a selfie, and provide your BVN. Verification usually takes 24-48 hours.',
      category: 'account',
      helpful: 29,
      notHelpful: 1
    },
    {
      id: '5',
      question: 'What should I do if I forgot my PIN?',
      answer: 'On the login screen, tap "Forgot PIN", verify your identity with biometrics or SMS code, then create a new PIN. You can also reset it from Settings > Security.',
      category: 'security',
      helpful: 33,
      notHelpful: 0
    }
  ]

  const articles: HelpArticle[] = [
    {
      id: '1',
      title: 'Getting Started with PadiPay',
      description: 'Learn the basics of setting up and using your PadiPay wallet',
      category: 'account',
      readTime: 5,
      popular: true
    },
    {
      id: '2',
      title: 'Understanding Transaction Fees',
      description: 'How our fee structure works for different types of transactions',
      category: 'payments',
      readTime: 3,
      popular: true
    },
    {
      id: '3',
      title: 'Setting Up Two-Factor Authentication',
      description: 'Step-by-step guide to enable 2FA for better security',
      category: 'security',
      readTime: 4,
      popular: false
    }
  ]

  const contactOptions = [
    {
      method: 'chat',
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team',
      available: 'Available 24/7',
      color: 'bg-blue-600'
    },
    {
      method: 'phone',
      icon: Phone,
      title: 'Call Us',
      description: '+234 700 PADIPAY',
      available: 'Mon-Fri 8AM-6PM',
      color: 'bg-green-600'
    },
    {
      method: 'email',
      icon: Mail,
      title: 'Email Support',
      description: 'support@padipay.com',
      available: 'Response within 24hrs',
      color: 'bg-purple-600'
    }
  ]

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold">Help Center</h1>
          <div className="w-5"></div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {contactOptions.map((option) => (
            <button
              key={option.method}
              onClick={() => onContactSupport?.(option.method)}
              className={`${option.color} text-white p-4 rounded-xl flex flex-col items-center space-y-2 transition-transform hover:scale-105`}
            >
              <option.icon size={24} />
              <div className="text-center">
                <p className="text-xs font-medium">{option.title}</p>
                <p className="text-xs opacity-90">{option.available}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto space-x-2 pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>

        {/* Popular Articles */}
        {selectedCategory === 'all' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Popular Articles</h2>
            <div className="space-y-2">
              {articles.filter(article => article.popular).map((article) => (
                <Card key={article.id} className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen size={20} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{article.title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {article.readTime} min
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{article.description}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* FAQs */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            Frequently Asked Questions
            {filteredFAQs.length !== faqs.length && (
              <span className="text-sm text-gray-500 ml-2">
                ({filteredFAQs.length} results)
              </span>
            )}
          </h2>
          
          {filteredFAQs.length === 0 ? (
            <Card className="p-8 text-center">
              <HelpCircle size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search terms or browse different categories
              </p>
              <Button onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredFAQs.map((faq) => (
                <Card key={faq.id} className="overflow-hidden">
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium pr-4">{faq.question}</h3>
                      {expandedFAQ === faq.id ? (
                        <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                  
                  {expandedFAQ === faq.id && (
                    <div className="px-4 pb-4 border-t bg-gray-50">
                      <p className="text-gray-700 py-3">{faq.answer}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Was this helpful?</span>
                        <div className="flex items-center space-x-4">
                          <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-green-600">
                            <ThumbsUp size={14} />
                            <span>{faq.helpful}</span>
                          </button>
                          <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-600">
                            <ThumbsDown size={14} />
                            <span>{faq.notHelpful}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* All Articles */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">All Articles</h2>
          <div className="space-y-2">
            {articles.map((article) => (
              <Card key={article.id} className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{article.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {article.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {article.readTime} min
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{article.description}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Still need help? */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="text-center space-y-3">
            <h3 className="text-lg font-semibold">Still need help?</h3>
            <p className="text-gray-600 text-sm">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col space-y-2">
              <Button onClick={() => onContactSupport?.('chat')}>
                <MessageCircle size={16} className="mr-2" />
                Start Live Chat
              </Button>
              <Button variant="outline" onClick={() => onContactSupport?.('email')}>
                <Mail size={16} className="mr-2" />
                Send Email
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 