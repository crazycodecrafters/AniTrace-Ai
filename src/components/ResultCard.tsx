import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink,
  Star,
  Calendar,
  Tv,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Maximize2,
  Sparkles,
  Film,
  Flame,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TraceCandidate } from '@/lib/storage';
import { MultiMatchInspector } from '@/components/MultiMatchInspector';

interface ResultCardProps {
  result: {
    trace: TraceCandidate;
    allCandidates?: TraceCandidate[];
    anilist: any;
    timestamp?: string;
  };
  onSelectCandidate?: (candidate: TraceCandidate) => void;
  onFindSimilar?: (anilist: any) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  onSelectCandidate,
  onFindSimilar,
}) => {
  const { trace, allCandidates, anilist } = result;
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, trace.video]);

  if (!anilist) {
    return (
      <div className="glass-card p-8 rounded-2xl text-center">
        <p className="text-muted-foreground">Anime metadata could not be loaded.</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const mainStudio =
    anilist.studios?.nodes?.find((s: any) => s.isAnimationStudio)?.name ||
    anilist.studios?.nodes?.[0]?.name;

  const similarityPct = (trace.similarity * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-6 sm:p-8 rounded-3xl space-y-6 border border-border/40"
    >
      {/* Top Banner & Match Confidence Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/20">
        <div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-xs px-2.5 py-0.5 font-bold font-mono ${
                trace.similarity >= 0.9
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : trace.similarity >= 0.8
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {similarityPct}% Match Confidence
            </Badge>
            {trace.episode && (
              <Badge variant="secondary" className="text-xs">
                Episode {trace.episode}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono truncate max-w-xl">
            Matched file: {trace.filename}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {anilist.trailer?.site === 'youtube' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTrailerModal(!showTrailerModal)}
              className="text-xs gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Play className="w-3.5 h-3.5 fill-red-400" />
              {showTrailerModal ? 'Hide Trailer' : 'Official Trailer'}
            </Button>
          )}
          {onFindSimilar && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onFindSimilar(anilist)}
              className="text-xs gap-1.5 glow-subtle"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Find Similar
            </Button>
          )}
        </div>
      </div>

      {/* Candidate Multi-Match Inspector */}
      {allCandidates && allCandidates.length > 1 && onSelectCandidate && (
        <MultiMatchInspector
          candidates={allCandidates}
          selectedCandidate={trace}
          onSelectCandidate={onSelectCandidate}
        />
      )}

      {/* Official YouTube Trailer Modal Embed */}
      <AnimatePresence>
        {showTrailerModal && anilist.trailer?.site === 'youtube' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl overflow-hidden border border-red-500/30 shadow-2xl bg-black"
          >
            <div className="relative w-full aspect-video">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${anilist.trailer.id}?autoplay=1`}
                title="Official Anime Trailer"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Preview Player with Interactive Controls */}
      <div className="relative rounded-2xl overflow-hidden border border-border/30 bg-black/90 group shadow-2xl">
        <video
          ref={videoRef}
          src={trace.video}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full aspect-video object-cover cursor-pointer"
          onClick={togglePlay}
        />

        {/* Video Overlay Control Bar */}
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={togglePlay}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all text-white"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            <button
              onClick={toggleMute}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all text-white"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Time Stamp badge */}
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-primary" />
              {formatTime(trace.from)} — {formatTime(trace.to)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed toggle */}
            <button
              onClick={() => {
                const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 0.5 : 1;
                setPlaybackSpeed(nextSpeed);
              }}
              className="text-xs font-mono px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md"
            >
              {playbackSpeed}x
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white"
              aria-label="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Anime Metadata Details Card */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Cover Poster */}
        <div className="w-32 sm:w-44 shrink-0 mx-auto sm:mx-0">
          <img
            src={anilist.coverImage?.extraLarge || anilist.coverImage?.large}
            alt={anilist.title?.romaji || 'Anime Poster'}
            className="w-full aspect-[2/3] object-cover rounded-xl border border-border/30 shadow-xl"
          />
        </div>

        {/* Info Body */}
        <div className="flex-1 space-y-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {anilist.title.romaji}
            </h2>
            {anilist.title.english && anilist.title.english !== anilist.title.romaji && (
              <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
                {anilist.title.english}
              </p>
            )}
            {anilist.title.native && (
              <p className="text-xs text-muted-foreground/60 font-mono mt-0.5">
                {anilist.title.native}
              </p>
            )}
          </div>

          {/* Key metadata badges */}
          <div className="flex flex-wrap items-center gap-2">
            {anilist.format && (
              <Badge variant="secondary" className="font-semibold text-xs">
                {anilist.format.replace('_', ' ')}
              </Badge>
            )}
            {mainStudio && (
              <Badge variant="outline" className="border-primary/40 text-primary text-xs">
                {mainStudio}
              </Badge>
            )}
            {anilist.seasonYear && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {anilist.season} {anilist.seasonYear}
              </span>
            )}
            {anilist.episodes && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Tv className="w-3.5 h-3.5" />
                {anilist.episodes} Episodes
              </span>
            )}
            {anilist.averageScore && (
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {anilist.averageScore}%
              </span>
            )}
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {anilist.genres?.map((genre: string) => (
              <span
                key={genre}
                className="text-xs px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-glow font-medium"
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Streaming & Outbound Links */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => window.open(`https://anilist.co/anime/${anilist.id}`, '_blank')}
            >
              View on AniList <ExternalLink className="w-3.5 h-3.5" />
            </Button>
            {anilist.idMal && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => window.open(`https://myanimelist.net/anime/${anilist.idMal}`, '_blank')}
              >
                MyAnimeList <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Description / Synopsis */}
      {anilist.description && (
        <div className="pt-4 border-t border-border/20 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Synopsis
            </h4>
            <button
              onClick={() => setShowFullSynopsis(!showFullSynopsis)}
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              {showFullSynopsis ? 'Show less' : 'Read more'}
              {showFullSynopsis ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
          <div
            className={`text-sm text-muted-foreground/90 leading-relaxed transition-all ${
              showFullSynopsis ? '' : 'line-clamp-3'
            }`}
            dangerouslySetInnerHTML={{
              __html: anilist.description.replace(/<br\s*[\/]?>/gi, '<br />'),
            }}
          />
        </div>
      )}

      {/* Character Voice Actors Mini Preview */}
      {anilist.characters?.edges && anilist.characters.edges.length > 0 && (
        <div className="pt-4 border-t border-border/20 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Featured Characters & Japanese Voice Cast
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {anilist.characters.edges.slice(0, 6).map((edge: any, idx: number) => {
              const char = edge.node;
              const va = edge.voiceActors?.[0];
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center text-center p-2 rounded-xl bg-card/40 border border-border/20"
                >
                  {char.image?.medium && (
                    <img
                      src={char.image.medium}
                      alt={char.name.full}
                      className="w-12 h-12 rounded-full object-cover border border-primary/30 shadow mb-1.5"
                    />
                  )}
                  <p className="text-xs font-bold truncate w-full text-foreground">
                    {char.name.full}
                  </p>
                  {va && (
                    <p className="text-[10px] text-muted-foreground truncate w-full">
                      🎙️ {va.name.full}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};
