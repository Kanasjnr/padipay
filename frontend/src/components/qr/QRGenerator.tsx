'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  Share2, 
  Download, 
  RefreshCw,
  QrCode,
  User,
  Clock,
  DollarSign,
  Smartphone
} from 'lucide-react';

interface PaymentQRData {
  recipient: {
    name: string;
    phone: string;
    walletAddress?: string;
  };
  amount?: {
    value: number;
    currency: string;
    formatted: string;
  };
  note?: string;
  expiresAt?: Date;
}

interface QRGeneratorProps {
  paymentData: PaymentQRData;
  onClose?: () => void;
  onShare?: (qrDataUrl: string) => void;
  showControls?: boolean;
}

// Simple QR code generator using canvas (placeholder - in production use a proper QR library)
const generateQRCode = (data: string, size: number = 200): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  canvas.width = size;
  canvas.height = size;
  
  // Simple grid pattern (placeholder for actual QR code)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  
  ctx.fillStyle = '#000000';
  const moduleSize = size / 25;
  
  // Create a simple pattern that looks like a QR code
  for (let i = 0; i < 25; i++) {
    for (let j = 0; j < 25; j++) {
      // Create a pseudo-random pattern based on the data
      const hash = (data.charCodeAt((i + j) % data.length) + i * j) % 3;
      if (hash === 0 || (i < 7 && j < 7) || (i > 17 && j < 7) || (i < 7 && j > 17)) {
        ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize);
      }
    }
  }
  
  return canvas.toDataURL();
};

export const QRGenerator: React.FC<QRGeneratorProps> = ({
  paymentData,
  onClose,
  onShare,
  showControls = true
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code data
  const generateQRData = (): string => {
    const qrData = {
      type: 'payment',
      recipient: paymentData.recipient.phone,
      walletAddress: paymentData.recipient.walletAddress,
      amount: paymentData.amount?.value,
      currency: paymentData.amount?.currency,
      note: paymentData.note,
      timestamp: Date.now()
    };
    
    return JSON.stringify(qrData);
  };

  // Generate payment link
  const generatePaymentLink = (): string => {
    const baseUrl = 'https://padipay.app/pay';
    const params = new URLSearchParams({
      to: paymentData.recipient.phone,
      ...(paymentData.amount && { 
        amount: paymentData.amount.value.toString(),
        currency: paymentData.amount.currency 
      }),
      ...(paymentData.note && { note: paymentData.note })
    });
    
    return `${baseUrl}?${params.toString()}`;
  };

  // Copy QR data or link to clipboard
  const handleCopy = async (type: 'link' | 'data' = 'link') => {
    try {
      const textToCopy = type === 'link' ? generatePaymentLink() : generateQRData();
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Download QR code as image
  const handleDownload = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `padipay-qr-${Date.now()}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  // Share QR code
  const handleShare = async () => {
    if (onShare) {
      onShare(qrDataUrl);
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: 'PadiPay Payment Request',
          text: `Send money to ${paymentData.recipient.name}`,
          url: generatePaymentLink()
        });
      } catch (err) {
        // Fallback to copy
        handleCopy('link');
      }
    } else {
      handleCopy('link');
    }
  };

  // Generate QR code when component mounts or data changes
  useEffect(() => {
    const qrData = generateQRData();
    const dataUrl = generateQRCode(qrData, 300);
    setQrDataUrl(dataUrl);
  }, [paymentData]);

  // Calculate time until expiry
  const getTimeUntilExpiry = (): string => {
    if (!paymentData.expiresAt) return '';
    
    const now = new Date();
    const expiry = paymentData.expiresAt;
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Header */}
      {showControls && onClose && (
        <div className="w-full max-w-sm flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">Payment QR</h1>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ✕
          </Button>
        </div>
      )}

      {/* QR Code Card */}
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-2">
            <QrCode size={24} className="text-indigo-600 mr-2" />
            <CardTitle className="text-lg">Scan to Pay</CardTitle>
          </div>
          <p className="text-sm text-gray-600">
            Point your camera at the QR code
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-xl shadow-sm border">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="Payment QR Code"
                  className="w-48 h-48"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <RefreshCw size={32} className="text-gray-400 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-3">
            {/* Recipient */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <User size={20} className="text-gray-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{paymentData.recipient.name}</p>
                <p className="text-sm text-gray-600">{paymentData.recipient.phone}</p>
              </div>
            </div>

            {/* Amount */}
            {paymentData.amount && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <DollarSign size={20} className="text-green-600" />
                <div className="flex-1">
                  <p className="font-semibold text-lg text-gray-900">
                    {paymentData.amount.formatted}
                  </p>
                  <p className="text-sm text-gray-600">Amount to pay</p>
                </div>
              </div>
            )}

            {/* Note */}
            {paymentData.note && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-1">Note</p>
                <p className="text-sm text-blue-700">{paymentData.note}</p>
              </div>
            )}

            {/* Expiry */}
            {paymentData.expiresAt && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg">
                <Clock size={16} className="text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    {getTimeUntilExpiry()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {showControls && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy('link')}
                  className="flex flex-col items-center py-3 h-auto"
                >
                  <Copy size={16} className="mb-1" />
                  <span className="text-xs">Copy Link</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="flex flex-col items-center py-3 h-auto"
                >
                  <Share2 size={16} className="mb-1" />
                  <span className="text-xs">Share</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex flex-col items-center py-3 h-auto"
                >
                  <Download size={16} className="mb-1" />
                  <span className="text-xs">Save</span>
                </Button>
              </div>

              {/* Instructions */}
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Smartphone size={16} className="text-indigo-600 mr-2" />
                  <span className="text-sm font-medium text-indigo-800">
                    How to use
                  </span>
                </div>
                <p className="text-xs text-indigo-700">
                  Share this QR code with the sender. They can scan it with any QR reader or the PadiPay app to send you money instantly.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Copy Notification */}
      {copied && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">
          Copied to clipboard!
        </div>
      )}

      {/* Note about QR Library */}
      <p className="text-xs text-gray-500 text-center mt-4 max-w-sm">
        Note: Install a proper QR code library like 'qrcode' for production use
      </p>
    </div>
  );
};
