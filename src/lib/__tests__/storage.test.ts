import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveToHistory,
  getHistory,
  deleteHistoryItem,
  clearAllHistory,
  searchHistory,
  getProfile,
  updateProfile,
  recordScanEvent,
  exportHistoryJSON,
  importHistoryJSON,
  HistoryItem,
} from '../storage';

describe('Storage & Gamification Library', () => {
  beforeEach(async () => {
    await clearAllHistory();
  });

  const mockItem: HistoryItem = {
    id: 'test-item-1',
    anilistId: 101922,
    title: 'Kimetsu no Yaiba',
    englishTitle: 'Demon Slayer',
    coverUrl: 'https://example.com/cover.jpg',
    timestamp: new Date().toISOString(),
    tags: ['Superpowers', 'Historical'],
    synopsis: 'Tanjiro sets out on a journey.',
    genres: ['Action', 'Fantasy'],
    similarity: 0.96,
  };

  describe('History Management', () => {
    it('saves items to history and retrieves them', async () => {
      await saveToHistory(mockItem);
      const history = await getHistory();

      expect(history).toHaveLength(1);
      expect(history[0].title).toBe('Kimetsu no Yaiba');
    });

    it('deletes a specific history item by ID', async () => {
      await saveToHistory(mockItem);
      const remaining = await deleteHistoryItem(mockItem.id);

      expect(remaining).toHaveLength(0);
    });

    it('filters history by search query and genre', async () => {
      await saveToHistory(mockItem);

      const found = await searchHistory('Demon', 'Action');
      expect(found).toHaveLength(1);

      const notFound = await searchHistory('NonExistentTitle', 'All');
      expect(notFound).toHaveLength(0);
    });
  });

  describe('Profile & Gamification', () => {
    it('initializes default user profile correctly', async () => {
      const profile = await getProfile();
      expect(profile.level).toBeGreaterThanOrEqual(1);
      expect(profile.xp).toBeGreaterThanOrEqual(0);
    });

    it('records scan events, awards XP, and unlocks badges for high confidence matches', async () => {
      const result = await recordScanEvent({
        similarity: 0.98,
        genres: ['Action', 'Fantasy'],
      });

      expect(result.gainedXp).toBeGreaterThan(0);
      expect(result.newBadges.length).toBeGreaterThan(0);

      const profile = await getProfile();
      expect(profile.totalScans).toBeGreaterThanOrEqual(1);
      expect(profile.unlockedBadges).toContain('first_scan');
    });
  });

  describe('Export and Import Backup', () => {
    it('exports history and profile data as valid JSON', async () => {
      await saveToHistory(mockItem);
      const json = await exportHistoryJSON();

      const parsed = JSON.parse(json);
      expect(parsed.version).toBe('2.0');
      expect(parsed.history).toHaveLength(1);
      expect(parsed.history[0].id).toBe(mockItem.id);
    });

    it('imports backup JSON with schema validation and avoids duplicates', async () => {
      const backupData = {
        version: '2.0',
        profile: { xp: 200, totalScans: 5, currentStreak: 3 },
        history: [
          mockItem,
          {
            id: 'test-item-2',
            anilistId: 154587,
            title: 'Sousou no Frieren',
            coverUrl: 'https://example.com/frieren.jpg',
            timestamp: new Date().toISOString(),
            tags: ['Magic'],
            synopsis: 'Frieren journey.',
            genres: ['Adventure', 'Drama', 'Fantasy'],
          },
        ],
      };

      const addedCount = await importHistoryJSON(JSON.stringify(backupData));
      expect(addedCount).toBe(2);

      const history = await getHistory();
      expect(history).toHaveLength(2);

      // Re-importing same items should add 0 duplicates
      const secondImport = await importHistoryJSON(JSON.stringify(backupData));
      expect(secondImport).toBe(0);
    });

    it('throws on malformed or empty import payloads', async () => {
      await expect(importHistoryJSON('')).rejects.toThrow();
      await expect(importHistoryJSON('{"invalid": true}')).rejects.toThrow();
    });
  });
});
