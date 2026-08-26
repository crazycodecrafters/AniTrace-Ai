import { describe, it, expect, vi, beforeEach } from 'vitest';
import { traceMoeLoadBalancer, anilistLoadBalancer } from '@/lib/loadBalancer';
import { createMediaEmbedding, rankSimilarAnime } from '@/lib/embeddings';
import { saveToHistory, getHistory, recordScanEvent, getProfile, clearAllHistory } from '@/lib/storage';
import { AniListMedia } from '@/lib/anilist';

describe('E2E User Journey & Pipeline Integration', () => {
  beforeEach(async () => {
    await clearAllHistory();
    vi.restoreAllMocks();
  });

  const mockTargetAnime: AniListMedia = {
    id: 154587,
    title: { romaji: 'Sousou no Frieren', english: 'Frieren: Beyond Journey\'s End' },
    coverImage: { large: 'https://example.com/frieren.jpg' },
    genres: ['Adventure', 'Drama', 'Fantasy'],
    tags: [
      { id: 1, name: 'Magic', rank: 95 },
      { id: 2, name: 'Elves', rank: 90 },
      { id: 3, name: 'Journey', rank: 85 },
    ],
    averageScore: 92,
    popularity: 250000,
    format: 'TV',
  };

  const mockCandidateList: AniListMedia[] = [
    {
      id: 101922,
      title: { romaji: 'Kimetsu no Yaiba', english: 'Demon Slayer' },
      coverImage: { large: 'https://example.com/ds.jpg' },
      genres: ['Action', 'Fantasy'],
      tags: [{ id: 1, name: 'Magic', rank: 70 }],
      averageScore: 86,
      popularity: 200000,
      format: 'TV',
    },
    {
      id: 20605,
      title: { romaji: 'Tokyo Ghoul', english: 'Tokyo Ghoul' },
      coverImage: { large: 'https://example.com/tg.jpg' },
      genres: ['Action', 'Horror', 'Mystery'],
      tags: [{ id: 5, name: 'Urban Fantasy', rank: 80 }],
      averageScore: 75,
      popularity: 180000,
      format: 'TV',
    },
  ];

  it('executes full E2E pipeline: load balancing -> recognition -> vector recommendations -> history & gamification', async () => {
    // 1. Trace.moe Load Balancer query simulation
    const traceResult = await traceMoeLoadBalancer.execute(async (url) => {
      expect(url).toBeDefined();
      return {
        anilist: 154587,
        filename: 'Frieren - 01.mp4',
        episode: 1,
        from: 120,
        to: 125,
        similarity: 0.985,
        video: 'https://preview.trace.moe/frieren.mp4',
        image: 'https://preview.trace.moe/frieren.jpg',
      };
    });

    expect(traceResult.anilist).toBe(154587);
    expect(traceResult.similarity).toBeGreaterThan(0.95);

    // 2. AniList GraphQL query simulation through anilistLoadBalancer
    const mediaResult = await anilistLoadBalancer.execute(async (url) => {
      expect(url).toBeDefined();
      return mockTargetAnime;
    });

    expect(mediaResult.title.romaji).toBe('Sousou no Frieren');

    // 3. Client-side Neural Vector Recommendation Engine
    const recommendations = rankSimilarAnime(mediaResult, mockCandidateList, 5);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].similarityScore).toBeGreaterThan(0);

    // 4. Persistence in IndexedDB History
    const historyItem = {
      id: `e2e-scan-${Date.now()}`,
      anilistId: mediaResult.id,
      title: mediaResult.title.romaji,
      englishTitle: mediaResult.title.english,
      coverUrl: mediaResult.coverImage.large,
      timestamp: new Date().toISOString(),
      episode: traceResult.episode,
      similarity: traceResult.similarity,
      tags: ['Magic', 'Elves'],
      synopsis: 'Frieren journeys with Fern and Stark.',
      genres: mediaResult.genres,
    };

    await saveToHistory(historyItem);
    const savedHistory = await getHistory();
    expect(savedHistory).toHaveLength(1);
    expect(savedHistory[0].title).toBe('Sousou no Frieren');

    // 5. XP Award & Scout Badges Gamification Engine
    const xpEvent = await recordScanEvent({
      similarity: traceResult.similarity,
      genres: mediaResult.genres,
    });

    expect(xpEvent.gainedXp).toBeGreaterThan(0);
    const profile = await getProfile();
    expect(profile.totalScans).toBeGreaterThanOrEqual(1);
    expect(profile.unlockedBadges).toContain('first_scan');
    expect(profile.unlockedBadges).toContain('perfect_match');
  });
});
