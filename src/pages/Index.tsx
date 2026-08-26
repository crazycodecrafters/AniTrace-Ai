import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scan,
  Search,
  Sparkles,
  TrendingUp,
  History,
  Award,
  Zap,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { SearchHeader } from '@/components/SearchHeader';
import { ScanInterface } from '@/components/ScanInterface';
import { TextSearchInterface } from '@/components/TextSearchInterface';
import { ResultCard } from '@/components/ResultCard';
import { RecommendationsPanel } from '@/components/RecommendationsPanel';
import { CommandPalette } from '@/components/CommandPalette';
import { HistoryDrawer } from '@/components/HistoryDrawer';
import { BadgesModal } from '@/components/BadgesModal';
import { AnimeDetailModal } from '@/components/AnimeDetailModal';
import { saveToHistory, recordScanEvent, TraceCandidate, HistoryItem } from '@/lib/storage';
import { AniListMedia, getAnimeById } from '@/lib/anilist';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'scan' | 'text' | 'discover' | 'history'>('scan');
  const [currentResult, setCurrentResult] = useState<{
    trace: TraceCandidate;
    allCandidates?: TraceCandidate[];
    anilist: AniListMedia;
    timestamp: string;
    imagePreviewUrl?: string;
  } | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Modals & Drawers state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [detailModalMedia, setDetailModalMedia] = useState<AniListMedia | null>(null);

  const { toast } = useToast();

  // Keyboard shortcut listener for Ctrl+K, Cmd+K, and /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleScanComplete = async (result: {
    trace: TraceCandidate;
    allCandidates: TraceCandidate[];
    anilist: AniListMedia;
    timestamp: string;
    imagePreviewUrl?: string;
  }) => {
    setCurrentResult(result);
    setShowResult(true);

    if (result.anilist) {
      const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      };

      // 1. Save extended record to History
      await saveToHistory({
        id: crypto.randomUUID(),
        anilistId: result.anilist.id,
        title: result.anilist.title?.romaji || 'Unknown Anime',
        englishTitle: result.anilist.title?.english,
        nativeTitle: result.anilist.title?.native,
        coverUrl: result.anilist.coverImage?.large || result.imagePreviewUrl || '',
        bannerUrl: result.anilist.bannerImage,
        timestamp: result.timestamp,
        episode: result.trace.episode,
        timeRange: `${formatTime(result.trace.from)} - ${formatTime(result.trace.to)}`,
        similarity: result.trace.similarity,
        videoUrl: result.trace.video,
        tags: result.anilist.tags?.slice(0, 5).map((t) => t.name) || [],
        synopsis: result.anilist.description?.substring(0, 200) || '',
        genres: result.anilist.genres || [],
        score: result.anilist.averageScore,
        format: result.anilist.format,
        seasonYear: result.anilist.seasonYear,
        allCandidates: result.allCandidates,
        fullMedia: result.anilist,
      });

      // 2. Record Gamification Scan Event (XP, Level, Streaks, Badges)
      const { leveledUp, newLevel, newBadges, gainedXp } = await recordScanEvent({
        similarity: result.trace.similarity,
        genres: result.anilist.genres,
      });

      // Notify level up
      if (leveledUp) {
        toast({
          title: '🎉 Level Up!',
          description: `Congratulations! You've reached Level ${newLevel}! (+${gainedXp} XP)`,
        });
      }

      // Notify new badges unlocked
      if (newBadges.length > 0) {
        newBadges.forEach((b) => {
          toast({
            title: `🏆 Badge Unlocked: ${b.title}`,
            description: `${b.description} (+${b.xpReward} XP)`,
          });
        });
      }
    }
  };

  const handleScanStart = () => {
    setShowResult(false);
  };

  const handleSelectCandidate = async (candidate: TraceCandidate) => {
    if (!currentResult) return;

    if (candidate.anilist !== currentResult.anilist.id) {
      const newMedia = await getAnimeById(candidate.anilist);
      setCurrentResult({
        ...currentResult,
        trace: candidate,
        anilist: newMedia || currentResult.anilist,
      });
    } else {
      setCurrentResult({
        ...currentResult,
        trace: candidate,
      });
    }
  };

  const handleSelectHistoryItem = async (item: HistoryItem) => {
    if (item.fullMedia) {
      setDetailModalMedia(item.fullMedia);
    } else {
      const full = await getAnimeById(item.anilistId);
      if (full) {
        setDetailModalMedia(full);
      }
    }
  };

  const handleFindSimilarAnime = async (media: AniListMedia) => {
    // Scroll to recommendations or switch to scan tab with selected media
    if (currentResult && currentResult.anilist?.id === media.id) {
      const element = document.getElementById('recommendations-section');
      element?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Set as simulated result to compute recommendations
      setCurrentResult({
        trace: {
          anilist: media.id,
          filename: `${media.title?.romaji || 'Anime'}.mp4`,
          episode: 1,
          from: 0,
          to: 0,
          similarity: 1.0,
          video: '',
          image: media.coverImage?.large || '',
        },
        allCandidates: [],
        anilist: media,
        timestamp: new Date().toISOString(),
      });
      setShowResult(true);
      setActiveTab('scan');
      setTimeout(() => {
        const element = document.getElementById('recommendations-section');
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative selection:bg-primary selection:text-primary-foreground">
      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:top-4 focus:left-4 font-semibold"
      >
        Skip to main content
      </a>

      {/* Search Header Bar */}
      <SearchHeader
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'history') {
            setIsHistoryDrawerOpen(true);
          }
        }}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenBadges={() => setIsBadgesModalOpen(true)}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
      />

      {/* Main Container */}
      <main id="main-content" className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Dynamic Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12 space-y-3"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 glow-subtle">
              {activeTab === 'scan' ? (
                <Scan className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              ) : activeTab === 'text' ? (
                <Search className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" />
              ) : (
                <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              AniTrace AI
            </h1>
          </div>

          <p className="text-lg sm:text-xl font-medium text-foreground/90 max-w-2xl mx-auto">
            {activeTab === 'scan'
              ? 'Identify Any Anime Scene from Screenshots • Neural Recommendations'
              : activeTab === 'text'
              ? 'Comprehensive Title Search & Deep Anime Metadata Explorer'
              : 'Trending Releases, Top Rated Classics & Seasonal Hits'}
          </p>

          <p className="text-xs sm:text-sm text-muted-foreground">
            ⚡ Privacy-first • 100% Client-Side Vectors • Instant AniList Intelligence
          </p>
        </motion.div>

        {/* Tab View Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'scan' && (
            <motion.div
              key="scan-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-10"
            >
              {/* Scene Scanner */}
              <ScanInterface
                onScanComplete={handleScanComplete}
                onScanStart={handleScanStart}
              />

              {/* Scan Results & Multi-Match Inspector */}
              {showResult && currentResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-8"
                >
                  <ResultCard
                    result={currentResult}
                    onSelectCandidate={handleSelectCandidate}
                    onFindSimilar={handleFindSimilarAnime}
                  />

                  <div id="recommendations-section">
                    <RecommendationsPanel
                      currentResult={currentResult}
                      onSelectAnime={handleFindSimilarAnime}
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'text' && (
            <motion.div
              key="text-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <TextSearchInterface onFindSimilar={handleFindSimilarAnime} />
            </motion.div>
          )}

          {activeTab === 'discover' && (
            <motion.div
              key="discover-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <TextSearchInterface onFindSimilar={handleFindSimilarAnime} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center mt-20 pb-10"
        >
          <div className="glass-card inline-block px-8 py-6 rounded-3xl border border-border/30 shadow-xl">
            <p className="text-sm text-muted-foreground mb-1.5">
              Developed with ❤️ by <span className="text-primary font-bold">M KEERTHI VARDHAN</span>
            </p>
            <p className="text-xs text-muted-foreground/70 mb-4">
              Powered by trace.moe & AniList GraphQL • High-Performance Vector Similarity
            </p>
            <div className="flex items-center justify-center gap-6 text-xs sm:text-sm">
              <motion.a
                href="https://github.com/keerthivardhanm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-glow transition-smooth flex items-center gap-1.5 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                GitHub
              </motion.a>
              <span className="text-border">•</span>
              <motion.a
                href="https://keerthivardhanmportfolio.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-glow transition-smooth flex items-center gap-1.5 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Portfolio
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.a>
            </div>
          </div>
        </motion.footer>
      </main>

      {/* Global Modals & Drawers */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectAnime={(media) => setDetailModalMedia(media)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'history') setIsHistoryDrawerOpen(true);
        }}
      />

      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => {
          setIsHistoryDrawerOpen(false);
          if (activeTab === 'history') setActiveTab('scan');
        }}
        onSelectHistoryItem={handleSelectHistoryItem}
      />

      <BadgesModal
        isOpen={isBadgesModalOpen}
        onClose={() => setIsBadgesModalOpen(false)}
      />

      <AnimeDetailModal
        media={detailModalMedia}
        isOpen={Boolean(detailModalMedia)}
        onClose={() => setDetailModalMedia(null)}
        onFindSimilar={handleFindSimilarAnime}
      />

      {/* Ambient Lighting Background Accents */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-primary/8 rounded-full blur-[130px]" />
      </div>
    </div>
  );
};

export default Index;
