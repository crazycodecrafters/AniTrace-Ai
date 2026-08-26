import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  History,
  Sparkles,
  TrendingUp,
  Award,
  Film,
  Camera,
  Layers,
  Star,
  ExternalLink,
  Command,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { searchAnime, AniListMedia } from '@/lib/anilist';
import { getHistory, HistoryItem } from '@/lib/storage';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnime: (media: AniListMedia) => void;
  onNavigateTab: (tab: 'scan' | 'text' | 'discover' | 'history') => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectAnime,
  onNavigateTab,
}) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AniListMedia[]>([]);
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load recent history when palette opens
  useEffect(() => {
    if (isOpen) {
      getHistory().then((h) => setRecentHistory(h.slice(0, 5)));
      setQuery('');
      setSearchResults([]);
    }
  }, [isOpen]);

  // Live search debounce
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchAnime({ query: query.trim(), perPage: 6 });
        setSearchResults(data.media || []);
      } catch (err) {
        console.error('Command search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 bg-card/95 backdrop-blur-2xl border-border/40 text-foreground overflow-hidden shadow-2xl rounded-2xl">
        <DialogTitle className="sr-only">Quick Search Command Palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search anime titles, recent scans, and explore discovery feeds.
        </DialogDescription>

        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-border/30 h-14">
          <Search className="w-5 h-5 text-primary shrink-0 mr-3" />
          <input
            type="text"
            placeholder="Search anime, genres, or actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono bg-muted/60 text-muted-foreground rounded">
            ESC
          </kbd>
        </div>

        {/* Results / Navigation Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {/* Live Search Results */}
          {query.trim() && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase px-2 tracking-wider">
                {loading ? 'Searching...' : `Anime Matches (${searchResults.length})`}
              </div>

              {searchResults.length > 0 ? (
                searchResults.map((anime) => (
                  <button
                    key={anime.id}
                    onClick={() => {
                      onSelectAnime(anime);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-primary/10 transition-colors text-left group"
                  >
                    <img
                      src={anime.coverImage.medium || anime.coverImage.large}
                      alt={anime.title.romaji}
                      className="w-10 h-14 object-cover rounded-lg shrink-0 border border-border/30"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                        {anime.title.romaji}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {anime.title.english || anime.genres?.slice(0, 2).join(' • ')}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                        {anime.averageScore && (
                          <span className="text-amber-400 font-medium flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-400" />
                            {anime.averageScore}%
                          </span>
                        )}
                        {anime.format && <span>{anime.format}</span>}
                        {anime.seasonYear && <span>{anime.seasonYear}</span>}
                      </div>
                    </div>
                  </button>
                ))
              ) : !loading ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No anime matching "{query}". Try another title or check spelling.
                </div>
              ) : null}
            </div>
          )}

          {/* Quick Navigation Actions (when no query or general) */}
          {!query.trim() && (
            <>
              {/* Quick Actions */}
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase px-2 tracking-wider">
                  Quick Navigation
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onNavigateTab('scan');
                      onClose();
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card/60 hover:bg-primary/15 border border-border/30 hover:border-primary/40 text-left transition-all text-xs font-medium"
                  >
                    <Camera className="w-4 h-4 text-primary" />
                    <span>Scene Scanner</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigateTab('text');
                      onClose();
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card/60 hover:bg-primary/15 border border-border/30 hover:border-primary/40 text-left transition-all text-xs font-medium"
                  >
                    <Search className="w-4 h-4 text-cyan-400" />
                    <span>Title & Filters Search</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigateTab('discover');
                      onClose();
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card/60 hover:bg-primary/15 border border-border/30 hover:border-primary/40 text-left transition-all text-xs font-medium"
                  >
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span>Discover Trending</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigateTab('history');
                      onClose();
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card/60 hover:bg-primary/15 border border-border/30 hover:border-primary/40 text-left transition-all text-xs font-medium"
                  >
                    <History className="w-4 h-4 text-purple-400" />
                    <span>Saved Scans History</span>
                  </button>
                </div>
              </div>

              {/* Recent Scan History */}
              {recentHistory.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border/20">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase px-2 tracking-wider">
                    Recent Scans
                  </div>
                  {recentHistory.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.fullMedia) {
                          onSelectAnime(item.fullMedia);
                        } else {
                          onNavigateTab('history');
                        }
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-card/80 transition-colors text-left"
                    >
                      <img
                        src={item.coverUrl}
                        alt={item.title}
                        className="w-8 h-11 object-cover rounded-lg shrink-0 border border-border/30"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate text-foreground">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {item.genres?.slice(0, 2).join(', ')} • {new Date(item.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      {item.similarity && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-mono font-medium">
                          {(item.similarity * 100).toFixed(0)}%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-muted/20 border-t border-border/20 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            Tip: Press <kbd className="px-1 py-0.5 rounded bg-muted font-mono">Ctrl+K</kbd> anywhere to search
          </span>
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3 text-primary" /> Anime Lens
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
