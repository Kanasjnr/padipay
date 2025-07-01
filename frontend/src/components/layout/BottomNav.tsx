"use client"

import React from 'react';
import { Home, Send, History, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: 'home' | 'send' | 'history' | 'profile') => void;
}

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'send', label: 'Send', icon: Send },
  { id: 'history', label: 'History', icon: History },
  { id: 'profile', label: 'Profile', icon: User },
] as const;

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="max-w-md mx-auto px-4 py-2">
        <nav className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const IconComponent = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
                aria-label={item.label}
              >
                <IconComponent 
                  size={20} 
                  className={`transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}
                />
                <span className={`text-xs font-medium transition-colors duration-200 ${
                  isActive ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}; 