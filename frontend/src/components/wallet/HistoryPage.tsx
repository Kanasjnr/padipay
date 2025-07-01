import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Search, Filter, Calendar } from 'lucide-react';

interface HistoryPageProps {
  onBack: () => void;
}

const transactions = [
  {
    id: '1',
    type: 'received',
    amount: 50000,
    from: '+234 xxx xxx 8901',
    to: 'You',
    time: '2 minutes ago',
    date: '2024-01-15',
    status: 'completed',
    hash: '0x1234...5678'
  },
  {
    id: '2',
    type: 'sent',
    amount: 25000,
    from: 'You',
    to: '+234 xxx xxx 7890',
    time: '1 hour ago',
    date: '2024-01-15',
    status: 'completed',
    hash: '0x2345...6789'
  },
  {
    id: '3',
    type: 'received',
    amount: 100000,
    from: '+234 xxx xxx 2345',
    to: 'You',
    time: '3 hours ago',
    date: '2024-01-15',
    status: 'completed',
    hash: '0x3456...7890'
  },
  {
    id: '4',
    type: 'sent',
    amount: 75000,
    from: 'You',
    to: '+234 xxx xxx 3456',
    time: '1 day ago',
    date: '2024-01-14',
    status: 'completed',
    hash: '0x4567...8901'
  },
  {
    id: '5',
    type: 'received',
    amount: 30000,
    from: '+234 xxx xxx 4567',
    to: 'You',
    time: '2 days ago',
    date: '2024-01-13',
    status: 'completed',
    hash: '0x5678...9012'
  },
  {
    id: '6',
    type: 'sent',
    amount: 15000,
    from: 'You',
    to: '+234 xxx xxx 5678',
    time: '3 days ago',
    date: '2024-01-12',
    status: 'pending',
    hash: '0x6789...0123'
  }
];

export const HistoryPage: React.FC<HistoryPageProps> = ({ onBack }) => {
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  const totalSent = transactions
    .filter(tx => tx.type === 'sent')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalReceived = transactions
    .filter(tx => tx.type === 'received')
    .reduce((sum, tx) => sum + tx.amount, 0);

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
        <Button variant="ghost" size="icon">
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
            <p className="text-2xl font-bold text-green-900">{formatAmount(totalReceived)}</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <ArrowUpRight size={16} className="text-red-600" />
              <span className="text-sm font-medium text-red-700">Sent</span>
            </div>
            <p className="text-2xl font-bold text-red-900">{formatAmount(totalSent)}</p>
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
          {filteredTransactions.map((transaction, index) => (
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
                        variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                        className={`text-xs ${
                          transaction.status === 'completed' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {transaction.type === 'received' ? transaction.from : transaction.to}
                    </p>
                    <p className="text-xs text-gray-500">
                      {transaction.hash}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.type === 'received' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'received' ? '+' : '-'}{formatAmount(transaction.amount)}
                  </p>
                  <p className="text-xs text-gray-500">{transaction.time}</p>
                </div>
              </div>
              {index < filteredTransactions.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}; 