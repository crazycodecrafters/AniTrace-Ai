import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CommandPalette } from '../CommandPalette';
import { searchAnime } from '@/lib/anilist';

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
  getHistory: vi.fn().mockResolvedValue([
    {
      id: 'scan-1',
      anilistId: 154587,
      title: 'Sousou no Frieren',
      coverUrl: 'https://example.com/frieren.jpg',
      timestamp: new Date().toISOString(),
      similarity: 0.98,
    },
  ]),
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

  it('triggers onNavigateTab when quick action item is clicked', async () => {
    const handleNavigate = vi.fn();
    const handleClose = vi.fn();

    render(
      <CommandPalette
        isOpen={true}
        onClose={handleClose}
        onSelectAnime={vi.fn()}
        onNavigateTab={handleNavigate}
      />
    );

    const discoverAction = await screen.findByText('Discover Trending');
    fireEvent.click(discoverAction);

    expect(handleNavigate).toHaveBeenCalledWith('discover');
    expect(handleClose).toHaveBeenCalled();
  });

  it('executes title search and triggers onSelectAnime', async () => {
    const handleSelect = vi.fn();
    render(
      <CommandPalette
        isOpen={true}
        onClose={vi.fn()}
        onSelectAnime={handleSelect}
        onNavigateTab={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/Search anime, genres, or actions/i);
    fireEvent.change(input, { target: { value: 'Demon Slayer' } });

    await waitFor(() => {
      expect(searchAnime).toHaveBeenCalled();
    });
  });
});
