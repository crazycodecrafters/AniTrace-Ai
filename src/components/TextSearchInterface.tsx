import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  X,
  Star,
  Calendar,
  Tv,
  Film,
  Sparkles,
  TrendingUp,
  Award,
  Loader2,
  Filter,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import {
  searchAnime,
  getTrendingAnime,
  getSeasonalAnime,
  getTopRatedAnime,
  ANIME_GENRES,
  ANIME_FORMATS,
  ANIME_STATUSES,
  ANIME_SORT_OPTIONS,
  AniListMedia,
  SearchOptions,
} from '@/lib/anilist';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { AnimeDetailModal } from '@/components/AnimeDetailModal';

interface TextSearchInterfaceProps {
  onFindSimilar?: (media: AniListMedia) => void;
  initialQuery?: string;
}

export const TextSearchInterface: React.FC<TextSearchInterfaceProps> = ({
  onFindSimilar,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<'search' | 'trending' | 'seasonal' | 'topRated'>('search');
  const [results, setResults] = useState<AniListMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSort, setSelectedSort] = useState<string>('POPULARITY_DESC');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [minScore, setMinScore] = useState<number>(0);

  // Selected anime for details modal
  const [detailMedia, setDetailMedia] = useState<AniListMedia | null>(null);

  // Debounced search trigger
  const executeSearch = useCallback(
    async (currentPage = 1, append = false) => {
      setLoading(true);
      try {
        if (activeCategory === 'trending' && !query.trim() && selectedGenres.length === 0) {
          const list = await getTrendingAnime(24);
          setResults(list);
          setHasNextPage(false);
          setTotalCount(list.length);
        } else if (activeCategory === 'seasonal' && !query.trim() && selectedGenres.length === 0) {
          const list = await getSeasonalAnime(24);
          setResults(list);
          setHasNextPage(false);
          setTotalCount(list.length);
        } else if (activeCategory === 'topRated' && !query.trim() && selectedGenres.length === 0) {
          const list = await getTopRatedAnime(24);
          setResults(list);
          setHasNextPage(false);
          setTotalCount(list.length);
        } else {
          const options: SearchOptions = {
            query: query.trim() || undefined,
            page: currentPage,
            perPage: 18,
            genres: selectedGenres.length > 0 ? selectedGenres : undefined,
            format: selectedFormat !== 'ALL' ? selectedFormat : undefined,
            status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
            seasonYear: selectedYear !== 'ALL' ? parseInt(selectedYear, 10) : undefined,
            minScore: minScore > 0 ? minScore : undefined,
            sort: [selectedSort as any],
          };

          const data = await searchAnime(options);
          if (append) {
            setResults((prev) => [...prev, ...data.media]);
          } else {
            setResults(data.media);
          }
          setHasNextPage(data.pageInfo.hasNextPage);
          setTotalCount(data.pageInfo.total);
        }
      } catch (err) {
        console.error('Text search error:', err);
      } finally {
        setLoading(false);
      }
    },
    [
      query,
      activeCategory,
      selectedGenres,
      selectedFormat,
      selectedStatus,
      selectedSort,
      selectedYear,
      minScore,
    ]
  );

  // Initial load & search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      executeSearch(1, false);
    }, 300);
    return () => clearTimeout(timer);
  }, [executeSearch]);

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const resetFilters = () => {
    setSelectedGenres([]);
    setSelectedFormat('ALL');
    setSelectedStatus('ALL');
    setSelectedSort('POPULARITY_DESC');
    setSelectedYear('ALL');
    setMinScore(0);
    setQuery('');
  };

  const hasActiveFilters =
    selectedGenres.length > 0 ||
    selectedFormat !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedSort !== 'POPULARITY_DESC' ||
    selectedYear !== 'ALL' ||
    minScore > 0;

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 25 }, (_, i) => String(currentYear + 1 - i));

  return (
    <div className="w-full space-y-6">
      {/* Search Header Bar */}
      <div className="glass-card p-4 sm:p-6 rounded-2xl space-y-4">
        {/* Input & Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search anime by title (e.g. Frieren, Demon Slayer, Steins;Gate)..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (activeCategory !== 'search') setActiveCategory('search');
              }}
              className="pl-10 pr-9 bg-background/50 h-11 text-sm rounded-xl border-border/40 focus-visible:ring-primary"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`gap-2 h-11 rounded-xl border ${
                showFilters || hasActiveFilters
                  ? 'bg-primary/15 border-primary text-primary shadow-sm'
                  : 'border-border/40'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-11 px-2.5 text-muted-foreground hover:text-foreground"
                title="Reset all filters"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Discovery Presets Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/20">
          <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">Explore:</span>
          <Button
            variant={activeCategory === 'search' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => {
              setActiveCategory('search');
            }}
            className="text-xs h-8 rounded-lg gap-1.5"
          >
            <Search className="w-3 h-3" />
            All Anime
          </Button>
          <Button
            variant={activeCategory === 'trending' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => {
              setActiveCategory('trending');
              setQuery('');
            }}
            className="text-xs h-8 rounded-lg gap-1.5"
          >
            <TrendingUp className="w-3 h-3 text-cyan-400" />
            Trending Now
          </Button>
          <Button
            variant={activeCategory === 'seasonal' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => {
              setActiveCategory('seasonal');
              setQuery('');
            }}
            className="text-xs h-8 rounded-lg gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            This Season
          </Button>
          <Button
            variant={activeCategory === 'topRated' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => {
              setActiveCategory('topRated');
              setQuery('');
            }}
            className="text-xs h-8 rounded-lg gap-1.5"
          >
            <Award className="w-3 h-3 text-primary" />
            Top Rated
          </Button>
        </div>

        {/* Expandable Filters Section */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 border-t border-border/30 space-y-4"
            >
              {/* Dropdowns row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Format */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Format</label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger className="h-9 text-xs bg-background/50">
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Formats</SelectItem>
                      {ANIME_FORMATS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="h-9 text-xs bg-background/50">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      {ANIME_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Year */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Release Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="h-9 text-xs bg-background/50">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      <SelectItem value="ALL">All Years</SelectItem>
                      {yearOptions.map((yr) => (
                        <SelectItem key={yr} value={yr}>
                          {yr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Sort Order</label>
                  <Select value={selectedSort} onValueChange={setSelectedSort}>
                    <SelectTrigger className="h-9 text-xs bg-background/50">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      {ANIME_SORT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Min Score Slider */}
              <div className="p-3 rounded-xl bg-card/50 border border-border/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Minimum AniList Score</span>
                  <span className="text-primary font-bold">{minScore > 0 ? `${minScore}%` : 'Any Score'}</span>
                </div>
                <Slider
                  value={[minScore]}
                  min={0}
                  max={90}
                  step={5}
                  onValueChange={(val) => setMinScore(val[0])}
                  className="py-1"
                />
              </div>

              {/* Genre Pills */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Filter by Genres</span>
                  {selectedGenres.length > 0 && (
                    <button
                      onClick={() => setSelectedGenres([])}
                      className="text-primary text-[11px] hover:underline"
                    >
                      Clear genres ({selectedGenres.length})
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {ANIME_GENRES.map((genre) => {
                    const isSelected = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        onClick={() => handleGenreToggle(genre)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-sm'
                            : 'bg-muted/40 text-muted-foreground border-border/40 hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {loading && results.length === 0
              ? 'Searching anime database...'
              : totalCount !== null
              ? `Found ${totalCount.toLocaleString()} Anime Results`
              : `${results.length} Anime`}
          </h3>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
        </div>

        {/* Anime Grid */}
        {results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {results.map((anime, idx) => {
              const studio = anime.studios?.nodes?.find((s) => s.isAnimationStudio)?.name || anime.studios?.nodes?.[0]?.name;

              return (
                <motion.div
                  key={anime.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  whileHover={{ y: -4 }}
                  onClick={() => setDetailMedia(anime)}
                  className="group relative cursor-pointer flex flex-col rounded-xl overflow-hidden glass-card border border-border/30 hover:border-primary/50 transition-all shadow-md"
                >
                  {/* Poster Image */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
                    <img
                      src={anime.coverImage.large || anime.coverImage.extraLarge}
                      alt={anime.title.romaji}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Score Badge */}
                    {anime.averageScore && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[11px] font-bold text-amber-300 border border-amber-500/20">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {anime.averageScore}%
                      </div>
                    )}

                    {/* Format / Year tag */}
                    <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                      {anime.format && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md font-medium text-white">
                          {anime.format}
                        </span>
                      )}
                      {anime.seasonYear && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md font-medium text-zinc-300">
                          {anime.seasonYear}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info Card */}
                  <div className="p-3 flex flex-col flex-1 justify-between space-y-1.5 bg-card/80">
                    <div>
                      <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {anime.title.romaji}
                      </h4>
                      {studio && (
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {studio}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {anime.genres?.slice(0, 2).map((g) => (
                        <span
                          key={g}
                          className="text-[9px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary-glow font-medium"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : !loading ? (
          <div className="glass-card p-12 rounded-2xl text-center space-y-3">
            <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto text-primary">
              <Search className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-semibold">No anime matches found</h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Try adjusting your search query, clearing genre filters, or lowering the minimum score.
            </p>
            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2">
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] rounded-xl bg-card/40 animate-pulse border border-border/20"
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasNextPage && !loading && (
          <div className="text-center pt-6 pb-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const nextPage = page + 1;
                setPage(nextPage);
                executeSearch(nextPage, true);
              }}
              className="gap-2 glow-subtle rounded-xl"
            >
              Load More Anime
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Anime Detail Modal */}
      <AnimeDetailModal
        media={detailMedia}
        isOpen={Boolean(detailMedia)}
        onClose={() => setDetailMedia(null)}
        onFindSimilar={onFindSimilar}
      />
    </div>
  );
};
