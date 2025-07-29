import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Search, Filter, Calendar } from 'lucide-react';
import { usePaymentHistory } from '@/lib/WalletContext';

interface HistoryPageProps {
  onBack: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onBack }) => {
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');
  const { history, isLoading, refreshHistory } = usePaymentHistory();

  const formatAmount = (amount: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(numAmount).replace('$', 'USDT ');
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  const filteredTransactions = history.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  const totalSent = history
    .filter(tx => tx.type === 'sent')
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  const totalReceived = history
    .filter(tx => tx.type === 'received')
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-24">
        <div className="flex items-center space-x-4 mb-6 pt-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-gray-600">Loading your transactions...</p>
          </div>
        </div>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6 pt-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full"
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-gray-600">All your PadiPay transactions</p>
        </div>
        <Button variant="ghost" size="icon" onClick={refreshHistory}>
          <Search size={20} />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <ArrowDownLeft size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">Received</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{formatAmount(totalReceived.toString())}</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <ArrowUpRight size={16} className="text-red-600" />
              <span className="text-sm font-medium text-red-700">Sent</span>
            </div>
            <p className="text-2xl font-bold text-red-900">{formatAmount(totalSent.toString())}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700 mr-2">Filter:</span>
            <div className="flex space-x-2">
              {(['all', 'sent', 'received'] as const).map((type) => (
                <Button
                  key={type}
                  variant={filter === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(type)}
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar size={20} className="mr-2" />
            Recent Transactions
          </CardTitle>
          <CardDescription>
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions found</p>
              <p className="text-sm">Make your first payment to see transaction history</p>
            </div>
          ) : (
            filteredTransactions.map((transaction, index) => (
              <div key={transaction.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'received' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.type === 'received' ? (
                        <ArrowDownLeft size={20} />
                      ) : (
                        <ArrowUpRight size={20} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">
                          {transaction.type === 'received' ? 'Received from' : 'Sent to'}
                        </p>
                        <Badge 
                          variant={transaction.claimed ? 'default' : 'secondary'}
                          className={`text-xs ${
                            transaction.claimed 
                              ? 'bg-green-100 text-green-700' 
                              : transaction.isEscrowed 
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {transaction.claimed ? 'completed' : transaction.isEscrowed ? 'escrowed' : 'pending'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {transaction.type === 'received' ? transaction.sender : `***${transaction.recipientPhoneHash.slice(-6)}`}
                      </p>
                                             {transaction.message && (
                         <p className="text-xs text-gray-500 italic">&quot;{transaction.message}&quot;</p>
                       )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'received' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'received' ? '+' : '-'}{formatAmount(transaction.amount)}
                    </p>
                    <p className="text-xs text-gray-500">{formatTime(transaction.timestamp)}</p>
                  </div>
                </div>
                {index < filteredTransactions.length - 1 && <Separator className="mt-4" />}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 