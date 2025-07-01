'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Download, 
  Share2,
  Copy,
  Receipt,
  User,
  Clock,
  DollarSign,
  MapPin,
  Hash,
  AlertCircle,
  CheckCircle,
  Loader,
  ExternalLink,
  Phone,
  CreditCard
} from 'lucide-react';

interface TransactionDetailData {
  id: string;
  type: 'sent' | 'received';
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  amount: {
    value: number;
    currency: string;
    formatted: string;
  };
  fees: {
    network: number;
    service: number;
    total: number;
    currency: string;
  };
  participant: {
    name?: string;
    phone: string;
    avatar?: string;
    country?: string;
    countryFlag?: string;
  };
  timestamps: {
    initiated: Date;
    completed?: Date;
    failed?: Date;
  };
  blockchain: {
    network: string;
    hash?: string;
    blockNumber?: number;
    confirmations?: number;
    gasUsed?: number;
  };
  reference?: string;
  note?: string;
  exchangeRate?: {
    from: string;
    to: string;
    rate: number;
    convertedAmount: string;
  };
  receipt: {
    number: string;
    downloadUrl?: string;
  };
}

interface TransactionDetailProps {
  transaction: TransactionDetailData;
  onBack: () => void;
  onShare?: () => void;
  onDownloadReceipt?: () => void;
  onContactSupport?: () => void;
}

