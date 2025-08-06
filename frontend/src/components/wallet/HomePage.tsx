import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  EyeOff,
  Send,
  QrCode,
  History,
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useWallet, usePaymentHistory } from "@/lib/WalletContext";

interface HomePageProps {
  onNavigate: (
    page: "send" | "history" | "profile" | "settings" | "help"
  ) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { success, info } = useToast();
  const { balance, refreshBalance, diagnoseWallet } = useWallet();
  const { history: paymentHistory } = usePaymentHistory();

  // Get recent transactions (limit to 3 most recent)
  const recentTransactions = paymentHistory.slice(0, 3);

  // Use real balance data from wallet
  const usdtBalance = balance?.usdt ? parseFloat(balance.usdt) : 0;

  // Debug: Log the balance values
  console.log("🏠 HomePage - Raw balance object:", balance);
  console.log("🏠 HomePage - USDT balance string:", balance?.usdt);
  console.log("🏠 HomePage - USDT balance parsed:", usdtBalance);

  // Debug: Log the balance values
  console.log("🏠 HomePage - Raw balance object:", balance);
  console.log("🏠 HomePage - USDT balance string:", balance?.usdt);
  console.log("🏠 HomePage - USDT balance parsed:", usdtBalance);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshBalance();
      success("Wallet refreshed", "Your balance has been updated");
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDiagnose = async () => {
    console.log("🔍 Running wallet diagnostics...");
    await diagnoseWallet();
  };

  const formatAmount = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    })
      .format(numAmount)
      .replace("$", "USDT ");
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    } else {
      return `${days} day${days !== 1 ? "s" : ""} ago`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="flex justify-center items-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good morning</h1>
          <p className="text-gray-600">Ready to send money?</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-full"
          >
            <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDiagnose}
            className="rounded-full"
          >
            <Bell size={20} />
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {/* USDT Balance */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">₮</span>
                </div>
                <span className="text-lg font-medium">USDT Balance</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="text-white hover:bg-white/10"
              >
                {balanceVisible ? <EyeOff size={20} /> : <Eye size={20} />}
              </Button>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold">
                {balanceVisible ? formatAmount(usdtBalance) : "****"}
              </h2>
              <p className="text-blue-100 text-sm">Available for sending</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
          onClick={() =>
            info("Coming Soon", "Bill payments feature coming soon")
          }
          className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-xl flex flex-col items-center space-y-2 transition-all transform hover:scale-105"
        >
          <Bell size={24} />
          <span className="text-xs font-medium">Bills</span>
        </button>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Transactions</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("history")}
              className="text-blue-600 hover:text-blue-700"
            >
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions yet</p>
              <p className="text-sm">
                Make your first payment to see transaction history
              </p>
            </div>
          ) : (
            recentTransactions.map((transaction, index) => (
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
                          ? transaction.sender
                          : `***${transaction.recipientPhoneHash.slice(-6)}`}
                      </p>
                      {transaction.message && (
                        <p className="text-xs text-gray-500 italic">
                          &quot;{transaction.message}&quot;
                        </p>
                      )}
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
                    <p className="text-xs text-gray-500">
                      {formatTime(transaction.timestamp)}
                    </p>
                  </div>
                </div>
                {index < recentTransactions.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
