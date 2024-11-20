// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, Users, Package, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PaginationControls from '@/components/PaginationControls';
import type { StarterPack, User, Stats } from '@/types';

interface SearchResults {
  items: StarterPack[] | User[];
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
  const [expandedPack, setExpandedPack] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(1); // Reset to page 1 when sorting changes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder]);

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

  const handleSearch = async (page = 1) => {
    if (!searchQuery.trim()) return;
  
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&type=${view}&page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      );
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
  };

  const handlePageChange = (newPage: number) => {
    handleSearch(newPage);
  };

  const togglePackDetails = (packId: string) => {
    setExpandedPack(expandedPack === packId ? null : packId);
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

  const PackCard = ({ pack }: { pack: StarterPack }) => {
    const isExpanded = expandedPack === pack.rkey;
    const packUrl = `https://bsky.app/starter-pack/${pack.creator}/${pack.rkey}`;

    console.log(`Rendering PackCard for rkey: ${pack.rkey}`, pack);

    return (
      <Card className="mb-4 hover:shadow-lg transition-shadow">
        <CardHeader className="cursor-pointer" onClick={() => togglePackDetails(pack.rkey)}>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Package className="h-5 w-5" />
                {pack.name || 'Unnamed Pack'}
              </CardTitle>
              <CardDescription>
                Created by {pack.creator || 'Unknown'} • {pack.user_count || 0} members
              </CardDescription>
            </div>
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent>
            {pack.description && (
              <p className="mb-4 text-gray-600">{pack.description}</p>
            )}

            <a
              href={packUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
            >
              View on Bluesky <ExternalLink className="h-4 w-4" />
            </a>

            {pack.users && pack.users.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Members:</h4>
                <div className="grid gap-2">
                  {pack.users.map((user) => {
                    if (!user.did) {
                      console.warn(`User missing 'did' in pack ${pack.rkey}`);
                      return null; // Skip rendering this user
                    }

                    return (
                      <div
                        key={user.did}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <span className="font-medium">{user.display_name || user.handle}</span>
                          {user.display_name && (
                            <span className="text-gray-500 ml-2">@{user.handle}</span>
                          )}
                        </div>
                        <a
                          href={`https://bsky.app/profile/${user.handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  const UserCard = ({ user }: { user: User }) => (
    <Card className="mb-4 hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5" />
              {user.display_name || user.handle}
            </CardTitle>
            {user.display_name && (
              <CardDescription>@{user.handle}</CardDescription>
            )}
          </div>
          <a
            href={`https://bsky.app/profile/${user.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </CardHeader>
      <CardContent>
        {user.followers_count !== undefined && (
          <p className="text-gray-600">Followers: {user.followers_count}</p>
        )}
        {user.packs && user.packs.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Member of {user.packs.length} packs:</h4>
            <div className="flex flex-wrap gap-2">
              {user.packs.map((pack) => {
                if (!pack.rkey) {
                  console.warn(`Pack missing 'rkey' for user ${user.did}`);
                  return null; // Skip rendering this pack
                }

                const packUrl = `https://bsky.app/starter-pack/${pack.creator}/${pack.rkey}`;
                console.log(`Constructed Pack URL: ${packUrl}`);

                const uniqueKey = `${user.did}-${pack.rkey}`; // Ensures uniqueness across different users

                return (
                  <a
                    key={uniqueKey}
                    href={packUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors flex items-center gap-1"
                  >
                    {pack.name || pack.rkey}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Starter Pack Explorer</h1>
        <p className="text-gray-600 mb-4">
          Search and explore Bluesky starter packs and their members
        </p>

        {renderStats()}
      </div>

      <div className="mb-8">
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setView('packs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              view === 'packs'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Package className="h-5 w-5" />
            Packs
          </button>
          <button
            onClick={() => setView('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
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
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
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
                <option value="members">Number of Users</option>
              </>
            ) : (
              <>
                <option value="">Default</option>
                <option value="name">User Name</option>
                <option value="followers">Number of Followers</option>
                <option value="packs">Number of Starter Packs</option>
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

      {error && (
        <div className="text-red-600 mb-4 text-center">{error}</div>
      )}

      <div>
        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading...</div>
        ) : searchResults?.items.length ? (
          <>
            <div className="space-y-4">
              {view === 'packs'
                ? (searchResults.items as StarterPack[]).map((pack) => (
                    pack.rkey ? <PackCard key={pack.rkey} pack={pack} /> : null
                  ))
                : (searchResults.items as User[]).map((user) => (
                    user.did ? <UserCard key={user.did} user={user} /> : null
                  ))}
            </div>
            
            <PaginationControls
              currentPage={currentPage}
              totalPages={searchResults.totalPages}
              onPageChange={handlePageChange}
              totalItems={searchResults.total}
              itemsPerPage={searchResults.itemsPerPage}
            />
          </>
        ) : searchQuery ? (
          <div className="text-center py-8 text-gray-600">
            No results found for &quot;{searchQuery}&quot;
          </div>
        ) : null}
      </div>

      <footer className="mt-12 pt-8 border-t text-center text-sm text-gray-600">
        <div className="space-x-4">
          <a href="/legal" className="hover:text-blue-600">Legal Notice</a>
          <a href="/privacy" className="hover:text-blue-600">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}