export const TransactionDetail: React.FC<TransactionDetailProps> = ({
  transaction,
  onBack,
  onShare,
  onDownloadReceipt,
  onContactSupport
}) => {
  const [copied, setCopied] = useState<string | null>(null);

  // Get status styling
  const getStatusBadge = () => {
    switch (transaction.status) {
      case 'completed':
        return {
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800',
          icon: <CheckCircle size={14} />,
          text: 'Completed'
        };
      case 'pending':
        return {
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800',
          icon: <Loader size={14} className="animate-spin" />,
          text: 'Pending'
        };
      case 'failed':
        return {
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800',
          icon: <AlertCircle size={14} />,
          text: 'Failed'
        };
      case 'cancelled':
        return {
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800',
          icon: <AlertCircle size={14} />,
          text: 'Cancelled'
        };
    }
  };

  // Format currency
  const formatCurrency = (value: number, currency: string): string => {
    if (currency === 'USDT' || currency === 'BTC' || currency === 'ETH') {
      return `${currency} ${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
      })}`;
    }

    try {
      return new Intl.NumberFormat('en', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currency === 'NGN' || currency === 'KES' ? 0 : 2,
      }).format(value);
    } catch {
      const symbols: Record<string, string> = {
        NGN: '₦', KES: 'KSh', GHS: '₵', UGX: 'USh', ZAR: 'R', ETB: 'Br', USD: '$'
      };
      const symbol = symbols[currency] || currency;
      return `${symbol}${value.toLocaleString()}`;
    }
  };

  // Copy to clipboard
  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6 pt-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full"
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Transaction Details</h1>
          <p className="text-sm text-gray-600">Receipt #{transaction.receipt.number}</p>
        </div>
        <Button variant="outline" size="icon" onClick={onShare}>
          <Share2 size={18} />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Status & Amount Card */}
        <Card className="border-t-4 border-t-indigo-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Badge className={statusBadge.className}>
                {statusBadge.icon}
                <span className="ml-1">{statusBadge.text}</span>
              </Badge>
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                {transaction.type}
              </span>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign 
                  size={32} 
                  className={`mr-2 ${
                    transaction.type === 'received' ? 'text-green-600' : 'text-blue-600'
                  }`} 
                />
                <span className="text-4xl font-bold text-gray-900">
                  {transaction.type === 'sent' ? '-' : '+'}{transaction.amount.formatted}
                </span>
              </div>
              
              {transaction.exchangeRate && (
                <p className="text-sm text-gray-600">
                  ≈ {transaction.exchangeRate.convertedAmount}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Participant Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <User size={18} className="mr-2" />
              {transaction.type === 'sent' ? 'Sent to' : 'Received from'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center relative">
                {transaction.participant.avatar ? (
                  <span className="text-indigo-600 font-semibold">
                    {transaction.participant.avatar}
                  </span>
                ) : (
                  <User size={20} className="text-indigo-600" />
                )}
                {transaction.participant.countryFlag && (
                  <span className="absolute -bottom-1 -right-1 text-sm">
                    {transaction.participant.countryFlag}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {transaction.participant.name || 'Unknown Contact'}
                </p>
                <div className="flex items-center space-x-2">
                  <Phone size={12} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {transaction.participant.phone}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleCopy(transaction.participant.phone, 'phone')}
                  >
                    <Copy size={12} />
                  </Button>
                </div>
                {transaction.participant.country && (
                  <p className="text-xs text-gray-500">{transaction.participant.country}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Transaction ID */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center">
                <Hash size={14} className="mr-1" />
                Transaction ID
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono">
                  {transaction.id.slice(0, 8)}...{transaction.id.slice(-8)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleCopy(transaction.id, 'txId')}
                >
                  <Copy size={12} />
                </Button>
              </div>
            </div>

            {/* Reference */}
            {transaction.reference && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Reference</span>
                <span className="text-sm font-medium">{transaction.reference}</span>
              </div>
            )}

            {/* Timestamps */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center">
                  <Clock size={14} className="mr-1" />
                  Initiated
                </span>
                <span className="text-sm font-medium">
                  {formatDate(transaction.timestamps.initiated)}
                </span>
              </div>
              
              {transaction.timestamps.completed && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center">
                    <CheckCircle size={14} className="mr-1 text-green-600" />
                    Completed
                  </span>
                  <span className="text-sm font-medium">
                    {formatDate(transaction.timestamps.completed)}
                  </span>
                </div>
              )}

              {transaction.timestamps.failed && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center">
                    <AlertCircle size={14} className="mr-1 text-red-600" />
                    Failed
                  </span>
                  <span className="text-sm font-medium">
                    {formatDate(transaction.timestamps.failed)}
                  </span>
                </div>
              )}
            </div>

            {/* Note */}
            {transaction.note && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-gray-600 mb-2">Note</p>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-blue-800">{transaction.note}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Fees Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <CreditCard size={18} className="mr-2" />
              Fee Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Network Fee</span>
              <span>{formatCurrency(transaction.fees.network, transaction.fees.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Service Fee</span>
              <span>{formatCurrency(transaction.fees.service, transaction.fees.currency)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total Fees</span>
              <span>{formatCurrency(transaction.fees.total, transaction.fees.currency)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Blockchain Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <MapPin size={18} className="mr-2" />
              Blockchain Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Network</span>
              <span className="font-medium">{transaction.blockchain.network}</span>
            </div>
            
            {transaction.blockchain.hash && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Transaction Hash</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">
                    {transaction.blockchain.hash.slice(0, 6)}...{transaction.blockchain.hash.slice(-6)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleCopy(transaction.blockchain.hash!, 'hash')}
                  >
                    <Copy size={12} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                  >
                    <ExternalLink size={12} />
                  </Button>
                </div>
              </div>
            )}

            {transaction.blockchain.blockNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Block Number</span>
                <span className="font-medium">#{transaction.blockchain.blockNumber.toLocaleString()}</span>
              </div>
            )}

            {transaction.blockchain.confirmations && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Confirmations</span>
                <span className="font-medium">{transaction.blockchain.confirmations}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={onDownloadReceipt}
            className="w-full h-12"
            variant="outline"
          >
            <Receipt size={20} className="mr-2" />
            Download Receipt
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={onShare}>
              <Share2 size={16} className="mr-2" />
              Share
            </Button>
            
            {transaction.status === 'failed' && onContactSupport && (
              <Button variant="outline" onClick={onContactSupport}>
                <Phone size={16} className="mr-2" />
                Support
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Copy Notification */}
      {copied && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">
          {copied === 'phone' && 'Phone number copied!'}
          {copied === 'txId' && 'Transaction ID copied!'}
          {copied === 'hash' && 'Transaction hash copied!'}
        </div>
      )}
    </div>
  );
};
