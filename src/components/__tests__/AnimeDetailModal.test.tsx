import React from 'react';
import { render, screen } from '@testing-library/react';
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
  };

  it('renders modal content with anime titles and scores when open', () => {
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
