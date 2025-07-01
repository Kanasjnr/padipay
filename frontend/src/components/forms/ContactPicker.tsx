'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  User, 
  Phone, 
  Users, 
  Star,
  Clock,
  Plus,
  X,
  Check,
  Filter,
  ArrowLeft
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  avatar?: string;
  country?: string;
  countryFlag?: string;
  isFavorite?: boolean;
  lastTransactionDate?: Date;
  transactionCount?: number;
  isRegistered?: boolean; // Whether they have a PadiPay account
}

interface ContactGroup {
  title: string;
  contacts: Contact[];
}

interface ContactPickerProps {
  contacts: Contact[];
  onContactSelect: (contact: Contact) => void;
  onBack?: () => void;
  selectedContacts?: Contact[];
  multiSelect?: boolean;
  showRecentTransactions?: boolean;
  showFavorites?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  maxSelections?: number;
}

export const ContactPicker: React.FC<ContactPickerProps> = ({
  contacts,
  onContactSelect,
  onBack,
  selectedContacts = [],
  multiSelect = false,
  showRecentTransactions = true,
  showFavorites = true,
  placeholder = "Search contacts...",
  emptyMessage = "No contacts found",
  maxSelections = 10
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(selectedContacts.map(c => c.id))
  );
  const [filter, setFilter] = useState<'all' | 'registered' | 'favorites' | 'recent'>('all');

  // Filter and search contacts
  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    // Apply filter
    if (filter === 'registered') {
      filtered = filtered.filter(c => c.isRegistered);
    } else if (filter === 'favorites') {
      filtered = filtered.filter(c => c.isFavorite);
    } else if (filter === 'recent') {
      filtered = filtered.filter(c => c.lastTransactionDate);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        contact =>
          contact.name.toLowerCase().includes(query) ||
          contact.phoneNumber.includes(query) ||
          contact.email?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [contacts, searchQuery, filter]);

  // Group contacts
  const groupedContacts = useMemo(() => {
    const groups: ContactGroup[] = [];

    if (showFavorites && filter === 'all') {
      const favorites = filteredContacts.filter(c => c.isFavorite);
      if (favorites.length > 0) {
        groups.push({ title: 'Favorites', contacts: favorites });
      }
    }

    if (showRecentTransactions && filter === 'all') {
      const recent = filteredContacts
        .filter(c => c.lastTransactionDate && !c.isFavorite)
        .sort((a, b) => 
          (b.lastTransactionDate?.getTime() || 0) - (a.lastTransactionDate?.getTime() || 0)
        )
        .slice(0, 5);
      
      if (recent.length > 0) {
        groups.push({ title: 'Recent Transactions', contacts: recent });
      }
    }

    // Remaining contacts alphabetically
    const remaining = filteredContacts
      .filter(c => 
        (!c.isFavorite || filter !== 'all') && 
        (!c.lastTransactionDate || filter !== 'all' || showRecentTransactions === false)
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    if (remaining.length > 0) {
      groups.push({ 
        title: filter === 'all' ? 'All Contacts' : '', 
        contacts: remaining 
      });
    }

    return groups;
  }, [filteredContacts, showFavorites, showRecentTransactions, filter]);

  // Handle contact selection
  const handleContactSelect = (contact: Contact) => {
    if (multiSelect) {
      const newSelectedIds = new Set(selectedIds);
      
      if (selectedIds.has(contact.id)) {
        newSelectedIds.delete(contact.id);
      } else if (selectedIds.size < maxSelections) {
        newSelectedIds.add(contact.id);
      }
      
      setSelectedIds(newSelectedIds);
    } else {
      onContactSelect(contact);
    }
  };

  // Confirm multi-selection
  const handleConfirmSelection = () => {
    const selectedContacts = contacts.filter(c => selectedIds.has(c.id));
    selectedContacts.forEach(contact => onContactSelect(contact));
  };

  // Get filter counts
  const getFilterCounts = () => {
    return {
      all: contacts.length,
      registered: contacts.filter(c => c.isRegistered).length,
      favorites: contacts.filter(c => c.isFavorite).length,
      recent: contacts.filter(c => c.lastTransactionDate).length
    };
  };

  const filterCounts = getFilterCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center space-x-3 mb-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft size={20} />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {multiSelect ? 'Select Contacts' : 'Choose Contact'}
            </h1>
            <p className="text-sm text-gray-600">
              {multiSelect 
                ? `${selectedIds.size}/${maxSelections} selected` 
                : 'Tap a contact to select'
              }
            </p>
          </div>
          {multiSelect && selectedIds.size > 0 && (
            <Button onClick={handleConfirmSelection}>
              Confirm ({selectedIds.size})
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              onClick={() => setSearchQuery('')}
            >
              <X size={16} />
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({filterCounts.all})
          </Button>
          <Button
            variant={filter === 'registered' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('registered')}
          >
            PadiPay ({filterCounts.registered})
          </Button>
          <Button
            variant={filter === 'favorites' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('favorites')}
          >
            <Star size={14} className="mr-1" />
            Favorites ({filterCounts.favorites})
          </Button>
          <Button
            variant={filter === 'recent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('recent')}
          >
            <Clock size={14} className="mr-1" />
            Recent ({filterCounts.recent})
          </Button>
        </div>
      </div>

      {/* Contacts List */}
      <div className="p-4">
        {groupedContacts.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {emptyMessage}
            </h3>
            <p className="text-gray-600">
              {searchQuery 
                ? `No contacts match "${searchQuery}"` 
                : "Import contacts or add them manually"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedContacts.map((group, groupIndex) => (
              <div key={groupIndex}>
                {group.title && (
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                    {group.title}
                  </h3>
                )}
                
                <div className="space-y-2">
                  {group.contacts.map((contact) => (
                    <Card
                      key={contact.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedIds.has(contact.id) 
                          ? 'ring-2 ring-indigo-500 bg-indigo-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleContactSelect(contact)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          {/* Avatar */}
                          <div className="relative">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                              {contact.avatar ? (
                                <span className="text-sm font-medium">{contact.avatar}</span>
                              ) : (
                                <User size={20} className="text-gray-600" />
                              )}
                            </div>
                            
                            {/* Status indicators */}
                            {contact.isRegistered && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                <Check size={10} className="text-white" />
                              </div>
                            )}
                            
                            {contact.isFavorite && (
                              <div className="absolute -top-1 -right-1">
                                <Star size={12} className="text-yellow-500 fill-current" />
                              </div>
                            )}
                          </div>

                          {/* Contact Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900 truncate">
                                {contact.name}
                              </h4>
                              {contact.countryFlag && (
                                <span className="text-sm">{contact.countryFlag}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-1 mt-1">
                              <Phone size={12} className="text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {contact.phoneNumber}
                              </span>
                            </div>

                            {/* Additional info */}
                            <div className="flex items-center space-x-2 mt-1">
                              {contact.isRegistered && (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                  PadiPay user
                                </Badge>
                              )}
                              
                              {contact.transactionCount && contact.transactionCount > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {contact.transactionCount} transactions
                                </Badge>
                              )}
                              
                              {contact.lastTransactionDate && (
                                <span className="text-xs text-gray-500">
                                  Last: {contact.lastTransactionDate.toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Selection indicator */}
                          {multiSelect && (
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              selectedIds.has(contact.id) 
                                ? 'bg-indigo-600 border-indigo-600' 
                                : 'border-gray-300'
                            }`}>
                              {selectedIds.has(contact.id) && (
                                <Check size={14} className="text-white" />
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Contact */}
        <div className="mt-6">
          <Button variant="outline" className="w-full" onClick={() => console.log('Add new contact')}>
            <Plus size={16} className="mr-2" />
            Add New Contact
          </Button>
        </div>
      </div>
    </div>
  );
};

// Mock data generator for testing
export const generateMockContacts = (): Contact[] => {
  const names = [
    'Kemi Adebayo', 'John Mwangi', 'Aisha Mohammed', 'David Okello',
    'Fatima Hassan', 'Samuel Okonkwo', 'Grace Nyong', 'Ibrahim Diallo',
    'Mary Kiprotich', 'Ahmed Yusuf', 'Stella Mutai', 'Peter Nkomo'
  ];
  
  const countries = [
    { name: 'Nigeria', flag: '🇳🇬', prefix: '+234' },
    { name: 'Kenya', flag: '🇰🇪', prefix: '+254' },
    { name: 'Ghana', flag: '🇬🇭', prefix: '+233' },
    { name: 'Uganda', flag: '🇺🇬', prefix: '+256' }
  ];

  return names.map((name, index) => {
    const country = countries[index % countries.length];
    const phoneNumber = `${country.prefix} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`;
    
    return {
      id: (index + 1).toString(),
      name,
      phoneNumber,
      email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
      avatar: name.split(' ').map(n => n[0]).join(''),
      country: country.name,
      countryFlag: country.flag,
      isFavorite: Math.random() > 0.7,
      isRegistered: Math.random() > 0.4,
      transactionCount: Math.random() > 0.5 ? Math.floor(Math.random() * 10) + 1 : 0,
      lastTransactionDate: Math.random() > 0.6 ? 
        new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) : 
        undefined
    };
  });
};
