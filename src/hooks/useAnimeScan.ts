import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { traceMoeLoadBalancer } from '@/lib/loadBalancer';
import { getAnimeById, searchAnime, AniListMedia } from '@/lib/anilist';
import { validateImageFile, validateImageUrl } from '@/utils/fileValidation';
import { recordScanEvent, saveToHistory } from '@/lib/storage';

export interface TraceResult {
  anilist: number;
  filename: string;
  episode: number | number[] | null;
  from: number;
  to: number;
  similarity: number;
  video: string;
  image: string;
}

export interface TraceSearchResponse {
  frameCount: number;
  error: string;
  result: TraceResult[];
}

export interface ScanHookResult {
  isScanning: boolean;
  statusMessage: string;
  previewUrl: string | null;
  imageUrl: string;
  apiKey: string;
  cutBorders: boolean;
  setImageUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  setCutBorders: (cut: boolean) => void;
  handleFileUpload: (file: File) => Promise<void>;
  handleUrlScan: () => Promise<void>;
  handleDirectScan: (
    input: File | Blob | string,
    presetMeta?: { anilistId?: number; fallbackQuery?: string; title?: string }
  ) => Promise<void>;
  resetScan: () => void;
}

export function useAnimeScan(
  onScanComplete: (data: {
    trace: TraceResult;
    allCandidates: TraceResult[];
    anilist: AniListMedia;
    timestamp: string;
  }) => void,
  onScanStart?: () => void
): ScanHookResult {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Analyzing scene...');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('tracemoe_api_key') || '');
  const [cutBorders, setCutBorders] = useState(true);

  // Track active object URLs for memory management & revocation
  const activeBlobUrlRef = useRef<string | null>(null);

  const cleanupBlobUrl = useCallback(() => {
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
  }, []);

  const resetScan = useCallback(() => {
    cleanupBlobUrl();
    setIsScanning(false);
    setStatusMessage('Analyzing scene...');
    setPreviewUrl(null);
    setImageUrl('');
  }, [cleanupBlobUrl]);

  const handleDirectScan = useCallback(
    async (
      input: File | Blob | string,
      presetMeta?: { anilistId?: number; fallbackQuery?: string; title?: string }
    ) => {
      onScanStart?.();
      setIsScanning(true);
      setStatusMessage('Extracting visual features...');

      cleanupBlobUrl();

      if (typeof input === 'string') {
        setPreviewUrl(input);
      } else {
        const objUrl = URL.createObjectURL(input);
        activeBlobUrlRef.current = objUrl;
        setPreviewUrl(objUrl);
      }

      try {
        const data = await traceMoeLoadBalancer.execute<TraceSearchResponse>(
          async (endpointUrl, signal) => {
            const queryParams = new URLSearchParams();
            if (cutBorders) queryParams.set('cutBorders', '');
            if (typeof input === 'string') queryParams.set('url', input);

            const urlWithParams = `${endpointUrl}?${queryParams.toString()}`;
            const headers: Record<string, string> = {};
            if (apiKey.trim()) {
              headers['x-trace-key'] = apiKey.trim();
            }

            const fetchOptions: RequestInit = {
              method: typeof input === 'string' ? 'GET' : 'POST',
              headers,
              signal,
            };

            if (typeof input !== 'string') {
              const formData = new FormData();
              formData.append('image', input);
              fetchOptions.body = formData;
            }

            const res = await fetch(urlWithParams, fetchOptions);
            if (!res.ok) {
              throw new Error(`Inference service returned status ${res.status}: ${res.statusText}`);
            }
            return await res.json();
          }
        );

        if (!data.result || data.result.length === 0) {
          throw new Error('No confident match found. Please try another frame or higher resolution screenshot.');
        }

        const bestMatch = data.result[0];
        setStatusMessage('Fetching anime metadata...');

        let anilistData: AniListMedia | null = null;
        const targetId = presetMeta?.anilistId || bestMatch.anilist;

        if (targetId) {
          try {
            anilistData = await getAnimeById(targetId);
          } catch {
            // Handled gracefully below
          }
        }

        if (!anilistData && presetMeta?.fallbackQuery) {
          try {
            const searchResults = await searchAnime({ query: presetMeta.fallbackQuery, perPage: 1 });
            if (searchResults.media && searchResults.media.length > 0) {
              anilistData = searchResults.media[0];
            }
          } catch {
            // Handled gracefully below
          }
        }

        // Fallback synthetic metadata if AniList API is offline
        if (!anilistData) {
          const fallbackTitle = presetMeta?.title || bestMatch.filename?.replace(/\.[^/.]+$/, '') || 'Identified Anime Scene';
          anilistData = {
            id: targetId || Date.now(),
            title: { romaji: fallbackTitle, english: fallbackTitle },
            coverImage: { large: bestMatch.image || (typeof input === 'string' ? input : '') },
            description: `Matched scene from ${bestMatch.filename || 'episode clip'} at ${Math.floor(bestMatch.from / 60)}m ${Math.floor(bestMatch.from % 60)}s.`,
            genres: ['Animation'],
            format: 'TV',
          };
        }

        // Gamification & History persistence
        await recordScanEvent({
          similarity: bestMatch.similarity,
          genres: anilistData.genres || [],
        });

        await saveToHistory({
          id: `scan-${Date.now()}`,
          anilistId: anilistData.id,
          title: anilistData.title.romaji,
          englishTitle: anilistData.title.english || null,
          nativeTitle: anilistData.title.native || null,
          coverUrl: anilistData.coverImage.large || bestMatch.image,
          timestamp: new Date().toISOString(),
          episode: typeof bestMatch.episode === 'number' ? bestMatch.episode : null,
          similarity: bestMatch.similarity,
          tags: anilistData.tags?.map((t) => t.name) || [],
          synopsis: anilistData.description || null,
          genres: anilistData.genres || [],
        });

        onScanComplete({
          trace: bestMatch,
          allCandidates: data.result,
          anilist: anilistData,
          timestamp: new Date().toISOString(),
        });

        toast({
          title: 'Scene Identified!',
          description: `Matched "${anilistData.title.romaji}" with ${(bestMatch.similarity * 100).toFixed(1)}% confidence.`,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to scan screenshot.';
        toast({
          variant: 'destructive',
          title: 'Scan Failed',
          description: errorMsg,
        });
      } finally {
        setIsScanning(false);
      }
    },
    [apiKey, cleanupBlobUrl, cutBorders, onScanComplete, onScanStart, toast]
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast({
          variant: 'destructive',
          title: 'Invalid File',
          description: validation.error,
        });
        return;
      }
      await handleDirectScan(file);
    },
    [handleDirectScan, toast]
  );

  const handleUrlScan = useCallback(async () => {
    const validation = validateImageUrl(imageUrl);
    if (!validation.valid) {
      toast({
        variant: 'destructive',
        title: 'Invalid Image URL',
        description: validation.error,
      });
      return;
    }
    await handleDirectScan(imageUrl.trim());
  }, [handleDirectScan, imageUrl, toast]);

  return {
    isScanning,
    statusMessage,
    previewUrl,
    imageUrl,
    apiKey,
    cutBorders,
    setImageUrl,
    setApiKey,
    setCutBorders,
    handleFileUpload,
    handleUrlScan,
    handleDirectScan,
    resetScan,
  };
}
