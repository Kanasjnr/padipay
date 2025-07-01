'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  BellOff,
  ArrowLeft,
  DollarSign,
  User,
  AlertTriangle,
  Info,
  Settings,
  Trash2,
  MoreVertical,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'transaction' | 'security' | 'system' | 'promotional' | 'social';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionable?: boolean;
  actions?: {
    primary?: {
      label: string;
      action: () => void;
    };
    secondary?: {
      label: string;
      action: () => void;
    };
  };
  icon?: React.ReactNode;
  avatar?: string;
  amount?: {
    value: number;
    currency: string;
    formatted: string;
  };
  metadata?: {
    transactionId?: string;
    userId?: string;
    [key: string]: any;
  };
}

interface NotificationCenterProps {
  notifications: Notification[];
  onBack?: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onNotificationClick: (notification: Notification) => void;
  showHeader?: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onBack,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  onNotificationClick,
  showHeader = true
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'transaction' | 'security'>('all');
  const [showActions, setShowActions] = useState<string | null>(null);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'transaction') return notification.type === 'transaction';
    if (filter === 'security') return notification.type === 'security';
    return true;
  });

  // Get notification counts
  const unreadCount = notifications.filter(n => !n.read).length;
  const transactionCount = notifications.filter(n => n.type === 'transaction').length;
  const securityCount = notifications.filter(n => n.type === 'security').length;

  // Get notification icon
  const getNotificationIcon = (notification: Notification) => {
    if (notification.icon) return notification.icon;
    
    switch (notification.type) {
      case 'transaction':
        return <DollarSign size={20} className="text-green-600" />;
      case 'security':
        return <AlertTriangle size={20} className="text-red-600" />;
      case 'system':
        return <Info size={20} className="text-blue-600" />;
      case 'social':
        return <User size={20} className="text-purple-600" />;
      default:
        return <Bell size={20} className="text-gray-600" />;
    }
  };

  // Get priority styling
  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-l-red-500';
      case 'medium': return 'border-l-4 border-l-yellow-500';
      default: return 'border-l-4 border-l-gray-300';
    }
  };

  // Format time
  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    onNotificationClick(notification);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {showHeader && (
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {onBack && (
                <Button variant="ghost" size="icon" onClick={onBack}>
                  <ArrowLeft size={20} />
                </Button>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                <p className="text-sm text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="icon">
                <Settings size={20} />
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 mt-4 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === 'all' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === 'unread' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('transaction')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === 'transaction' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Money ({transactionCount})
            </button>
            <button
              onClick={() => setFilter('security')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === 'security' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Security ({securityCount})
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="p-4 space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <BellOff size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "You're all caught up!" 
                : `No ${filter} notifications`
              }
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id}
              className={`${getPriorityBorder(notification.priority)} ${
                !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white'
              } hover:shadow-md transition-shadow cursor-pointer relative`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {/* Icon/Avatar */}
                  <div className="flex-shrink-0 mt-1">
                    {notification.avatar ? (
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">{notification.avatar}</span>
                      </div>
                    ) : (
                      getNotificationIcon(notification)
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className={`text-sm mt-1 ${
                          !notification.read ? 'text-gray-700' : 'text-gray-600'
                        }`}>
                          {notification.message}
                        </p>

                        {/* Amount Display */}
                        {notification.amount && (
                          <div className="mt-2">
                            <span className="text-lg font-bold text-green-600">
                              {notification.amount.formatted}
                            </span>
                          </div>
                        )}

                        {/* Actions */}
                        {notification.actions && notification.actionable && (
                          <div className="flex space-x-2 mt-3">
                            {notification.actions.primary && (
                              <Button 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  notification.actions!.primary!.action();
                                }}
                              >
                                {notification.actions.primary.label}
                              </Button>
                            )}
                            {notification.actions.secondary && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  notification.actions!.secondary!.action();
                                }}
                              >
                                {notification.actions.secondary.label}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Timestamp & Actions */}
                      <div className="flex items-center space-x-2 ml-2">
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock size={12} className="mr-1" />
                          {formatTime(notification.timestamp)}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowActions(
                              showActions === notification.id ? null : notification.id
                            );
                          }}
                        >
                          <MoreVertical size={14} />
                        </Button>
                      </div>
                    </div>

                    {/* Type Badge */}
                    <div className="flex items-center justify-between mt-2">
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                      >
                        {notification.type}
                      </Badge>
                      
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Dropdown */}
                {showActions === notification.id && (
                  <div className="absolute top-2 right-2 bg-white border rounded-lg shadow-lg p-1 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(notification.id);
                        setShowActions(null);
                      }}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-gray-100 rounded"
                    >
                      <CheckCircle size={14} />
                      <span>Mark as read</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notification.id);
                        setShowActions(null);
                      }}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-gray-100 rounded text-red-600"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}

        {/* Clear All Button */}
        {filteredNotifications.length > 0 && (
          <div className="text-center pt-4">
            <Button variant="outline" onClick={onClearAll}>
              <Trash2 size={16} className="mr-2" />
              Clear all notifications
            </Button>
          </div>
        )}
      </div>

      {/* Click outside to close actions */}
      {showActions && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setShowActions(null)}
        />
      )}
    </div>
  );
};

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    getUnreadCount
  };
};
