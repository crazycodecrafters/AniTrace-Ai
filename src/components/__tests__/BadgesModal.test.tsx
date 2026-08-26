import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BadgesModal } from '../BadgesModal';

vi.mock('@/lib/storage', () => ({
  getBadges: vi.fn().mockResolvedValue([
    {
      id: 'first_scan',
      title: 'First Contact',
      description: 'Scanned your first anime screenshot.',
      icon: '🔍',
      unlockedAt: '2026-08-26T12:00:00Z',
      requirement: 'Scan 1 anime scene',
      xpReward: 50,
    },
    {
      id: 'sleuth_5',
      title: 'Scene Sleuth',
      description: 'Scanned 5 anime scenes successfully.',
      icon: '🕵️',
      unlockedAt: null,
      requirement: 'Scan 5 scenes',
      xpReward: 100,
    },
  ]),
  getProfile: vi.fn().mockResolvedValue({
    xp: 150,
    level: 2,
    currentStreak: 3,
    totalScans: 8,
    unlockedBadges: ['first_scan'],
  }),
}));

describe('BadgesModal Component', () => {
  it('renders badge items and user otaku level progress', async () => {
    render(<BadgesModal isOpen={true} onClose={vi.fn()} />);

    expect(await screen.findByText('Scout Achievements & Badges')).toBeInTheDocument();
    expect(await screen.findByText('First Contact')).toBeInTheDocument();
    expect(await screen.findByText('Scene Sleuth')).toBeInTheDocument();
  });
});
