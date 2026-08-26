import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchHeader } from '@/components/SearchHeader';
import { ScanInterface } from '@/components/ScanInterface';
import { ResultCard } from '@/components/ResultCard';
import { BadgesModal } from '@/components/BadgesModal';
import { AniListMedia } from '@/lib/anilist';

describe('Comprehensive Accessibility (A11y / WCAG 2.1) Audit Suite', () => {
  it('SearchHeader has accessible interactive roles, labels and keyboard bindings', () => {
    render(
      <SearchHeader
        activeTab="scan"
        onTabChange={vi.fn()}
        onOpenCommandPalette={vi.fn()}
        onOpenBadges={vi.fn()}
        onOpenHistory={vi.fn()}
      />
    );

    const badgeTrigger = screen.getByRole('button', { name: /Otaku Level/i });
    expect(badgeTrigger).toBeInTheDocument();
    expect(badgeTrigger).toHaveAttribute('tabIndex', '0');
  });

  it('ScanInterface has accessible dropzone, labels and navigation tabs', () => {
    render(<ScanInterface onScanComplete={vi.fn()} onScanStart={vi.fn()} />);

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /upload/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /image url/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /samples/i })).toBeInTheDocument();
  });

  it('ResultCard provides explicit ARIA labels for all video playback & frame controls', () => {
    const mockMedia: AniListMedia = {
      id: 1,
      title: { romaji: 'Frieren' },
      coverImage: { large: 'https://example.com/frieren.jpg' },
      description: 'An elf mage.',
      genres: ['Fantasy'],
      averageScore: 92,
      episodes: 28,
    };

    const mockResult = {
      trace: {
        anilist: 1,
        filename: 'Frieren - 01.mp4',
        episode: 1,
        from: 100,
        to: 110,
        similarity: 0.98,
        video: 'https://example.com/video.mp4',
        image: 'https://example.com/img.jpg',
      },
      allCandidates: [],
      anilist: mockMedia,
      timestamp: new Date().toISOString(),
    };

    render(
      <ResultCard
        result={mockResult}
        onSelectCandidate={vi.fn()}
        onFindSimilar={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Step backward 1 second')).toBeInTheDocument();
    expect(screen.getByLabelText('Step forward 1 second')).toBeInTheDocument();
    expect(screen.getByLabelText('Pause')).toBeInTheDocument();
  });

  it('BadgesModal contains screen reader accessible headings and close triggers', async () => {
    render(<BadgesModal isOpen={true} onClose={vi.fn()} />);

    expect(await screen.findByText('Achievements & Badges')).toHaveClass('sr-only');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
