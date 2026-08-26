import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAnimeById, searchAnime, ANIME_GENRES } from '../anilist';

describe('AniList GraphQL API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes a list of standard anime genres without adult/hentai content', () => {
    expect(ANIME_GENRES).toContain('Action');
    expect(ANIME_GENRES).toContain('Fantasy');
    expect(ANIME_GENRES).not.toContain('Hentai');
  });

  it('returns null when querying with invalid anime ID', async () => {
    const result = await getAnimeById(0);
    expect(result).toBeNull();

    const negativeResult = await getAnimeById(-5);
    expect(negativeResult).toBeNull();
  });

  it('queries AniList GraphQL and returns media details', async () => {
    const mockMedia = {
      id: 154587,
      title: { romaji: 'Sousou no Frieren', english: 'Frieren: Beyond Journey\'s End' },
      coverImage: { large: 'https://example.com/frieren.jpg' },
      genres: ['Adventure', 'Drama', 'Fantasy'],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          Media: mockMedia,
        },
      }),
    } as Response);

    const data = await getAnimeById(154587);
    expect(data).toBeDefined();
    expect(data?.id).toBe(154587);
    expect(data?.title.romaji).toBe('Sousou no Frieren');
  });

  it('handles search anime queries with pagination info', async () => {
    const mockSearchResponse = {
      Page: {
        pageInfo: {
          total: 100,
          perPage: 10,
          currentPage: 1,
          lastPage: 10,
          hasNextPage: true,
        },
        media: [
          {
            id: 154587,
            title: { romaji: 'Sousou no Frieren' },
            coverImage: { large: 'https://example.com/frieren.jpg' },
            genres: ['Fantasy'],
          },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: mockSearchResponse,
      }),
    } as Response);

    const result = await searchAnime({ query: 'Frieren', perPage: 10 });
    expect(result.media).toHaveLength(1);
    expect(result.pageInfo.hasNextPage).toBe(true);
  });
});
