'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter,
  X,
  Calendar,
  DollarSign,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  status: 'completed' | 'pending' | 'failed';
  amount: {
    value: number;
    currency: string;
    formatted: string;
  };
  participant: {
    name?: string;
    phone: string;
    avatar?: string;
  };
  timestamp: Date;
  reference?: string;
  note?: string;
  category?: string;
}

interface FilterOptions {
  type?: 'sent' | 'received' | 'all';
  status?: 'completed' | 'pending' | 'failed' | 'all';
  dateRange?: {
    start: Date;
    end: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  currency?: string;
  categories?: string[];
}

interface SearchAndFilterProps {
  transactions: Transaction[];
  onFilteredResults: (transactions: Transaction[]) => void;
  placeholder?: string;
  showAdvancedFilters?: boolean;
  recentSearches?: string[];
  onSaveSearch?: (query: string) => void;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  transactions,
  onFilteredResults,
  placeholder = "Search transactions...",
  showAdvancedFilters = true,
  recentSearches = [],
  onSaveSearch
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    status: 'all',
    currency: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showQuickFilters, setShowQuickFilters] = useState(true);

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const currencies = [...new Set(transactions.map(t => t.amount.currency))];
    const categories = [...new Set(transactions.map(t => t.category).filter(Boolean))];
    const participants = [...new Set(transactions.map(t => t.participant.name || t.participant.phone))];
    
    return { currencies, categories, participants };
  }, [transactions]);

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(transaction => 
        transaction.participant.name?.toLowerCase().includes(query) ||
        transaction.participant.phone.includes(query) ||
        transaction.amount.formatted.toLowerCase().includes(query) ||
        transaction.reference?.toLowerCase().includes(query) ||
        transaction.note?.toLowerCase().includes(query) ||
        transaction.id.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    if (filters.currency && filters.currency !== 'all') {
      filtered = filtered.filter(t => t.amount.currency === filters.currency);
    }

    if (filters.dateRange) {
      filtered = filtered.filter(t => 
        t.timestamp >= filters.dateRange!.start && 
        t.timestamp <= filters.dateRange!.end
      );
    }

    if (filters.amountRange) {
      filtered = filtered.filter(t => 
        t.amount.value >= filters.amountRange!.min && 
        t.amount.value <= filters.amountRange!.max
      );
    }

    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(t => 
        t.category && filters.categories!.includes(t.category)
      );
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [transactions, searchQuery, filters]);

  // Update parent component when results change
  useEffect(() => {
    onFilteredResults(filteredTransactions);
  }, [filteredTransactions, onFilteredResults]);

  // Quick filter presets
  const quickFilters = [
    { label: 'Today', action: () => setFilters(prev => ({ ...prev, dateRange: { start: new Date(new Date().setHours(0,0,0,0)), end: new Date() } })) },
    { label: 'This Week', action: () => {
      const start = new Date();
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0,0,0,0);
      setFilters(prev => ({ ...prev, dateRange: { start, end: new Date() } }));
    }},
    { label: 'This Month', action: () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(0,0,0,0);
      setFilters(prev => ({ ...prev, dateRange: { start, end: new Date() } }));
    }},
    { label: 'Sent', action: () => setFilters(prev => ({ ...prev, type: 'sent' })) },
    { label: 'Received', action: () => setFilters(prev => ({ ...prev, type: 'received' })) },
    { label: 'Completed', action: () => setFilters(prev => ({ ...prev, status: 'completed' })) },
    { label: 'Pending', action: () => setFilters(prev => ({ ...prev, status: 'pending' })) }
  ];

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      type: 'all',
      status: 'all',
      currency: 'all'
    });
    setSearchQuery('');
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.currency !== 'all') count++;
    if (filters.dateRange) count++;
    if (filters.amountRange) count++;
    if (filters.categories && filters.categories.length > 0) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-20"
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {(searchQuery || activeFilterCount > 0) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clearFilters}
            >
              <X size={16} />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} className={activeFilterCount > 0 ? 'text-indigo-600' : ''} />
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {filteredTransactions.length} of {transactions.length} transactions
          {searchQuery && ` for "${searchQuery}"`}
        </span>
        
        {activeFilterCount > 0 && (
          <Badge variant="secondary">
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
          </Badge>
        )}
      </div>

      {/* Quick Filters */}
      {showQuickFilters && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Quick Filters</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowQuickFilters(!showQuickFilters)}
              >
                {showQuickFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={filter.action}
                  className="text-xs"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Filters */}
      {showFilters && showAdvancedFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <SlidersHorizontal size={18} className="mr-2" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Transaction Type
                </label>
                <select
                  value={filters.type || 'all'}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="sent">Sent</option>
                  <option value="received">Received</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Status
                </label>
                <select
                  value={filters.status || 'all'}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Currency
              </label>
              <select
                value={filters.currency || 'all'}
                onChange={(e) => setFilters(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="all">All Currencies</option>
                {filterOptions.currencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>

            {/* Amount Range */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Amount Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min amount"
                  onChange={(e) => {
                    const min = parseFloat(e.target.value) || 0;
                    setFilters(prev => ({ 
                      ...prev, 
                      amountRange: { 
                        min, 
                        max: prev.amountRange?.max || Infinity 
                      } 
                    }));
                  }}
                />
                <Input
                  type="number"
                  placeholder="Max amount"
                  onChange={(e) => {
                    const max = parseFloat(e.target.value) || Infinity;
                    setFilters(prev => ({ 
                      ...prev, 
                      amountRange: { 
                        min: prev.amountRange?.min || 0, 
                        max 
                      } 
                    }));
                  }}
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  onChange={(e) => {
                    const start = new Date(e.target.value);
                    setFilters(prev => ({ 
                      ...prev, 
                      dateRange: { 
                        start, 
                        end: prev.dateRange?.end || new Date() 
                      } 
                    }));
                  }}
                />
                <Input
                  type="date"
                  onChange={(e) => {
                    const end = new Date(e.target.value);
                    setFilters(prev => ({ 
                      ...prev, 
                      dateRange: { 
                        start: prev.dateRange?.start || new Date(0), 
                        end 
                      } 
                    }));
                  }}
                />
              </div>
            </div>

            {/* Categories */}
            {filterOptions.categories.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.categories.map(category => (
                    <Badge
                      key={category}
                      variant={filters.categories?.includes(category) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const currentCategories = filters.categories || [];
                        const newCategories = currentCategories.includes(category)
                          ? currentCategories.filter(c => c !== category)
                          : [...currentCategories, category];
                        setFilters(prev => ({ ...prev, categories: newCategories }));
                      }}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            <div className="pt-4 border-t">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear All Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Searches */}
      {recentSearches.length > 0 && !searchQuery && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Searches</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {recentSearches.slice(0, 5).map((search, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery(search)}
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  <Clock size={12} className="mr-1" />
                  {search}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Search */}
      {searchQuery && onSaveSearch && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSaveSearch(searchQuery)}
          >
            Save Search
          </Button>
        </div>
      )}
    </div>
  );
};

// Hook for managing search and filter state
export const useSearchAndFilter = () => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);

  const addRecentSearch = (query: string) => {
    if (query.trim() && !recentSearches.includes(query)) {
      setRecentSearches(prev => [query, ...prev.slice(0, 9)]);
    }
  };

  const saveSearch = (query: string) => {
    if (query.trim() && !savedSearches.includes(query)) {
      setSavedSearches(prev => [query, ...prev]);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  return {
    recentSearches,
    savedSearches,
    addRecentSearch,
    saveSearch,
    clearRecentSearches
  };
}; 