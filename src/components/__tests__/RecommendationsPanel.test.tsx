import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecommendationsPanel } from '../RecommendationsPanel';
import { AniListMedia } from '@/lib/anilist';

vi.mock('@/lib/anilist', () => ({
  ANIME_GENRES: [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror',
    'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
    'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
  ],
  searchAnime: vi.fn().mockResolvedValue({
    media: [
      {
        id: 2,
        title: { romaji: 'Jujutsu Kaisen', english: 'Jujutsu Kaisen' },
        coverImage: { large: 'https://example.com/jjk.jpg' },
        genres: ['Action', 'Fantasy'],
        tags: [{ id: 1, name: 'Superpowers', rank: 90 }],
        averageScore: 86,
        popularity: 150000,
        format: 'TV',
      },
    ],
    pageInfo: { total: 1, hasNextPage: false },
  }),
}));

describe('RecommendationsPanel Component', () => {
  const mockTarget: AniListMedia = {
    id: 1,
    title: { romaji: 'Demon Slayer' },
    coverImage: { large: 'https://example.com/ds.jpg' },
    genres: ['Action', 'Fantasy'],
    tags: [{ id: 1, name: 'Superpowers', rank: 95 }],
    averageScore: 88,
    popularity: 200000,
    format: 'TV',
  };

  it('renders vector recommendations and filter tabs', async () => {
    render(
      <RecommendationsPanel
        currentResult={{ anilist: mockTarget }}
        onSelectAnime={vi.fn()}
      />
    );

    expect(await screen.findByText('AI Vector Recommendations')).toBeInTheDocument();
    expect(screen.getByText('All Matches')).toBeInTheDocument();
    expect(screen.getByText(/75%\+\s*Similarity/i)).toBeInTheDocument();
  });

  it('allows switching similarity filter tabs and opens detail modal on card click', async () => {
    const handleSelect = vi.fn();
    render(
      <RecommendationsPanel
        currentResult={{ anilist: mockTarget }}
        onSelectAnime={handleSelect}
      />
    );

    const highSimTab = await screen.findByText(/75%\+\s*Similarity/i);
    fireEvent.click(highSimTab);

    const jjkCard = await screen.findByText('Jujutsu Kaisen');
    fireEvent.click(jjkCard);

    expect(await screen.findByText('Find Similar Anime')).toBeInTheDocument();
  });
});
