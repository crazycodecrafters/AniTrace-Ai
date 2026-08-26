import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnimeScan } from '../useAnimeScan';
import { traceMoeLoadBalancer } from '@/lib/loadBalancer';
import { getAnimeById } from '@/lib/anilist';

vi.mock('@/lib/loadBalancer', () => ({
  traceMoeLoadBalancer: {
    execute: vi.fn(),
  },
}));

vi.mock('@/lib/anilist', () => ({
  getAnimeById: vi.fn(),
  searchAnime: vi.fn(),
}));

vi.mock('@/lib/storage', () => ({
  recordScanEvent: vi.fn().mockResolvedValue({ gainedXp: 50, newBadges: [] }),
  saveToHistory: vi.fn().mockResolvedValue(undefined),
}));

describe('useAnimeScan Custom Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default scan state and options', () => {
    const onScanComplete = vi.fn();
    const { result } = renderHook(() => useAnimeScan(onScanComplete));

    expect(result.current.isScanning).toBe(false);
    expect(result.current.cutBorders).toBe(true);
    expect(result.current.previewUrl).toBeNull();
  });

  it('rejects invalid image files and alerts the user', async () => {
    const onScanComplete = vi.fn();
    const { result } = renderHook(() => useAnimeScan(onScanComplete));

    const invalidFile = new File(['mock'], 'notes.txt', { type: 'text/plain' });
    await act(async () => {
      await result.current.handleFileUpload(invalidFile);
    });

    expect(onScanComplete).not.toHaveBeenCalled();
    expect(result.current.isScanning).toBe(false);
  });

  it('rejects empty or invalid URLs', async () => {
    const onScanComplete = vi.fn();
    const { result } = renderHook(() => useAnimeScan(onScanComplete));

    act(() => {
      result.current.setImageUrl('not-a-valid-url');
    });

    await act(async () => {
      await result.current.handleUrlScan();
    });

    expect(onScanComplete).not.toHaveBeenCalled();
  });

  it('successfully executes direct scan flow with load balanced trace inference', async () => {
    const mockTraceResult = {
      anilist: 154587,
      filename: 'Frieren_01.mp4',
      episode: 1,
      from: 100,
      to: 110,
      similarity: 0.98,
      video: 'https://example.com/video.mp4',
      image: 'https://example.com/img.jpg',
    };

    (traceMoeLoadBalancer.execute as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      frameCount: 1000,
      error: '',
      result: [mockTraceResult],
    });

    (getAnimeById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 154587,
      title: { romaji: 'Sousou no Frieren', english: 'Frieren' },
      coverImage: { large: 'https://example.com/cover.jpg' },
      genres: ['Fantasy', 'Adventure'],
    });

    const onScanComplete = vi.fn();
    const onScanStart = vi.fn();
    const { result } = renderHook(() => useAnimeScan(onScanComplete, onScanStart));

    await act(async () => {
      await result.current.handleDirectScan('https://example.com/screenshot.jpg');
    });

    expect(onScanStart).toHaveBeenCalled();
    expect(onScanComplete).toHaveBeenCalledTimes(1);
    expect(onScanComplete.mock.calls[0][0].trace.filename).toBe('Frieren_01.mp4');
  });

  it('resets scan state and cleans up previews', () => {
    const onScanComplete = vi.fn();
    const { result } = renderHook(() => useAnimeScan(onScanComplete));

    act(() => {
      result.current.resetScan();
    });

    expect(result.current.isScanning).toBe(false);
    expect(result.current.previewUrl).toBeNull();
  });
});
