import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Flame,
  Zap,
  CheckCircle2,
  Lock,
  X,
  Sparkles,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge as UiBadge } from '@/components/ui/badge';
import { getBadges, getProfile, Badge, UserProfile } from '@/lib/storage';

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BadgesModal: React.FC<BadgesModalProps> = ({ isOpen, onClose }) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isOpen) {
      Promise.all([getBadges(), getProfile()]).then(([b, p]) => {
        setBadges(b);
        setProfile(p);
      });
    }
  }, [isOpen]);

  if (!profile) return null;

  const unlockedCount = badges.filter((b) => b.unlockedAt).length;
  const xpForNextLevel = profile.level * 100;
  const xpInCurrentLevel = profile.xp % 100;
  const xpProgress = (xpInCurrentLevel / 100) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 bg-card/95 backdrop-blur-2xl border-border/40 text-foreground rounded-2xl">
        <DialogTitle className="sr-only">Achievements & Badges</DialogTitle>
        <DialogDescription className="sr-only">
          View your AniTrace AI stats, level progression, and unlocked badges.
        </DialogDescription>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 glow-subtle">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Scout Achievements & Badges</h2>
              <p className="text-xs text-muted-foreground">
                Earn XP by scanning scenes and discovering new genres.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Level</span>
            </div>
            <div className="text-2xl font-black text-foreground">{profile.level}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{profile.xp} Total XP</div>
          </div>

          <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
            <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Streak</span>
            </div>
            <div className="text-2xl font-black text-foreground">{profile.currentStreak} Days</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Active streak</div>
          </div>

          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
            <div className="flex items-center justify-center gap-1 text-cyan-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Total Scans</span>
            </div>
            <div className="text-2xl font-black text-foreground">{profile.totalScans}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Scenes identified</div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
            <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
              <Award className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Badges</span>
            </div>
            <div className="text-2xl font-black text-foreground">
              {unlockedCount}/{badges.length}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Unlocked</div>
          </div>
        </div>

        {/* Level Progression Bar */}
        <div className="p-4 rounded-xl glass-card border border-border/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Level {profile.level} Progress</span>
            <span className="text-muted-foreground font-mono">
              {xpInCurrentLevel} / 100 XP to Level {profile.level + 1}
            </span>
          </div>
          <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary-glow rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Badges List */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            All Badges ({unlockedCount}/{badges.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badges.map((badge) => {
              const isUnlocked = Boolean(badge.unlockedAt);
              return (
                <div
                  key={badge.id}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                    isUnlocked
                      ? 'bg-amber-500/10 border-amber-500/30 shadow-sm'
                      : 'bg-card/30 border-border/20 opacity-60'
                  }`}
                >
                  <div
                    className={`text-2xl p-2 rounded-xl shrink-0 ${
                      isUnlocked
                        ? 'bg-amber-500/20 ring-1 ring-amber-500/40'
                        : 'bg-muted/40 grayscale'
                    }`}
                  >
                    {badge.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold truncate text-foreground">
                        {badge.title}
                      </h4>
                      <UiBadge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${
                          isUnlocked
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'text-muted-foreground border-border/40'
                        }`}
                      >
                        +{badge.xpReward} XP
                      </UiBadge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {badge.description}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] font-mono">
                      {isUnlocked ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Unlocked {new Date(badge.unlockedAt!).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          {badge.requirement}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Favorite Genres breakdown */}
        {profile.favoriteGenres && Object.keys(profile.favoriteGenres).length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/20">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Scanned Genre Distribution
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(profile.favoriteGenres)
                .sort(([, a], [, b]) => b - a)
                .map(([genre, count]) => (
                  <span
                    key={genre}
                    className="text-xs px-2.5 py-1 rounded-lg bg-card/60 border border-border/30 text-muted-foreground flex items-center gap-1.5"
                  >
                    <span className="text-foreground font-medium">{genre}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/20 text-primary font-mono font-bold">
                      {count}
                    </span>
                  </span>
                ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
