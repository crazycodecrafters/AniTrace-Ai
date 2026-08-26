import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CommandPalette } from '../CommandPalette';

vi.mock('@/lib/anilist', () => ({
  searchAnime: vi.fn().mockResolvedValue({
    media: [
      {
        id: 101922,
        title: { romaji: 'Kimetsu no Yaiba' },
        coverImage: { medium: 'https://example.com/cover.jpg' },
        genres: ['Action'],
      },
    ],
    pageInfo: { total: 1, hasNextPage: false },
  }),
}));

vi.mock('@/lib/storage', () => ({
  getHistory: vi.fn().mockResolvedValue([]),
}));

describe('CommandPalette Component', () => {
  it('renders command palette input and quick actions when open', async () => {
    render(
      <CommandPalette
        isOpen={true}
        onClose={vi.fn()}
        onSelectAnime={vi.fn()}
        onNavigateTab={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/Search anime, genres, or actions/i)).toBeInTheDocument();
    expect(await screen.findByText('Discover Trending')).toBeInTheDocument();
    expect(screen.getByText('Saved Scans History')).toBeInTheDocument();
  });
});
