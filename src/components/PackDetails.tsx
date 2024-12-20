import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink, Users, Package, CalendarDays, TrendingUp, X } from 'lucide-react';
import type { StarterPack } from '@/types';

interface PackDetailsProps {
  packId: string;
  onClose?: () => void;
  onUserClick?: (userId: string) => void;
}

export function PackDetails({ packId, onClose, onUserClick }: PackDetailsProps) {
  const [pack, setPack] = useState<StarterPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchPackDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/pack/${packId}`, {
          signal: abortController.signal
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('Pack not found. It might have been deleted or made private.');
            return;
          }
          throw new Error('Failed to fetch pack details');
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setPack(data);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'An error occurred while loading pack details');
      } finally {
        setLoading(false);
      }
    };

    fetchPackDetails();
    return () => abortController.abort();
  }, [packId]);

  if (loading) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader>
          <div className="h-8 bg-gray-200 rounded-md w-2/3 mb-2" />
          <div className="h-4 bg-gray-200 rounded-md w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded-md w-full" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded-md" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!pack) return null;

  const packUrl = `https://bsky.app/profile/${pack.creator}/pack/${pack.rkey}`;
  const createdDate = new Date(pack.created_at).toLocaleDateString();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Package className="h-6 w-6" />
              {pack.name}
            </CardTitle>
            <CardDescription className="mt-2">
              Created by{' '}
              <a
                href={`https://bsky.app/profile/${pack.creator}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm"
              >
                {pack.creator_details?.display_name || pack.creator}
              </a>
              {pack.creator_details?.followers_count !== undefined && (
                <span className="text-gray-500">
                  {' '}· {pack.creator_details.followers_count.toLocaleString()} followers
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={packUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-md hover:bg-blue-50"
              aria-label="View on Bluesky"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {pack.description && (
          <p className="text-gray-600 mb-6">{pack.description}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <div>
              <div className="font-medium">{pack.user_count.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Members</div>
            </div>
          </div>
          
          {pack.weekly_joins > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-500" />
              <div>
                <div className="font-medium">{pack.weekly_joins.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Weekly Joins</div>
              </div>
            </div>
          )}

          {pack.total_joins > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-500" />
              <div>
                <div className="font-medium">{pack.total_joins.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Joins</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-gray-500" />
            <div>
              <div className="font-medium">{createdDate}</div>
              <div className="text-sm text-gray-500">Created</div>
            </div>
          </div>
        </div>

        {pack.users && pack.users.length > 0 && pack.members && (
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Users className="h-5 w-5" />
              Members ({pack.users.length.toLocaleString()})
            </h4>
            <div className="grid gap-2">
              {pack.members && pack.members.length > 0 && (
                <div className="grid gap-2">
                  {pack.members.map((member) => (
                    <div
                      key={member.did}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <button
                        onClick={() => onUserClick && onUserClick(member.did)}
                        className="flex-1 text-left hover:text-blue-600 transition-colors"
                      >
                        <span className="font-medium">
                          {member.display_name || member.handle}
                        </span>
                        {member.display_name && (
                          <span className="text-gray-500 ml-2">@{member.handle}</span>
                        )}
                        {member.followers_count !== undefined && (
                          <span className="text-gray-500 ml-2">
                            · {member.followers_count.toLocaleString()} followers
                          </span>
                        )}
                      </button>
                      <a
                        href={`https://bsky.app/profile/${member.handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`View ${member.display_name || member.handle}'s profile on Bluesky`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
