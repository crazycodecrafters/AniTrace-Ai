import { describe, it, expect } from 'vitest';
import {
  createMediaEmbedding,
  cosineSimilarity,
  normalizeVector,
  rankSimilarAnime,
  cacheMediaEmbedding,
  getCachedMediaEmbedding,
} from '../embeddings';
import { AniListMedia } from '../anilist';

describe('Embeddings & Vector Similarity Engine', () => {
  const animeA: AniListMedia = {
    id: 1,
    title: { romaji: 'Attack on Titan', english: 'Attack on Titan' },
    coverImage: { large: 'https://example.com/aot.jpg' },
    genres: ['Action', 'Fantasy', 'Drama'],
    tags: [
      { id: 1, name: 'Military', rank: 90 },
      { id: 2, name: 'Superpowers', rank: 85 },
      { id: 3, name: 'Survival', rank: 95 },
    ],
    format: 'TV',
    averageScore: 90,
    popularity: 200000,
  };

  const animeB: AniListMedia = {
    id: 2,
    title: { romaji: 'Kabaneri of the Iron Fortress', english: 'Kabaneri' },
    coverImage: { large: 'https://example.com/kabaneri.jpg' },
    genres: ['Action', 'Fantasy', 'Horror'],
    tags: [
      { id: 1, name: 'Military', rank: 85 },
      { id: 3, name: 'Survival', rank: 90 },
      { id: 4, name: 'Post-Apocalyptic', rank: 80 },
    ],
    format: 'TV',
    averageScore: 78,
    popularity: 80000,
  };

  const animeC: AniListMedia = {
    id: 3,
    title: { romaji: 'K-On!', english: 'K-On!' },
    coverImage: { large: 'https://example.com/kon.jpg' },
    genres: ['Comedy', 'Slice of Life', 'Music'],
    tags: [
      { id: 5, name: 'School', rank: 90 },
      { id: 6, name: 'Music', rank: 95 },
    ],
    format: 'TV',
    averageScore: 82,
    popularity: 90000,
  };

  describe('createMediaEmbedding', () => {
    it('creates a normalized Float32Array vector of 75 dimensions', () => {
      const vec = createMediaEmbedding(animeA);
      expect(vec).toBeInstanceOf(Float32Array);
      expect(vec.length).toBe(75); // 18 genres + 49 tags + 6 formats + 2 meta

      // Length should be approximately 1.0 (unit vector)
      let sumSq = 0;
      for (let i = 0; i < vec.length; i++) {
        sumSq += vec[i] * vec[i];
      }
      expect(Math.sqrt(sumSq)).toBeCloseTo(1.0, 4);
    });
  });

  describe('cosineSimilarity', () => {
    it('calculates 1.0 for identical normalized vectors', () => {
      const vecA = createMediaEmbedding(animeA);
      const similarity = cosineSimilarity(vecA, vecA);
      expect(similarity).toBeCloseTo(1.0, 4);
    });

    it('produces higher similarity for thematic overlap than unrelated shows', () => {
      const vecA = createMediaEmbedding(animeA);
      const vecB = createMediaEmbedding(animeB);
      const vecC = createMediaEmbedding(animeC);

      const simAB = cosineSimilarity(vecA, vecB);
      const simAC = cosineSimilarity(vecA, vecC);

      expect(simAB).toBeGreaterThan(simAC);
      expect(simAB).toBeGreaterThan(0.5);
      expect(simAC).toBeLessThan(0.3);
    });

    it('returns 0 for empty or mismatched vectors', () => {
      expect(cosineSimilarity(new Float32Array(0), new Float32Array(5))).toBe(0);
    });
  });

  describe('normalizeVector', () => {
    it('normalizes arbitrary vectors to unit magnitude', () => {
      const raw = new Float32Array([3, 4]); // length 5
      const norm = normalizeVector(raw);
      expect(norm[0]).toBeCloseTo(0.6, 4);
      expect(norm[1]).toBeCloseTo(0.8, 4);
    });
  });

  describe('rankSimilarAnime', () => {
    it('ranks and sorts similar candidates by similarity score descending', () => {
      const candidates = [animeC, animeB];
      const ranked = rankSimilarAnime(animeA, candidates, 5);

      expect(ranked).toHaveLength(2);
      expect(ranked[0].media.id).toBe(animeB.id); // Kabaneri is much closer to AoT than K-On!
      expect(ranked[0].similarityScore).toBeGreaterThan(ranked[1].similarityScore);
      expect(ranked[0].matchReasons.length).toBeGreaterThan(0);
    });
  });

  describe('cacheMediaEmbedding and getCachedMediaEmbedding', () => {
    it('caches and retrieves vector embeddings from local storage', async () => {
      const vec = createMediaEmbedding(animeA);
      await cacheMediaEmbedding(1, vec);

      const cached = await getCachedMediaEmbedding(1);
      expect(cached).toBeDefined();
      expect(cached?.length).toBe(75);
    });

    it('returns null for non-cached embeddings', async () => {
      const nonExistent = await getCachedMediaEmbedding(999999);
      expect(nonExistent).toBeNull();
    });
  });
});
