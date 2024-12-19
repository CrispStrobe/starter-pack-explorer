// src/components/UserCard.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, ExternalLink, Package } from 'lucide-react';
import type { PackBasic } from '@/types';

interface UserCardProps {
  user: {
    did: string;
    handle: string;
    display_name?: string;
    followers_count?: number;
    follows_count?: number;
    member_packs?: PackBasic[];
    created_packs?: PackBasic[];
  };
  onPackClick: (packId: string) => void;
}

export function UserCard({ user, onPackClick }: UserCardProps) {
  return (
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
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {user.followers_count !== undefined && (
            <p className="text-gray-600">
              {user.followers_count.toLocaleString()} followers
              {user.follows_count !== undefined && (
                <span className="ml-2">· {user.follows_count.toLocaleString()} following</span>
              )}
            </p>
          )}

          {/* Created Packs - show first */}
          {user.created_packs && user.created_packs.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-700">
                <Package className="h-4 w-4" />
                Created Packs ({user.created_packs.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {user.created_packs.map((pack) => (
                  <button
                    key={pack.rkey}
                    onClick={() => onPackClick(pack.rkey)}
                    className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm 
                             hover:bg-green-200 transition-colors flex items-center gap-1 group"
                  >
                    {pack.name}
                    <Package className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Member Packs */}
          {user.member_packs && user.member_packs.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-700">
                <Users className="h-4 w-4" />
                Member of ({user.member_packs.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {user.member_packs.map((pack) => (
                  <button
                    key={pack.rkey}
                    onClick={() => onPackClick(pack.rkey)}
                    className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm 
                             hover:bg-blue-200 transition-colors flex items-center gap-1 group"
                  >
                    {pack.name}
                    <Users className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}