import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ResultCard } from '../ResultCard';
import { AniListMedia } from '@/lib/anilist';

describe('ResultCard Component', () => {
  const mockAnilist: AniListMedia = {
    id: 101922,
    title: {
      romaji: 'Kimetsu no Yaiba',
      english: 'Demon Slayer: Kimetsu no Yaiba',
    },
    coverImage: {
      large: 'https://example.com/demonslayer.jpg',
    },
    description: 'Tanjiro sets out on the path of the Demon Slayer.',
    genres: ['Action', 'Fantasy'],
    averageScore: 85,
    episodes: 26,
    format: 'TV',
    status: 'FINISHED',
  };

  const mockResult = {
    trace: {
      anilist: 101922,
      filename: 'Demon Slayer - Episode 19.mp4',
      episode: 19,
      from: 1140,
      to: 1150,
      similarity: 0.965,
      video: 'https://example.com/preview.mp4',
      image: 'https://example.com/frame.jpg',
    },
    allCandidates: [],
    anilist: mockAnilist,
    timestamp: new Date().toISOString(),
  };

  it('renders scan result match percentage, episode and anime title', () => {
    render(
      <ResultCard
        result={mockResult}
        onSelectCandidate={vi.fn()}
        onFindSimilar={vi.fn()}
      />
    );

    expect(screen.getByText('Kimetsu no Yaiba')).toBeInTheDocument();
    expect(screen.getByText(/96\.5% Match Confidence/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Episode 19/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Tanjiro sets out on the path/)).toBeInTheDocument();
  });

  it('renders frame step control buttons with accessible labels', () => {
    render(
      <ResultCard
        result={mockResult}
        onSelectCandidate={vi.fn()}
        onFindSimilar={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Step backward 1 second')).toBeInTheDocument();
    expect(screen.getByLabelText('Step forward 1 second')).toBeInTheDocument();
  });
});
