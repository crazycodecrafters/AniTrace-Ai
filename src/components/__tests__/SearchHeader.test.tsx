import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchHeader } from '../SearchHeader';

vi.mock('@/lib/storage', () => ({
  getProfile: vi.fn().mockResolvedValue({
    xp: 250,
    level: 3,
    currentStreak: 5,
    totalScans: 15,
    unlockedBadges: ['first_scan', 'perfect_match'],
  }),
}));

describe('SearchHeader Component', () => {
  it('renders branding title, version badge, and navigation tabs', () => {
    render(
      <SearchHeader
        activeTab="scan"
        onTabChange={vi.fn()}
        onOpenCommandPalette={vi.fn()}
        onOpenBadges={vi.fn()}
        onOpenHistory={vi.fn()}
      />
    );

    expect(screen.getByText('AniTrace AI')).toBeInTheDocument();
    expect(screen.getByText('v2.0')).toBeInTheDocument();
    expect(screen.getAllByText('Scene Scanner')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Title & Filters')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Discover')[0]).toBeInTheDocument();
  });

  it('triggers onTabChange when navigation tabs are clicked', () => {
    const handleTabChange = vi.fn();
    render(
      <SearchHeader
        activeTab="scan"
        onTabChange={handleTabChange}
        onOpenCommandPalette={vi.fn()}
        onOpenBadges={vi.fn()}
        onOpenHistory={vi.fn()}
      />
    );

    const titleTab = screen.getAllByText('Title & Filters')[0];
    fireEvent.click(titleTab);
    expect(handleTabChange).toHaveBeenCalledWith('text');

    const discoverTab = screen.getAllByText('Discover')[0];
    fireEvent.click(discoverTab);
    expect(handleTabChange).toHaveBeenCalledWith('discover');
  });

  it('triggers command palette, badges, and history modal callbacks', () => {
    const handleOpenPalette = vi.fn();
    const handleOpenBadges = vi.fn();
    const handleOpenHistory = vi.fn();

    render(
      <SearchHeader
        activeTab="scan"
        onTabChange={vi.fn()}
        onOpenCommandPalette={handleOpenPalette}
        onOpenBadges={handleOpenBadges}
        onOpenHistory={handleOpenHistory}
      />
    );

    const searchQuickButton = screen.getByText('Search anime...');
    fireEvent.click(searchQuickButton);
    expect(handleOpenPalette).toHaveBeenCalled();

    const badgesButton = screen.getByRole('button', { name: /Otaku Level/i });
    fireEvent.click(badgesButton);
    expect(handleOpenBadges).toHaveBeenCalled();

    const historyButtons = screen.getAllByText('History');
    fireEvent.click(historyButtons[0]);
    expect(handleOpenHistory).toHaveBeenCalled();
  });
});
