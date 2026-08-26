import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TextSearchInterface } from '../TextSearchInterface';

vi.mock('@/lib/anilist', () => ({
  searchAnime: vi.fn().mockResolvedValue({
    media: [],
    pageInfo: { total: 0, hasNextPage: false },
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
});
