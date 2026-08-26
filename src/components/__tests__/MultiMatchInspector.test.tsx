import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MultiMatchInspector } from '../MultiMatchInspector';
import { TraceCandidate } from '@/lib/storage';

describe('MultiMatchInspector Component', () => {
  const mockCandidates: TraceCandidate[] = [
    {
      anilist: 154587,
      filename: 'Frieren - 01.mp4',
      episode: 1,
      from: 120,
      to: 130,
      similarity: 0.96,
      video: 'https://example.com/video1.mp4',
      image: 'https://example.com/img1.jpg',
    },
    {
      anilist: 154587,
      filename: 'Frieren - 04.mp4',
      episode: 4,
      from: 350,
      to: 360,
      similarity: 0.84,
      video: 'https://example.com/video2.mp4',
      image: 'https://example.com/img2.jpg',
    },
  ];

  it('renders null when candidates list has 1 or fewer items', () => {
    const { container } = render(
      <MultiMatchInspector
        candidates={[mockCandidates[0]]}
        selectedCandidate={null}
        onSelectCandidate={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders multiple candidate cards with confidence badges and timestamps', () => {
    render(
      <MultiMatchInspector
        candidates={mockCandidates}
        selectedCandidate={mockCandidates[0]}
        onSelectCandidate={vi.fn()}
      />
    );

    expect(screen.getByText(/Candidate Scene Matches \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText('Episode 1')).toBeInTheDocument();
    expect(screen.getByText('Episode 4')).toBeInTheDocument();
    expect(screen.getByText('96.0% Match')).toBeInTheDocument();
    expect(screen.getByText('84.0% Match')).toBeInTheDocument();
  });

  it('triggers candidate selection callback on click', () => {
    const handleSelect = vi.fn();
    render(
      <MultiMatchInspector
        candidates={mockCandidates}
        selectedCandidate={mockCandidates[0]}
        onSelectCandidate={handleSelect}
      />
    );

    const secondCandidateButton = screen.getByText('Episode 4');
    fireEvent.click(secondCandidateButton);

    expect(handleSelect).toHaveBeenCalledWith(mockCandidates[1]);
  });
});
