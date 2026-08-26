import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HistoryDrawer } from '../HistoryDrawer';

const { mockHistoryItem } = vi.hoisted(() => ({
  mockHistoryItem: {
    id: 'h-1',
    anilistId: 154587,
    title: 'Sousou no Frieren',
    englishTitle: 'Frieren: Beyond Journey\'s End',
    coverUrl: 'https://example.com/frieren.jpg',
    timestamp: '2026-08-26T12:00:00Z',
    episode: 1,
    similarity: 0.98,
    tags: ['Magic'],
    synopsis: 'Frieren journeys across the land.',
    genres: ['Fantasy'],
  },
}));

vi.mock('@/lib/storage', () => ({
  searchHistory: vi.fn().mockResolvedValue([mockHistoryItem]),
  deleteHistoryItem: vi.fn().mockResolvedValue([]),
  clearAllHistory: vi.fn().mockResolvedValue(undefined),
  exportHistoryJSON: vi.fn().mockResolvedValue('{}'),
  importHistoryJSON: vi.fn().mockResolvedValue(1),
}));

describe('HistoryDrawer Component', () => {
  it('renders history items and export/import actions', async () => {
    render(
      <HistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSelectHistoryItem={vi.fn()}
      />
    );

    expect(await screen.findByText('Sousou no Frieren')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('triggers onSelectHistoryItem when an item in history is clicked', async () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <HistoryDrawer
        isOpen={true}
        onClose={handleClose}
        onSelectHistoryItem={handleSelect}
      />
    );

    const item = await screen.findByText('Sousou no Frieren');
    fireEvent.click(item);

    expect(handleSelect).toHaveBeenCalledWith(mockHistoryItem);
    expect(handleClose).toHaveBeenCalled();
  });
});
