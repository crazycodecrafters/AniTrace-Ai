import localforage from 'localforage';
import { AniListMedia } from './anilist';

// Configure localforage
localforage.config({
  name: 'AnimeLens',
  storeName: 'anime_lens_store',
  description: 'Local storage for Anime Lens Ultimate',
});

export interface TraceCandidate {
  anilist: number;
  filename: string;
  episode: number | string | null;
  from: number;
  to: number;
  similarity: number;
  video: string;
  image: string;
}

export interface HistoryItem {
  id: string;
  anilistId: number;
  title: string;
  englishTitle?: string | null;
  nativeTitle?: string | null;
  coverUrl: string;
  bannerUrl?: string | null;
  timestamp: string;
  episode?: number | string | null;
  timeRange?: string;
  similarity?: number;
  videoUrl?: string;
  tags: string[];
  synopsis: string;
  genres: string[];
  score?: number | null;
  format?: string;
  seasonYear?: number;
  allCandidates?: TraceCandidate[];
  fullMedia?: AniListMedia;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  requirement: string;
  xpReward: number;
}

export interface UserProfile {
  xp: number;
  level: number;
  currentStreak: number;
  totalScans: number;
  lastScanTimestamp: string;
  unlockedBadges: string[];
  favoriteGenres: Record<string, number>;
}

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'first_scan',
    title: 'First Contact',
    description: 'Scanned your very first anime screenshot.',
    icon: '🔍',
    unlockedAt: null,
    requirement: 'Scan 1 anime scene',
    xpReward: 50,
  },
  {
    id: 'sleuth_5',
    title: 'Scene Sleuth',
    description: 'Scanned 5 anime scenes successfully.',
    icon: '🕵️',
    unlockedAt: null,
    requirement: 'Scan 5 scenes',
    xpReward: 100,
  },
  {
    id: 'detective_25',
    title: 'Master Detective',
    description: 'Scanned 25 anime scenes.',
    icon: '🏆',
    unlockedAt: null,
    requirement: 'Scan 25 scenes',
    xpReward: 250,
  },
  {
    id: 'genre_explorer',
    title: 'Genre Explorer',
    description: 'Scanned anime from 5 distinct genres.',
    icon: '🧭',
    unlockedAt: null,
    requirement: 'Discover 5 genres',
    xpReward: 150,
  },
  {
    id: 'perfect_match',
    title: 'Flawless Match',
    description: 'Found a scene match with >= 95% similarity confidence.',
    icon: '🎯',
    unlockedAt: null,
    requirement: '>= 95% scan match',
    xpReward: 120,
  },
  {
    id: 'streak_3',
    title: 'Dedicated Otaku',
    description: 'Maintained a 3-day scanning streak.',
    icon: '🔥',
    unlockedAt: null,
    requirement: '3-day streak',
    xpReward: 200,
  },
  {
    id: 'night_owl',
    title: 'Midnight Binger',
    description: 'Scanned a scene between midnight and 5 AM.',
    icon: '🦉',
    unlockedAt: null,
    requirement: 'Scan at late night',
    xpReward: 80,
  },
  {
    id: 'level_5',
    title: 'Elite Scout',
    description: 'Reached Level 5 in Anime Lens.',
    icon: '⚡',
    unlockedAt: null,
    requirement: 'Reach Level 5',
    xpReward: 300,
  },
];

// History management
export const saveToHistory = async (item: HistoryItem): Promise<HistoryItem[]> => {
  try {
    const history = (await localforage.getItem<HistoryItem[]>('history')) || [];
    
    // Avoid duplicate immediately adjacent scans of same anime if within 1 minute
    const filtered = history.filter((h) => !(h.anilistId === item.anilistId && Math.abs(new Date(h.timestamp).getTime() - new Date(item.timestamp).getTime()) < 60000));
    
    filtered.unshift(item);
    
    // Keep last 250 items
    const trimmedHistory = filtered.slice(0, 250);
    await localforage.setItem('history', trimmedHistory);
    return trimmedHistory;
  } catch (error) {
    console.error('Failed to save to history:', error);
    return [];
  }
};

export const getHistory = async (): Promise<HistoryItem[]> => {
  try {
    return (await localforage.getItem<HistoryItem[]>('history')) || [];
  } catch (error) {
    console.error('Failed to get history:', error);
    return [];
  }
};

export const deleteHistoryItem = async (id: string): Promise<HistoryItem[]> => {
  try {
    const history = (await localforage.getItem<HistoryItem[]>('history')) || [];
    const updated = history.filter((item) => item.id !== id);
    await localforage.setItem('history', updated);
    return updated;
  } catch (error) {
    console.error('Failed to delete history item:', error);
    return [];
  }
};

export const clearAllHistory = async (): Promise<void> => {
  try {
    await localforage.setItem('history', []);
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
};

export const searchHistory = async (query: string, genre?: string): Promise<HistoryItem[]> => {
  const history = await getHistory();
  let results = history;

  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    results = results.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.englishTitle && item.englishTitle.toLowerCase().includes(q)) ||
        (item.synopsis && item.synopsis.toLowerCase().includes(q)) ||
        item.genres.some((g) => g.toLowerCase().includes(q)) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (genre && genre !== 'All') {
    results = results.filter((item) => item.genres.includes(genre));
  }

  return results;
};

