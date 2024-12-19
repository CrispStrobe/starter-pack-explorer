// src/components/PackCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ExternalLink, Users, CalendarDays } from 'lucide-react';
import type { StarterPack } from '@/types';

interface PackCardProps {
  pack: StarterPack;
  onPackClick: (packId: string) => void;
}

export function PackCard({ pack, onPackClick }: PackCardProps) {
  if (!pack.rkey || !pack.creator) return null;

  const packUrl = `https://bsky.app/profile/${pack.creator}/pack/${pack.rkey}`;
  const createdDate = pack.created_at ? new Date(pack.created_at).toLocaleDateString() : 'Unknown date';

  return (
    <Card 
      className="mb-4 hover:shadow-lg transition-all cursor-pointer group" 
      onClick={() => onPackClick(pack.rkey)}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${pack.name} pack`}
      onKeyDown={(e) => e.key === 'Enter' && onPackClick(pack.rkey)}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardTitle className="text-xl flex items-center gap-2 group-hover:text-blue-600 transition-colors">
              <Package className="h-5 w-5" />
              {pack.name}
            </CardTitle>
            <div className="space-y-2 text-sm text-muted-foreground">
              <span className="block">
                Created by{' '}
                <a
                  href={`https://bsky.app/profile/${pack.creator}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    window.open(`https://bsky.app/profile/${pack.creator}`, '_blank', 'noopener,noreferrer');
                  }}
                  aria-label={`View profile of ${pack.creator_details?.display_name || pack.creator}`}
                >
                  {pack.creator_details?.display_name || pack.creator}
                </a>
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-500" />
                  {pack.user_count?.toLocaleString() || 0} members
                </span>
                {pack.weekly_joins > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="text-green-600">+{pack.weekly_joins.toLocaleString()}</span> this week
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4 text-gray-500" />
                  {createdDate}
                </span>
              </div>
            </div>
          </div>
          <a
            href={packUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-md hover:bg-blue-50
                     opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              window.open(packUrl, '_blank', 'noopener,noreferrer');
            }}
            aria-label={`Open ${pack.name} pack on Bluesky`}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </CardHeader>
      {pack.description && (
        <CardContent>
          <p className="text-gray-600 line-clamp-2 group-hover:line-clamp-none transition-all">
            {pack.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
}