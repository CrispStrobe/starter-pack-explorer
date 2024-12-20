// src/app/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Users, Package } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PackCard } from '@/components/PackCard';
import { UserCard } from '@/components/UserCard';
import { PackDetails } from '@/components/PackDetails';
import { PaginationControls } from '@/components/PaginationControls';
//import type { StarterPack, User, Stats, PackBasic } from '@/types';
import { StarterPack, EnhancedUser, Stats } from '@/types';

interface SearchResults {
  items: StarterPack[] | EnhancedUser[];
  total: number;
  page: number;
  totalPages: number;
  itemsPerPage: number;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'packs' | 'users'>('packs');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(1);
      }
    }, 300);
  
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, view, sortBy, sortOrder]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load statistics');
    }
  };

  const handleSearch = useCallback(async (page = 1) => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
  
    setLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams({
        q: searchQuery,
        type: view,
        page: String(page),
        sortBy: sortBy,
        sortOrder: sortOrder
      });
  
      const response = await fetch(`/api/search?${searchParams}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error searching:', error);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, view, sortBy, sortOrder]); // Include all dependencies

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(1);
    }
  }, [handleSearch, searchQuery]);

  const handleViewChange = (newView: 'packs' | 'users') => {
    setView(newView);
    setSearchResults(null);
    setSortBy('');
    setCurrentPage(1);
    if (searchQuery.trim()) {
      handleSearch(1);
    }
  };

  const handlePackClick = (packId: string) => {
    setSelectedPackId(packId);
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-xl">{stats.total_packs.toLocaleString()}</CardTitle>
            <CardDescription>Total Packs</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-xl">{stats.total_users.toLocaleString()}</CardTitle>
            <CardDescription>Total Users</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-xl">{stats.avg_pack_size}</CardTitle>
            <CardDescription>Avg Pack Size</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  };

  const renderSearchControls = () => (
    <div className="mb-8">
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => handleViewChange('packs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            view === 'packs'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Package className="h-5 w-5" />
          Packs
        </button>
        <button
          onClick={() => handleViewChange('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            view === 'users'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Users className="h-5 w-5" />
          Users
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder={`Search ${view === 'packs' ? 'starter packs' : 'users'}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => handleSearch(1)} // Always search from page 1 when manually clicking search
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2 transition-colors"
        >
          <Search className="h-5 w-5" />
          Search
        </button>
      </div>

      <div className="flex gap-2 items-center mt-4">
        <label className="mr-2">Sort By:</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {view === 'packs' ? (
            <>
              <option value="">Default</option>
              <option value="name">Pack Name</option>
              <option value="members">Member Count</option>
              <option value="activity">Recent Activity</option>
              <option value="created">Creation Date</option>
            </>
          ) : (
            <>
              <option value="">Default</option>
              <option value="name">Display Name</option>
              <option value="handle">Handle</option>
              <option value="followers">Followers</option>
              <option value="packs">Total Packs</option>
            </>
          )}
        </select>

        <label className="ml-4 mr-2">Order:</label>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </div>
  );

  const renderSearchResults = () => {
    if (loading) {
      return <div className="text-center py-8 text-gray-600">Loading...</div>;
    }

    if (error) {
      return <div className="text-red-600 mb-4 text-center">{error}</div>;
    }

    if (!searchResults?.items.length) {
      if (searchQuery) {
        return (
          <div className="text-center py-8 text-gray-600">
            No results found for &quot;{searchQuery}&quot;
          </div>
        );
      }
      return null;
    }

    return (
      <>
        <div className="space-y-4">
          {view === 'packs'
            ? (searchResults.items as StarterPack[]).map((pack) => (
                pack.rkey ? (
                  <PackCard 
                    key={pack.rkey} 
                    pack={pack} 
                    onPackClick={handlePackClick}
                  />
                ) : null
              ))
            : (searchResults.items as EnhancedUser[]).map((user) => (
                user.did ? (
                  <UserCard 
                    key={user.did} 
                    user={user} 
                    onPackClick={handlePackClick}
                  />
                ) : null
              ))}
        </div>

        <PaginationControls
          currentPage={currentPage}
          totalPages={searchResults.totalPages}
          onPageChange={handleSearch}
          totalItems={searchResults.total}
          itemsPerPage={searchResults.itemsPerPage}
        />
      </>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Starter Pack Explorer</h1>
        <p className="text-gray-600 mb-4">
          Search and explore Bluesky starter packs and their members
        </p>
        {renderStats()}
      </div>

      {renderSearchControls()}
      {renderSearchResults()}

      {selectedPackId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <PackDetails
              packId={selectedPackId}
              onClose={() => setSelectedPackId(null)}
            />
          </div>
        </div>
      )}

      <footer className="mt-12 pt-8 border-t text-center text-sm text-gray-600">
        <div className="space-x-4">
          <a href="/legal" className="hover:text-blue-600">Legal Notice</a>
          <a href="/privacy" className="hover:text-blue-600">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}