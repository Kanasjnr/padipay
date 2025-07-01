import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  EyeOff,
  Send,
  QrCode,
  History,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  HelpCircle,
  Bell,
  PiggyBank,
  Award
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { BalanceCardSkeleton, TransactionListSkeleton, QuickActionsSkeleton } from "@/components/ui/loading";

interface HomePageProps {
  onNavigate: (tab: "send" | "history" | "profile" | "settings" | "help") => void;
}

const recentTransactions = [
  {
    id: "1",
    type: "received",
    amount: 50000,
    from: "+234 xxx xxx 8901",
    time: "2 minutes ago",
    status: "completed",
  },
  {
    id: "2",
    type: "sent",
    amount: 25000,
    to: "+234 xxx xxx 7890",
    time: "1 hour ago",
    status: "completed",
  },
  {
    id: "3",
    type: "received",
    amount: 100000,
    from: "+234 xxx xxx 2345",
    time: "3 hours ago",
    status: "completed",
  },
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { success, info } = useToast();
  
  const balance = 175000; // ₦175,000
  const savings = 45000; // ₦45,000
  const rewards = 2450; // ₦2,450

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
      success("Wallet refreshed", "Your balance has been updated");
    }, 1000);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-24">
        <div className="flex items-center justify-between mb-6 pt-8">
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        <BalanceCardSkeleton />
        <div className="mb-6">
          <QuickActionsSkeleton />
        </div>
        <TransactionListSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600">Your PadiPay wallet</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("help")}
            className="rounded-full"
          >
            <HelpCircle size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("settings")}
            className="rounded-full"
          >
            <Settings size={20} />
          </Button>
          <button 
            onClick={() => onNavigate("profile")}
            className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center hover:bg-indigo-200 transition-colors"
          >
            <span className="text-indigo-600 font-semibold">JD</span>
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="mb-6 bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm">Total Balance</p>
              <div className="flex items-center space-x-2">
                <h2 className="text-3xl font-bold">
                  {balanceVisible ? formatAmount(balance) : "₦***,***"}
                </h2>
                <button
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  className="text-blue-100 hover:text-white transition-colors"
                >
                  {balanceVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-blue-100 hover:text-white transition-colors disabled:opacity-50"
            >
              <TrendingUp size={20} className={refreshing ? "animate-pulse" : ""} />
            </button>
          </div>

          {/* Sub-balances */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <PiggyBank size={16} />
                <span className="text-sm">Savings</span>
              </div>
              <p className="text-lg font-semibold">
                {balanceVisible ? formatAmount(savings) : "₦***,***"}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Award size={16} />
                <span className="text-sm">Rewards</span>
              </div>
              <p className="text-lg font-semibold">
                {balanceVisible ? formatAmount(rewards) : "₦***,***"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => onNavigate("send")}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl flex flex-col items-center space-y-2 transition-all transform hover:scale-105"
        >
          <Send size={24} />
          <span className="text-xs font-medium">Send</span>
        </button>

        <button
          onClick={() => info("QR Code", "Generate QR to receive payments")}
          className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl flex flex-col items-center space-y-2 transition-all transform hover:scale-105"
        >
          <QrCode size={24} />
          <span className="text-xs font-medium">Receive</span>
        </button>

        <button
          onClick={() => onNavigate("history")}
          className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-xl flex flex-col items-center space-y-2 transition-all transform hover:scale-105"
        >
          <History size={24} />
          <span className="text-xs font-medium">History</span>
        </button>

        <button
          onClick={() => info("Coming Soon", "Bill payments feature coming soon")}
          className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-xl flex flex-col items-center space-y-2 transition-all transform hover:scale-105"
        >
          <Bell size={24} />
          <span className="text-xs font-medium">Bills</span>
        </button>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("history")}
              className="text-indigo-600"
            >
              <History size={16} className="mr-1" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentTransactions.map((transaction, index) => (
            <div key={transaction.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === "received"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {transaction.type === "received" ? (
                      <ArrowDownLeft size={20} />
                    ) : (
                      <ArrowUpRight size={20} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.type === "received"
                        ? "Received from"
                        : "Sent to"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {transaction.type === "received"
                        ? transaction.from
                        : transaction.to}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      transaction.type === "received"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === "received" ? "+" : "-"}
                    {formatAmount(transaction.amount)}
                  </p>
                  <p className="text-xs text-gray-500">{transaction.time}</p>
                </div>
              </div>
              {index < recentTransactions.length - 1 && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
