import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Film, Tv, Info, SlidersHorizontal, ArrowUpRight } from 'lucide-react';
import { searchAnime, AniListMedia } from '@/lib/anilist';
import { rankSimilarAnime, RecommendationMatch } from '@/lib/embeddings';
import { Badge } from '@/components/ui/badge';
import { AnimeDetailModal } from '@/components/AnimeDetailModal';

interface RecommendationsPanelProps {
  currentResult: any;
  onSelectAnime?: (media: AniListMedia) => void;
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  currentResult,
  onSelectAnime,
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationMatch[]>([]);
  const [filteredRecs, setFilteredRecs] = useState<RecommendationMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'high_match' | 'tv' | 'movie'>('all');
  const [selectedModalMedia, setSelectedModalMedia] = useState<AniListMedia | null>(null);

  const anilist = currentResult?.anilist;

  useEffect(() => {
    if (!anilist) return;
    fetchRecommendations();
  }, [anilist?.id]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      if (!anilist?.genres || anilist.genres.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch a rich candidate pool of anime with overlapping genres
      const targetGenres = anilist.genres.slice(0, 3);
      const searchData = await searchAnime({
        genres: targetGenres,
        perPage: 30,
        sort: ['POPULARITY_DESC', 'SCORE_DESC'],
      });

      // Also if relations exist in anilist, add them to candidate pool
      const relationCandidates: AniListMedia[] =
        anilist.relations?.edges?.map((e: any) => e.node as any) || [];

      const candidatePool = [...searchData.media, ...relationCandidates];

      // Rank candidate pool using client-side embeddings engine
      const ranked = rankSimilarAnime(anilist, candidatePool, 12);
      setRecommendations(ranked);
      setFilteredRecs(ranked);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let list = [...recommendations];
    if (filterType === 'high_match') {
      list = list.filter((r) => r.matchPercentage >= 75);
    } else if (filterType === 'tv') {
      list = list.filter((r) => r.media.format === 'TV');
    } else if (filterType === 'movie') {
      list = list.filter((r) => r.media.format === 'MOVIE');
    }
    setFilteredRecs(list);
  }, [filterType, recommendations]);

  if (loading) {
    return (
      <div className="glass-card p-8 rounded-3xl text-center space-y-3 border border-border/30">
        <div className="animate-pulse p-3.5 rounded-2xl bg-primary/10 text-primary w-fit mx-auto">
          <Sparkles className="w-6 h-6 animate-spin" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">
          Computing Neural Similarity Vectors...
        </h4>
        <p className="text-xs text-muted-foreground">
          Running client-side nearest-neighbor cosine matching against genre and theme embeddings.
        </p>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-6 sm:p-8 rounded-3xl space-y-6 border border-border/40"
    >
      {/* Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary glow-subtle">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">AI Vector Recommendations</h3>
            <p className="text-xs text-muted-foreground">
              Ranked by cosine similarity over genre, theme tags, and tone
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-all text-xs border ${
              filterType === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/40 text-muted-foreground border-border/30 hover:border-primary/40'
            }`}
          >
            All Matches
          </button>
          <button
            onClick={() => setFilterType('high_match')}
            className={`px-3 py-1 rounded-lg font-medium transition-all text-xs border ${
              filterType === 'high_match'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/40 text-muted-foreground border-border/30 hover:border-primary/40'
            }`}
          >
            ⚡ 75%+ Similarity
          </button>
          <button
            onClick={() => setFilterType('tv')}
            className={`px-3 py-1 rounded-lg font-medium transition-all text-xs border ${
              filterType === 'tv'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/40 text-muted-foreground border-border/30 hover:border-primary/40'
            }`}
          >
            TV Series
          </button>
          <button
            onClick={() => setFilterType('movie')}
            className={`px-3 py-1 rounded-lg font-medium transition-all text-xs border ${
              filterType === 'movie'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/40 text-muted-foreground border-border/30 hover:border-primary/40'
            }`}
          >
            Movies
          </button>
        </div>
      </div>

      {/* Grid of Recommendation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        {filteredRecs.map((rec, idx) => (
          <motion.div
            key={rec.media.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(idx * 0.04, 0.4) }}
            whileHover={{ y: -4 }}
            onClick={() => setSelectedModalMedia(rec.media)}
            className="group relative flex flex-col rounded-xl overflow-hidden glass-card border border-border/30 hover:border-primary/50 transition-all cursor-pointer shadow-md"
          >
            {/* Poster */}
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
              <img
                src={rec.media.coverImage.large || rec.media.coverImage.extraLarge}
                alt={rec.media.title.romaji}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />

              {/* Similarity Match Badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                {rec.matchPercentage}% Match
              </div>

              {/* Score */}
              {rec.media.averageScore && (
                <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-amber-500/20">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  {rec.media.averageScore}%
                </div>
              )}

              {/* Format tag */}
              {rec.media.format && (
                <div className="absolute bottom-2 left-2 text-[9px] px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md font-medium text-white">
                  {rec.media.format}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-2.5 flex flex-col flex-1 justify-between space-y-1 bg-card/80">
              <h4 className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {rec.media.title.romaji}
              </h4>

              {rec.matchReasons.length > 0 && (
                <p className="text-[10px] text-muted-foreground truncate font-mono">
                  {rec.matchReasons[0]}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal View for Recommendation Click */}
      <AnimeDetailModal
        media={selectedModalMedia}
        isOpen={Boolean(selectedModalMedia)}
        onClose={() => setSelectedModalMedia(null)}
        onFindSimilar={(m) => {
          setSelectedModalMedia(null);
          if (onSelectAnime) onSelectAnime(m);
        }}
      />
    </motion.div>
  );
};
