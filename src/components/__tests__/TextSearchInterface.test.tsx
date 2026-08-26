import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TextSearchInterface } from '../TextSearchInterface';
import { searchAnime } from '@/lib/anilist';

vi.mock('@/lib/anilist', () => ({
  searchAnime: vi.fn().mockResolvedValue({
    media: [
      {
        id: 154587,
        title: { romaji: 'Sousou no Frieren', english: 'Frieren: Beyond Journey\'s End' },
        coverImage: { large: 'https://example.com/frieren.jpg' },
        genres: ['Adventure', 'Fantasy'],
        averageScore: 92,
        format: 'TV',
      },
    ],
    pageInfo: { total: 1, hasNextPage: false },
  }),
  getTrendingAnime: vi.fn().mockResolvedValue([]),
  getTopRatedAnime: vi.fn().mockResolvedValue([]),
  getSeasonalAnime: vi.fn().mockResolvedValue([]),
  ANIME_GENRES: ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy'],
  ANIME_FORMATS: [{ value: 'TV', label: 'TV Series' }],
  ANIME_STATUSES: [{ value: 'RELEASING', label: 'Airing Now' }],
  ANIME_SORT_OPTIONS: [{ value: 'POPULARITY_DESC', label: 'Most Popular' }],
}));

describe('TextSearchInterface Component', () => {
  it('renders search input and exploration tabs', () => {
    render(<TextSearchInterface onFindSimilar={vi.fn()} />);

    expect(screen.getByPlaceholderText(/Search anime by title/i)).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('All Anime')).toBeInTheDocument();
  });

  it('toggles filter drawer and allows genre interaction', async () => {
    render(<TextSearchInterface onFindSimilar={vi.fn()} />);

    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);

    expect(await screen.findByText('Filter by Genres')).toBeInTheDocument();
    const actionGenrePill = screen.getByText('Action');
    fireEvent.click(actionGenrePill);
  });

  it('updates search query and triggers search results display', async () => {
    render(<TextSearchInterface onFindSimilar={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/Search anime by title/i);
    fireEvent.change(searchInput, { target: { value: 'Frieren' } });

    await waitFor(() => {
      expect(searchAnime).toHaveBeenCalled();
    });
  });
});