// Profile & Gamification Management
export const getProfile = async (): Promise<UserProfile> => {
  try {
    const profile = await localforage.getItem<UserProfile>('profile');
    if (profile) return profile;

    const defaultProfile: UserProfile = {
      xp: 0,
      level: 1,
      currentStreak: 1,
      totalScans: 0,
      lastScanTimestamp: '',
      unlockedBadges: [],
      favoriteGenres: {},
    };
    await localforage.setItem('profile', defaultProfile);
    return defaultProfile;
  } catch (error) {
    console.error('Failed to get profile:', error);
    return {
      xp: 0,
      level: 1,
      currentStreak: 1,
      totalScans: 0,
      lastScanTimestamp: '',
      unlockedBadges: [],
      favoriteGenres: {},
    };
  }
};

export const updateProfile = async (updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    const profile = await getProfile();
    const updatedProfile = { ...profile, ...updates };

    // Calculate level from XP (100 XP per level)
    updatedProfile.level = Math.floor(updatedProfile.xp / 100) + 1;

    await localforage.setItem('profile', updatedProfile);
    return updatedProfile;
  } catch (error) {
    console.error('Failed to update profile:', error);
    return null;
  }
};

export const getBadges = async (): Promise<Badge[]> => {
  try {
    const stored = await localforage.getItem<Badge[]>('badges');
    if (stored && stored.length === INITIAL_BADGES.length) {
      return stored;
    }
    await localforage.setItem('badges', INITIAL_BADGES);
    return INITIAL_BADGES;
  } catch {
    return INITIAL_BADGES;
  }
};

/**
 * Handle scan event: updates XP, streaks, scan count, favorite genres, and checks badges
 */
export const recordScanEvent = async (params: {
  similarity?: number;
  genres?: string[];
}): Promise<{
  leveledUp: boolean;
  newLevel: number;
  newBadges: Badge[];
  gainedXp: number;
}> => {
  const profile = await getProfile();
  const badges = await getBadges();
  const now = new Date();
  const currentHour = now.getHours();

  let gainedXp = 15; // Base XP for scan
  const oldLevel = profile.level;
  const newTotalScans = profile.totalScans + 1;

  // Streak calculation
  let newStreak = profile.currentStreak;
  if (profile.lastScanTimestamp) {
    const lastDate = new Date(profile.lastScanTimestamp);
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  // Favorite genres update
  const updatedGenres = { ...(profile.favoriteGenres || {}) };
  if (params.genres) {
    params.genres.forEach((g) => {
      updatedGenres[g] = (updatedGenres[g] || 0) + 1;
    });
  }

  // Badge checks
  const newlyUnlockedBadges: Badge[] = [];
  const currentUnlockedIds = new Set(profile.unlockedBadges || []);

  badges.forEach((b) => {
    if (currentUnlockedIds.has(b.id)) return;

    let unlock = false;
    if (b.id === 'first_scan' && newTotalScans >= 1) unlock = true;
    if (b.id === 'sleuth_5' && newTotalScans >= 5) unlock = true;
    if (b.id === 'detective_25' && newTotalScans >= 25) unlock = true;
    if (b.id === 'genre_explorer' && Object.keys(updatedGenres).length >= 5) unlock = true;
    if (b.id === 'perfect_match' && (params.similarity || 0) >= 0.95) unlock = true;
    if (b.id === 'streak_3' && newStreak >= 3) unlock = true;
    if (b.id === 'night_owl' && currentHour >= 0 && currentHour < 5) unlock = true;

    if (unlock) {
      b.unlockedAt = now.toISOString();
      currentUnlockedIds.add(b.id);
      newlyUnlockedBadges.push(b);
      gainedXp += b.xpReward;
    }
  });

  // Calculate new total XP
  const newXp = profile.xp + gainedXp;
  const calculatedLevel = Math.floor(newXp / 100) + 1;

  // Check level 5 badge
  const level5Badge = badges.find((b) => b.id === 'level_5');
  if (level5Badge && !currentUnlockedIds.has('level_5') && calculatedLevel >= 5) {
    level5Badge.unlockedAt = now.toISOString();
    currentUnlockedIds.add('level_5');
    newlyUnlockedBadges.push(level5Badge);
  }

  await localforage.setItem('badges', badges);

  await updateProfile({
    xp: newXp,
    level: calculatedLevel,
    totalScans: newTotalScans,
    currentStreak: newStreak,
    lastScanTimestamp: now.toISOString(),
    unlockedBadges: Array.from(currentUnlockedIds),
    favoriteGenres: updatedGenres,
  });

  return {
    leveledUp: calculatedLevel > oldLevel,
    newLevel: calculatedLevel,
    newBadges: newlyUnlockedBadges,
    gainedXp,
  };
};

export const addXP = async (amount: number): Promise<{ leveledUp: boolean; newLevel: number }> => {
  const profile = await getProfile();
  const oldLevel = profile.level;

  await updateProfile({ xp: profile.xp + amount });

  const newProfile = await getProfile();
  const leveledUp = newProfile.level > oldLevel;

  return { leveledUp, newLevel: newProfile.level };
};

// Export & Import
export const exportHistoryJSON = async (): Promise<string> => {
  const history = await getHistory();
  const profile = await getProfile();
  const data = {
    exportDate: new Date().toISOString(),
    version: '2.0',
    profile,
    history,
  };
  return JSON.stringify(data, null, 2);
};

export const importHistoryJSON = async (jsonString: string): Promise<number> => {
  try {
    const data = JSON.parse(jsonString);
    if (!data.history || !Array.isArray(data.history)) {
      throw new Error('Invalid backup file format');
    }
    const currentHistory = await getHistory();
    const existingIds = new Set(currentHistory.map((h) => h.id));
    
    let addedCount = 0;
    for (const item of data.history) {
      if (!existingIds.has(item.id)) {
        currentHistory.push(item);
        existingIds.add(item.id);
        addedCount++;
      }
    }

    await localforage.setItem('history', currentHistory);
    return addedCount;
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
};
