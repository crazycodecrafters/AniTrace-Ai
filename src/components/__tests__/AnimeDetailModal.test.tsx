import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AnimeDetailModal } from '../AnimeDetailModal';
import { AniListMedia } from '@/lib/anilist';

describe('AnimeDetailModal Component', () => {
  const mockMedia: AniListMedia = {
    id: 154587,
    title: {
      romaji: 'Sousou no Frieren',
      english: 'Frieren: Beyond Journey\'s End',
    },
    coverImage: {
      large: 'https://example.com/frieren.jpg',
    },
    description: 'An elf mage embarks on a journey to understand humanity.',
    genres: ['Adventure', 'Drama', 'Fantasy'],
    averageScore: 92,
    episodes: 28,
    format: 'TV',
    status: 'FINISHED',
    trailer: {
      id: 'mock_trailer_id',
      site: 'youtube',
    },
    externalLinks: [
      { id: 1, url: 'https://crunchyroll.com/frieren', site: 'Crunchyroll' },
    ],
  };

  it('renders modal content with anime titles, scores, and trailer triggers when open', () => {
    render(
      <AnimeDetailModal
        media={mockMedia}
        isOpen={true}
        onClose={vi.fn()}
        onFindSimilar={vi.fn()}
      />
    );

    expect(screen.getAllByText('Sousou no Frieren')[0]).toBeInTheDocument();
    expect(screen.getByText(/An elf mage embarks on a journey/)).toBeInTheDocument();
    expect(screen.getByText('92% Score')).toBeInTheDocument();
    expect(screen.getByText('TV')).toBeInTheDocument();
    expect(screen.getByText('Watch Trailer')).toBeInTheDocument();
  });

  it('triggers onFindSimilar when Find Similar Anime button is clicked', () => {
    const handleFindSimilar = vi.fn();
    render(
      <AnimeDetailModal
        media={mockMedia}
        isOpen={true}
        onClose={vi.fn()}
        onFindSimilar={handleFindSimilar}
      />
    );

    const findSimilarBtn = screen.getByText('Find Similar Anime');
    fireEvent.click(findSimilarBtn);

    expect(handleFindSimilar).toHaveBeenCalledWith(mockMedia);
  });

  it('returns null when media is null', () => {
    const { container } = render(
      <AnimeDetailModal
        media={null}
        isOpen={false}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
