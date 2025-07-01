'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Share2, 
  Copy, 
  QrCode,
  MessageCircle,
  Send,
  Twitter,
  Facebook,
  Instagram,
  Mail,
  Smartphone,
  Link,
  Check,
  X,
  ArrowLeft,
  Download,
  Eye,
  Clock,
  Users
} from 'lucide-react';

interface PaymentLinkData {
  recipient: {
    name: string;
    phone: string;
    avatar?: string;
  };
  amount?: {
    value: number;
    currency: string;
    formatted: string;
  };
  note?: string;
  expiresAt?: Date;
  isFixedAmount?: boolean;
  allowCustomAmount?: boolean;
  minAmount?: number;
  maxAmount?: number;
}

interface ShareOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  action: (link: string, message: string) => void;
}

interface SharePaymentLinkProps {
  paymentData: PaymentLinkData;
  onBack?: () => void;
  onLinkGenerated?: (link: string) => void;
  baseUrl?: string;
  showAnalytics?: boolean;
}

export const SharePaymentLink: React.FC<SharePaymentLinkProps> = ({
  paymentData,
  onBack,
  onLinkGenerated,
  baseUrl = 'https://padipay.app',
  showAnalytics = true
}) => {
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [linkAnalytics, setLinkAnalytics] = useState({
    views: 0,
    clicks: 0,
    payments: 0
  });

  const linkRef = useRef<HTMLInputElement>(null);

  // Generate payment link
  const generatePaymentLink = (): string => {
    const params = new URLSearchParams({
      to: paymentData.recipient.phone,
      name: paymentData.recipient.name,
      ...(paymentData.amount && paymentData.isFixedAmount && { 
        amount: paymentData.amount.value.toString(),
        currency: paymentData.amount.currency 
      }),
      ...(paymentData.note && { note: paymentData.note }),
      ...(paymentData.expiresAt && { expires: paymentData.expiresAt.getTime().toString() }),
      ...(paymentData.allowCustomAmount && { customAmount: 'true' }),
      ...(paymentData.minAmount && { minAmount: paymentData.minAmount.toString() }),
      ...(paymentData.maxAmount && { maxAmount: paymentData.maxAmount.toString() }),
      source: 'share',
      timestamp: Date.now().toString()
    });
    
    const link = `${baseUrl}/pay?${params.toString()}`;
    
    if (onLinkGenerated) {
      onLinkGenerated(link);
    }
    
    return link;
  };

  // Initialize link on component mount
  React.useEffect(() => {
    const link = generatePaymentLink();
    setGeneratedLink(link);
  }, [paymentData]);

  // Message templates
  const messageTemplates = [
    `💰 Send me money easily with PadiPay!\n${paymentData.amount ? `Amount: ${paymentData.amount.formatted}` : 'Any amount'}`,
    `Hi! Please send payment via PadiPay 🚀\n${paymentData.note ? `For: ${paymentData.note}` : ''}`,
    `Quick payment request 💸\nTap the link to pay securely`,
    `${paymentData.recipient.name} is requesting payment\n${paymentData.amount ? paymentData.amount.formatted : 'Amount as needed'}`
  ];

  // Share options
  const shareOptions: ShareOption[] = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: <MessageCircle size={20} />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      action: (link, message) => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${message}\n\n${link}`)}`;
        window.open(whatsappUrl, '_blank');
      }
    },
    {
      id: 'sms',
      name: 'SMS',
      icon: <Send size={20} />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      action: (link, message) => {
        const smsUrl = `sms:?body=${encodeURIComponent(`${message}\n\n${link}`)}`;
        window.location.href = smsUrl;
      }
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: <Send size={20} />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      action: (link, message) => {
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`;
        window.open(telegramUrl, '_blank');
      }
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <Twitter size={20} />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-50',
      action: (link, message) => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${message}\n\n${link}`)}`;
        window.open(twitterUrl, '_blank');
      }
    },
    {
      id: 'email',
      name: 'Email',
      icon: <Mail size={20} />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      action: (link, message) => {
        const subject = `Payment Request - ${paymentData.recipient.name}`;
        const body = `${message}\n\nClick here to pay: ${link}`;
        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
      }
    },
    {
      id: 'copy',
      name: 'Copy Link',
      icon: <Copy size={20} />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      action: (link) => {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  ];

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Share with selected option
  const handleShare = (option: ShareOption) => {
    const message = customMessage || messageTemplates[selectedTemplate];
    option.action(generatedLink, message);
  };

  // Native share if available
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PadiPay Payment Request',
          text: customMessage || messageTemplates[selectedTemplate],
          url: generatedLink
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  // Get link expiry status
  const getLinkStatus = () => {
    if (!paymentData.expiresAt) return { status: 'active', text: 'Never expires' };
    
    const now = new Date();
    const expiry = paymentData.expiresAt;
    
    if (now > expiry) {
      return { status: 'expired', text: 'Expired' };
    }
    
    const hoursLeft = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hoursLeft < 24) {
      return { status: 'expiring', text: `Expires in ${hoursLeft}h` };
    }
    
    const daysLeft = Math.floor(hoursLeft / 24);
    return { status: 'active', text: `Expires in ${daysLeft}d` };
  };

  const linkStatus = getLinkStatus();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6 pt-8">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Share Payment Link</h1>
          <p className="text-sm text-gray-600">
            Share a secure link to receive payments
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Payment Summary */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                {paymentData.recipient.avatar ? (
                  <span className="text-indigo-600 font-semibold">
                    {paymentData.recipient.avatar}
                  </span>
                ) : (
                  <Users size={20} className="text-indigo-600" />
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {paymentData.recipient.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {paymentData.recipient.phone}
                </p>
                
                {paymentData.amount && (
                  <div className="mt-2">
                    <span className="text-lg font-bold text-green-600">
                      {paymentData.amount.formatted}
                    </span>
                    {!paymentData.isFixedAmount && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Suggested
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              {/* Link Status */}
              <div className="text-right">
                <Badge 
                  variant={linkStatus.status === 'expired' ? 'destructive' : 'secondary'}
                  className="mb-1"
                >
                  {linkStatus.text}
                </Badge>
                {paymentData.note && (
                  <p className="text-xs text-gray-500 mt-1">
                    {paymentData.note}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generated Link */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Link size={18} className="mr-2" />
              Payment Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                ref={linkRef}
                value={generatedLink}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button onClick={handleCopyLink} variant="outline">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
            
            {/* Link Analytics */}
            {showAnalytics && (
              <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Eye size={14} className="text-gray-600 mr-1" />
                    <span className="text-lg font-semibold">{linkAnalytics.views}</span>
                  </div>
                  <p className="text-xs text-gray-600">Views</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Smartphone size={14} className="text-blue-600 mr-1" />
                    <span className="text-lg font-semibold">{linkAnalytics.clicks}</span>
                  </div>
                  <p className="text-xs text-gray-600">Clicks</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Check size={14} className="text-green-600 mr-1" />
                    <span className="text-lg font-semibold">{linkAnalytics.payments}</span>
                  </div>
                  <p className="text-xs text-gray-600">Payments</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Message Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {messageTemplates.map((template, index) => (
                <Button
                  key={index}
                  variant={selectedTemplate === index ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTemplate(index)}
                  className="h-auto text-left p-3 whitespace-normal"
                >
                  <span className="text-xs">{template.slice(0, 50)}...</span>
                </Button>
              ))}
            </div>
            
            {/* Custom Message */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Custom Message (Optional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Write your custom message..."
                className="w-full p-3 border rounded-lg text-sm resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Share Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Share2 size={18} className="mr-2" />
              Share Via
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {shareOptions.map((option) => (
                <Button
                  key={option.id}
                  variant="outline"
                  onClick={() => handleShare(option)}
                  className="h-16 flex flex-col items-center justify-center space-y-1"
                >
                  <div className={`p-2 rounded-full ${option.bgColor}`}>
                    <div className={option.color}>
                      {option.icon}
                    </div>
                  </div>
                  <span className="text-xs font-medium">{option.name}</span>
                </Button>
              ))}
            </div>
            
            {/* Native Share Button (if available) */}
            {navigator.share && (
              <Button
                onClick={handleNativeShare}
                className="w-full mt-4"
                variant="default"
              >
                <Share2 size={16} className="mr-2" />
                Share
              </Button>
            )}
          </CardContent>
        </Card>

        {/* QR Code Option */}
        <Card>
          <CardContent className="p-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => console.log('Show QR code')}
            >
              <QrCode size={16} className="mr-2" />
              Generate QR Code
            </Button>
          </CardContent>
        </Card>

        {/* Link Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Link Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Link Expires
                </label>
                <select className="w-full p-2 border rounded-md text-sm">
                  <option value="never">Never</option>
                  <option value="1h">1 Hour</option>
                  <option value="24h">24 Hours</option>
                  <option value="7d">7 Days</option>
                  <option value="30d">30 Days</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Usage Limit
                </label>
                <select className="w-full p-2 border rounded-md text-sm">
                  <option value="unlimited">Unlimited</option>
                  <option value="1">One-time use</option>
                  <option value="5">5 payments</option>
                  <option value="10">10 payments</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" defaultChecked={paymentData.allowCustomAmount} />
                <span className="text-sm">Allow custom amounts</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Require payment note</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm">Send notifications on payment</span>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Copy Notification */}
      {copied && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">
          Link copied to clipboard!
        </div>
      )}
    </div>
  );
}; 