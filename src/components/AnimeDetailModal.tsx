import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Star,
  Calendar,
  Tv,
  Film,
  Sparkles,
  ExternalLink,
  Play,
  Share2,
  Check,
  Flame,
  Layers,
  Award,
} from 'lucide-react';
import { AniListMedia } from '@/lib/anilist';
import { sanitizeHtml } from '@/lib/sanitize';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface AnimeDetailModalProps {
  media: AniListMedia | null;
  isOpen: boolean;
  onClose: () => void;
  onFindSimilar?: (media: AniListMedia) => void;
}

export const AnimeDetailModal: React.FC<AnimeDetailModalProps> = ({
  media,
  isOpen,
  onClose,
  onFindSimilar,
}) => {
  const [showTrailer, setShowTrailer] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!media) return null;

  const handleShare = () => {
    const url = `https://anilist.co/anime/${media.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: 'Link Copied!',
      description: 'AniList link copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const mainStudio = media.studios?.nodes?.find((s) => s.isAnimationStudio)?.name || media.studios?.nodes?.[0]?.name;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-card/95 backdrop-blur-2xl border-border/40 text-foreground rounded-2xl">
        <DialogTitle className="sr-only">{media.title.romaji}</DialogTitle>
        <DialogDescription className="sr-only">
          Detailed information about {media.title.romaji}
        </DialogDescription>

        {/* Banner Image or Gradient Header */}
        <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-muted/40">
          {media.bannerImage ? (
            <img
              src={media.bannerImage}
              alt={media.title.romaji}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/30 via-accent/20 to-card flex items-center justify-center">
              <Film className="w-16 h-16 text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-background/80 hover:bg-background backdrop-blur-md text-foreground transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Trailer Button on Banner */}
          {media.trailer && media.trailer.site === 'youtube' && (
            <Button
              onClick={() => setShowTrailer(!showTrailer)}
              size="sm"
              className="absolute bottom-4 right-4 z-10 gap-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg"
            >
              <Play className="w-4 h-4 fill-white" />
              {showTrailer ? 'Hide Trailer' : 'Watch Trailer'}
            </Button>
          )}
        </div>

        {/* Trailer Embed */}
        <AnimatePresence>
          {showTrailer && media.trailer && media.trailer.site === 'youtube' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 py-3 bg-black/80 border-b border-border/30"
            >
              <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${media.trailer.id}?autoplay=1`}
                  title="Anime Trailer"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 -mt-20 sm:-mt-24 relative z-10">
            {/* Poster Card */}
            <div className="w-36 sm:w-48 shrink-0 mx-auto sm:mx-0">
              <img
                src={media.coverImage.extraLarge || media.coverImage.large}
                alt={media.title.romaji}
                className="w-full aspect-[2/3] object-cover rounded-xl shadow-2xl border-2 border-primary/30 glow-subtle"
              />
              {media.averageScore && (
                <div className="mt-3 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-primary/20 border border-primary/30 font-semibold text-primary text-sm">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span>{media.averageScore}% Score</span>
                </div>
              )}
            </div>

            {/* Main Info */}
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {media.title.romaji}
                </h2>
                {media.title.english && media.title.english !== media.title.romaji && (
                  <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
                    {media.title.english}
                  </p>
                )}
                {media.title.native && (
                  <p className="text-xs text-muted-foreground/70 font-mono mt-0.5">
                    {media.title.native}
                  </p>
                )}
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                {media.format && (
                  <Badge variant="secondary" className="font-semibold">
                    {media.format.replace('_', ' ')}
                  </Badge>
                )}
                {media.status && (
                  <Badge
                    variant="outline"
                    className={
                      media.status === 'RELEASING'
                        ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
                        : 'border-border'
                    }
                  >
                    {media.status === 'RELEASING' ? '🟢 Airing' : media.status.replace(/_/g, ' ')}
                  </Badge>
                )}
                {mainStudio && (
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    {mainStudio}
                  </Badge>
                )}
                {media.seasonYear && (
                  <Badge variant="outline" className="text-muted-foreground">
                    {media.season} {media.seasonYear}
                  </Badge>
                )}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start pt-1">
                {media.genres?.map((genre) => (
                  <span
                    key={genre}
                    className="text-xs px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-glow font-medium"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-3 justify-center sm:justify-start">
                {onFindSimilar && (
                  <Button
                    onClick={() => {
                      onFindSimilar(media);
                      onClose();
                    }}
                    size="sm"
                    className="gap-2 glow-subtle"
                  >
                    <Sparkles className="w-4 h-4" />
                    Find Similar Anime
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.open(`https://anilist.co/anime/${media.id}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                  AniList
                </Button>
                {media.idMal && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => window.open(`https://myanimelist.net/anime/${media.idMal}`, '_blank')}
                  >
                    MAL
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Share'}
                </Button>
              </div>
            </div>
          </div>

          {/* Key Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-card/60 border border-border/30 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Episodes</div>
              <div className="text-base font-semibold text-foreground">
                {media.episodes ? `${media.episodes} eps` : 'Ongoing'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Episode Duration</div>
              <div className="text-base font-semibold text-foreground">
                {media.duration ? `${media.duration} mins` : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Popularity Rank</div>
              <div className="text-base font-semibold text-primary flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                {media.popularity ? `#${media.popularity.toLocaleString()}` : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Source</div>
              <div className="text-base font-semibold text-foreground">
                {media.source ? media.source.replace(/_/g, ' ') : 'Original'}
              </div>
            </div>
          </div>

          {/* Synopsis */}
          {media.description && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Synopsis
              </h4>
              <div
                className="text-sm leading-relaxed text-muted-foreground/90 max-h-48 overflow-y-auto pr-2"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(media.description),
                }}
              />
            </div>
          )}

          {/* Characters & Voice Cast */}
          {media.characters?.edges && media.characters.edges.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Main Characters & Cast
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {media.characters.edges.slice(0, 6).map((edge, idx) => {
                  const char = edge.node;
                  const va = edge.voiceActors?.[0];
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-card/40 border border-border/20"
                    >
                      {char.image?.medium && (
                        <img
                          src={char.image.medium}
                          alt={char.name.full}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-primary/20"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate text-foreground">
                          {char.name.full}
                        </p>
                        {va && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            🎙️ {va.name.full}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* External Links */}
          {media.externalLinks && media.externalLinks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Streaming & Official Links
              </h4>
              <div className="flex flex-wrap gap-2">
                {media.externalLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/40 hover:bg-primary/20 hover:text-primary transition-all border border-border/30"
                  >
                    {link.site}
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
