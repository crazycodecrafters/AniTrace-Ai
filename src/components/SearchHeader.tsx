import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Scan,
  Search,
  TrendingUp,
  History,
  Award,
  Flame,
  Zap,
  Command,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProfile, UserProfile } from '@/lib/storage';

interface SearchHeaderProps {
  activeTab: 'scan' | 'text' | 'discover' | 'history';
  onTabChange: (tab: 'scan' | 'text' | 'discover' | 'history') => void;
  onOpenCommandPalette: () => void;
  onOpenBadges: () => void;
  onOpenHistory: () => void;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenCommandPalette,
  onOpenBadges,
  onOpenHistory,
}) => {
  const [profile, setProfile] = useState<UserProfile>({
    xp: 0,
    level: 1,
    currentStreak: 1,
    totalScans: 0,
    lastScanTimestamp: '',
    unlockedBadges: [],
    favoriteGenres: {},
  });

  const loadProfile = async () => {
    const p = await getProfile();
    setProfile(p);
  };

  useEffect(() => {
    loadProfile();
    const interval = setInterval(loadProfile, 3000);
    return () => clearInterval(interval);
  }, []);

  const xpInCurrentLevel = profile.xp % 100;
  const xpProgress = (xpInCurrentLevel / 100) * 100;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div
          onClick={() => onTabChange('scan')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 group-hover:border-primary group-hover:glow-subtle transition-all">
            <Scan className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Anime Lens
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold uppercase bg-primary/10 text-primary border border-primary/20">
              v2.0
            </span>
          </div>
        </div>

        {/* Center Mode Switcher Tabs (Desktop) */}
        <nav className="hidden md:flex items-center p-1 rounded-xl glass-card border border-border/40">
          <button
            onClick={() => onTabChange('scan')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'scan'
                ? 'bg-primary text-primary-foreground shadow-sm glow-subtle'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            Scene Scanner
          </button>
          <button
            onClick={() => onTabChange('text')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'text'
                ? 'bg-primary text-primary-foreground shadow-sm glow-subtle'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Title & Filters
          </button>
          <button
            onClick={() => onTabChange('discover')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'discover'
                ? 'bg-primary text-primary-foreground shadow-sm glow-subtle'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Discover
          </button>
          <button
            onClick={() => onOpenHistory()}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-primary text-primary-foreground shadow-sm glow-subtle'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            History
          </button>
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search Ctrl+K Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-2 h-9 px-3 text-xs text-muted-foreground bg-background/50 border-border/40 hover:border-primary/40 hover:text-foreground rounded-xl"
          >
            <Search className="w-3.5 h-3.5 text-primary" />
            <span>Search anime...</span>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-muted text-muted-foreground rounded border border-border/30">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </Button>

          {/* Gamification Level & Streak Bar */}
          <div
            onClick={onOpenBadges}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl glass-card border border-border/40 hover:border-primary/40 cursor-pointer transition-all"
            title="Click to view Scout Badges and XP stats"
          >
            {/* Streak */}
            <div className="flex items-center gap-1 text-orange-400 font-bold text-xs">
              <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
              <span>{profile.currentStreak}</span>
            </div>

            <div className="h-4 w-[1px] bg-border/40 hidden sm:block" />

            {/* Level & XP */}
            <div className="hidden sm:flex flex-col min-w-[70px]">
              <div className="flex items-center justify-between text-[10px] leading-tight">
                <span className="font-bold text-foreground">Lv. {profile.level}</span>
                <span className="text-muted-foreground font-mono">{xpInCurrentLevel}%</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-glow"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>

            {/* Badges Icon */}
            <Award className="w-4 h-4 text-amber-400 sm:ml-1" />
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden items-center justify-around border-t border-border/20 px-2 py-1.5 bg-card/60">
        <button
          onClick={() => onTabChange('scan')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-all ${
            activeTab === 'scan' ? 'text-primary font-bold' : 'text-muted-foreground'
          }`}
        >
          <Scan className="w-4 h-4 mb-0.5" />
          Scanner
        </button>
        <button
          onClick={() => onTabChange('text')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-all ${
            activeTab === 'text' ? 'text-primary font-bold' : 'text-muted-foreground'
          }`}
        >
          <Search className="w-4 h-4 mb-0.5" />
          Titles
        </button>
        <button
          onClick={() => onTabChange('discover')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-all ${
            activeTab === 'discover' ? 'text-primary font-bold' : 'text-muted-foreground'
          }`}
        >
          <TrendingUp className="w-4 h-4 mb-0.5" />
          Discover
        </button>
        <button
          onClick={() => onOpenHistory()}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-all ${
            activeTab === 'history' ? 'text-primary font-bold' : 'text-muted-foreground'
          }`}
        >
          <History className="w-4 h-4 mb-0.5" />
          History
        </button>
        <button
          onClick={onOpenCommandPalette}
          className="flex flex-col items-center py-1 px-3 rounded-lg text-[10px] text-muted-foreground font-medium"
        >
          <Command className="w-4 h-4 mb-0.5 text-primary" />
          Search
        </button>
      </div>
    </header>
  );
};
