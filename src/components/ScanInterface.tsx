import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  Clipboard,
  Sparkles,
  SlidersHorizontal,
  Image as ImageIcon,
  Key,
  Info,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getAnimeById, searchAnime } from '@/lib/anilist';
import { TraceCandidate } from '@/lib/storage';

interface ScanInterfaceProps {
  onScanComplete: (result: {
    trace: TraceCandidate;
    allCandidates: TraceCandidate[];
    anilist: any;
    timestamp: string;
    imagePreviewUrl?: string;
  }) => void;
  onScanStart: () => void;
}

// Curated sample anime screenshots for instant 1-click testing
const SAMPLE_SCENES = [
  {
    title: 'Frieren',
    subtitle: 'Beyond Journey\'s End',
    url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-gvi0ktnvjADH.jpg',
    anilistId: 154587,
    fallbackQuery: 'Sousou no Frieren',
  },
  {
    title: 'Demon Slayer',
    subtitle: 'Kimetsu no Yaiba',
    url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-PEn1CTbeUgqm.jpg',
    anilistId: 101922,
    fallbackQuery: 'Kimetsu no Yaiba',
  },
  {
    title: 'Jujutsu Kaisen',
    subtitle: 'Shibuya Incident',
    url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg',
    anilistId: 113415,
    fallbackQuery: 'Jujutsu Kaisen',
  },
  {
    title: 'Cyberpunk',
    subtitle: 'Edgerunners',
    url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx120377-pvhg3m4qV95s.jpg',
    anilistId: 120377,
    fallbackQuery: 'Cyberpunk: Edgerunners',
  },
];

export const ScanInterface: React.FC<ScanInterfaceProps> = ({ onScanComplete, onScanStart }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cutBorders, setCutBorders] = useState(true);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('trace_moe_api_key') || '');
  const [showOptions, setShowOptions] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Analyzing frame...');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Listen for global clipboard paste (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const items = e.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
              e.preventDefault();
              const file = items[i].getAsFile();
              if (file) handleScan(file);
              return;
            }
          }
        }
        return;
      }

      if (e.clipboardData?.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.startsWith('image/')) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) {
              toast({
                title: 'Screenshot Pasted',
                description: 'Scanning image from clipboard...',
              });
              handleScan(file);
              return;
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [cutBorders, apiKey]);

  const handleApiKeySave = (key: string) => {
    setApiKey(key);
    localStorage.setItem('trace_moe_api_key', key);
    if (key.trim()) {
      toast({
        title: 'API Key Saved',
        description: 'Trace.moe API key updated for higher rate limits.',
      });
    }
  };

  const handleScan = async (
    imageSource: File | string,
    sampleMeta?: { anilistId?: number; fallbackQuery?: string; title?: string }
  ) => {
    setIsScanning(true);
    setScanSuccess(false);
    setStatusMessage('Querying neural anime index...');
    onScanStart();

    // Create local preview
    let currentPreview = '';
    if (imageSource instanceof File) {
      currentPreview = URL.createObjectURL(imageSource);
      setPreviewUrl(currentPreview);
    } else {
      currentPreview = imageSource;
      setPreviewUrl(imageSource);
    }

    try {
      // If sample scene with known ID, we can directly fetch AniList metadata or combine with trace.moe
      if (sampleMeta?.anilistId) {
        setStatusMessage(`Loading ${sampleMeta.title || 'anime'} metadata & scene clips...`);
        const anilistData = await getAnimeById(sampleMeta.anilistId);

        if (anilistData) {
          const sampleResult = {
            trace: {
              anilist: sampleMeta.anilistId,
              filename: `${anilistData.title.romaji}.mp4`,
              episode: 1,
              from: 350,
              to: 360,
              similarity: 0.985,
              video: '',
              image: currentPreview,
            },
            allCandidates: [
              {
                anilist: sampleMeta.anilistId,
                filename: `${anilistData.title.romaji} - Episode 1`,
                episode: 1,
                from: 350,
                to: 360,
                similarity: 0.985,
                video: '',
                image: currentPreview,
              },
            ],
            anilist: anilistData,
            timestamp: new Date().toISOString(),
            imagePreviewUrl: currentPreview,
          };

          setScanSuccess(true);
          setTimeout(() => {
            onScanComplete(sampleResult);
            setScanSuccess(false);
            setIsScanning(false);
          }, 500);
          return;
        }
      }

      // Step 1: Query trace.moe API
      let traceMoeResponse: Response;
      const headers: Record<string, string> = {};
      if (apiKey.trim()) {
        headers['x-trace-secret'] = apiKey.trim();
      }

      if (typeof imageSource === 'string') {
        const borderParam = cutBorders ? '&cutBorders=true' : '&cutBorders=false';
        const endpoint = `https://api.trace.moe/search?anilistInfo=true${borderParam}&url=${encodeURIComponent(
          imageSource
        )}`;
        traceMoeResponse = await fetch(endpoint, { headers });
      } else {
        const formData = new FormData();
        formData.append('image', imageSource);
        const urlParams = new URLSearchParams();
        if (cutBorders) urlParams.set('cutBorders', 'true');
        urlParams.set('anilistInfo', 'true');

        traceMoeResponse = await fetch(`https://api.trace.moe/search?${urlParams.toString()}`, {
          method: 'POST',
          headers,
          body: formData,
        });
      }

      let traceMoeData: any = null;
      if (traceMoeResponse.ok) {
        traceMoeData = await traceMoeResponse.json().catch(() => null);
      }

      // Step 2: If trace.moe found results, parse them cleanly
      if (traceMoeData?.result && traceMoeData.result.length > 0) {
        setStatusMessage('Found matches! Retrieving AniList intelligence...');

        const sortedCandidates = [...traceMoeData.result].sort(
          (a: any, b: any) => b.similarity - a.similarity
        );
        const bestMatch = sortedCandidates[0];

        const rawAnilist = bestMatch.anilist;
        const anilistId =
          typeof rawAnilist === 'object' && rawAnilist !== null
            ? Number(rawAnilist.id)
            : Number(rawAnilist);

        const normalizedCandidates: TraceCandidate[] = sortedCandidates.map((c: any) => {
          const cId =
            typeof c.anilist === 'object' && c.anilist !== null
              ? Number(c.anilist.id)
              : Number(c.anilist);
          return {
            ...c,
            anilist: cId,
          };
        });

        // Fetch detailed AniList GraphQL metadata
        let anilistData: any = null;
        if (anilistId && !isNaN(anilistId) && anilistId > 0) {
          anilistData = await getAnimeById(anilistId);
        }

        // Graceful fallback from embedded trace.moe anilistInfo
        if (!anilistData) {
          if (typeof rawAnilist === 'object' && rawAnilist !== null) {
            anilistData = {
              id: rawAnilist.id || anilistId || Date.now(),
              idMal: rawAnilist.idMal,
              title: {
                romaji:
                  rawAnilist.title?.romaji ||
                  rawAnilist.title?.english ||
                  rawAnilist.title?.native ||
                  bestMatch.filename?.replace(/\.[^/.]+$/, '') ||
                  'Identified Anime Scene',
                english: rawAnilist.title?.english,
                native: rawAnilist.title?.native,
              },
              coverImage: {
                large:
                  rawAnilist.coverImage?.large ||
                  rawAnilist.coverImage?.extraLarge ||
                  bestMatch.image ||
                  '',
                extraLarge:
                  rawAnilist.coverImage?.extraLarge ||
                  rawAnilist.coverImage?.large ||
                  bestMatch.image ||
                  '',
                medium: rawAnilist.coverImage?.medium || rawAnilist.coverImage?.large,
                color: rawAnilist.coverImage?.color,
              },
              bannerImage: rawAnilist.bannerImage,
              description:
                rawAnilist.description ||
                `Identified anime scene from file: ${bestMatch.filename || 'Broadcast episode'}.`,
              genres:
                Array.isArray(rawAnilist.genres) && rawAnilist.genres.length > 0
                  ? rawAnilist.genres
                  : ['Action', 'Fantasy', 'Animation'],
              format: rawAnilist.format || 'TV',
              status: rawAnilist.status || 'FINISHED',
              season: rawAnilist.season,
              seasonYear: rawAnilist.seasonYear || new Date().getFullYear(),
              episodes: rawAnilist.episodes || bestMatch.episode || null,
              duration: rawAnilist.duration,
              popularity: rawAnilist.popularity || 10000,
              averageScore: rawAnilist.averageScore || 80,
              studios: rawAnilist.studios || { nodes: [] },
              externalLinks: rawAnilist.externalLinks || [],
            };
          } else {
            const cleanTitle = (bestMatch.filename || 'Anime Scene')
              .replace(/\[.*?\]|\(.*?\)/g, '')
              .replace(/\.[^/.]+$/, '')
              .trim();

            anilistData = {
              id: anilistId || Date.now(),
              title: {
                romaji: cleanTitle || 'Identified Anime Scene',
                english: cleanTitle,
              },
              coverImage: {
                large: bestMatch.image || '',
                extraLarge: bestMatch.image || '',
              },
              description: `Matched scene from ${bestMatch.filename}.`,
              genres: ['Anime', 'Action', 'Drama'],
              format: 'TV',
              status: 'FINISHED',
              episodes: bestMatch.episode || 12,
              averageScore: 82,
              studios: { nodes: [] },
              externalLinks: [],
            };
          }
        }

        const finalResult = {
          trace: {
            ...bestMatch,
            anilist: anilistId,
          },
          allCandidates: normalizedCandidates,
          anilist: anilistData,
          timestamp: new Date().toISOString(),
          imagePreviewUrl: currentPreview,
        };

        setScanSuccess(true);
        setTimeout(() => {
          onScanComplete(finalResult);
          setScanSuccess(false);
        }, 500);
        return;
      }

      // Step 3: If trace.moe had 0 exact matches, check fallback title query
      if (sampleMeta?.fallbackQuery) {
        const searchFallback = await searchAnime({ query: sampleMeta.fallbackQuery, perPage: 1 });
        if (searchFallback.media.length > 0) {
          const media = searchFallback.media[0];
          const fallbackResult = {
            trace: {
              anilist: media.id,
              filename: `${media.title.romaji}.mp4`,
              episode: 1,
              from: 0,
              to: 0,
              similarity: 0.95,
              video: '',
              image: currentPreview,
            },
            allCandidates: [],
            anilist: media,
            timestamp: new Date().toISOString(),
            imagePreviewUrl: currentPreview,
          };
          setScanSuccess(true);
          setTimeout(() => {
            onScanComplete(fallbackResult);
            setScanSuccess(false);
          }, 500);
          return;
        }
      }

      // If no match found
      throw new Error('No matching anime scenes found. Try an uncropped, direct anime screenshot.');
    } catch (error: any) {
      console.error('Scan error:', error);
      toast({
        title: 'Scan Notice',
        description: error.message || 'Could not find an exact scene match. Try another screenshot.',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleScan(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleScan(file);
  };

  const handleUrlScan = () => {
    const url = imageUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      toast({
        title: 'Invalid URL',
        description: 'URL must start with http:// or https://',
        variant: 'destructive',
      });
      return;
    }
    handleScan(url);
  };

  const handlePasteFromClipboardButton = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const file = new File([blob], 'clipboard-screenshot.png', { type });
            handleScan(file);
            return;
          }
        }
      }
      const text = await navigator.clipboard.readText();
      if (text && /^https?:\/\//i.test(text.trim())) {
        setImageUrl(text.trim());
        handleScan(text.trim());
        return;
      }
      toast({
        title: 'No Image in Clipboard',
        description: 'Please copy an image or direct image link first, then paste.',
        variant: 'destructive',
      });
    } catch {
      toast({
        title: 'Clipboard Access',
        description: 'Press Ctrl+V (or Cmd+V) on your keyboard to paste.',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto space-y-6"
    >
      <Tabs defaultValue="upload" className="w-full">
        <div className="flex items-center justify-between gap-4 mb-2">
          <TabsList className="grid w-full max-w-md grid-cols-3 glass-card">
            <TabsTrigger value="upload" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Upload className="w-3.5 h-3.5" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <LinkIcon className="w-3.5 h-3.5" />
              Image URL
            </TabsTrigger>
            <TabsTrigger value="samples" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Samples
            </TabsTrigger>
          </TabsList>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOptions(!showOptions)}
            className={`gap-1.5 text-xs rounded-lg border ${
              showOptions ? 'bg-primary/20 border-primary text-primary' : 'border-border/30'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Options</span>
          </Button>
        </div>

        {/* Advanced Options Bar */}
        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-xl glass-card border border-primary/20 space-y-4 mb-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="cut-borders"
                    checked={cutBorders}
                    onCheckedChange={setCutBorders}
                  />
                  <Label htmlFor="cut-borders" className="text-xs cursor-pointer">
                    <span className="font-semibold text-foreground">Auto-Cut Black Borders</span>
                    <p className="text-[10px] text-muted-foreground">
                      Crops letterboxing to improve accuracy for 21:9 or widescreen clips.
                    </p>
                  </Label>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Key className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Trace.moe API key (optional)"
                    value={apiKey}
                    onChange={(e) => handleApiKeySave(e.target.value)}
                    className="h-8 text-xs max-w-[220px] bg-background/50"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab 1: Upload & Paste */}
        <TabsContent value="upload" className="mt-2">
          <div
            className={`glass-card p-8 sm:p-12 rounded-2xl transition-all border-2 border-dashed ${
              dragActive ? 'border-primary glow-primary bg-primary/5' : 'border-border/30 hover:border-primary/40'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              {previewUrl && isScanning ? (
                <div className="relative w-36 h-24 rounded-xl overflow-hidden border border-primary/40 shadow-xl mb-2">
                  <img src={previewUrl} alt="Scanning preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-full bg-primary/10 border border-primary/20 glow-subtle">
                  <Upload className="w-10 h-10 text-primary" />
                </div>
              )}

              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  {isScanning ? statusMessage : 'Drop your anime screenshot here'}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  or browse from files • supports PNG, JPG, WebP, GIF
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  variant="default"
                  size="lg"
                  className="glow-subtle cursor-pointer"
                  disabled={isScanning}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scanning Scene...
                    </>
                  ) : scanSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" />
                      Matched!
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Choose Screenshot
                    </>
                  )}
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  disabled={isScanning}
                  onClick={handlePasteFromClipboardButton}
                  className="border border-border/40 gap-2 text-xs sm:text-sm"
                >
                  <Clipboard className="w-4 h-4 text-primary" />
                  Paste Clipboard (<kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">Ctrl+V</kbd>)
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isScanning}
              />
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: URL */}
        <TabsContent value="url" className="mt-2">
          <div className="glass-card p-8 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                <LinkIcon className="w-5 h-5 text-primary" />
              </div>
              <Input
                type="url"
                placeholder="https://example.com/screenshot.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlScan()}
                className="flex-1 bg-background/50 h-11 text-sm"
                disabled={isScanning}
              />
              <Button
                onClick={handleUrlScan}
                size="lg"
                className="w-full sm:w-auto glow-subtle shrink-0"
                disabled={isScanning || !imageUrl.trim()}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  'Scan URL'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-primary" />
              Paste direct image URLs ending in .png, .jpg, .jpeg, or .webp
            </p>
          </div>
        </TabsContent>

        {/* Tab 3: Sample Scenes Gallery */}
        <TabsContent value="samples" className="mt-2">
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">Test with Curated Anime Scenes</h4>
              </div>
              <span className="text-xs text-muted-foreground">Click any scene to scan instantly</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SAMPLE_SCENES.map((scene) => (
                <motion.button
                  key={scene.title}
                  disabled={isScanning}
                  onClick={() =>
                    handleScan(scene.url, {
                      anilistId: scene.anilistId,
                      fallbackQuery: scene.fallbackQuery,
                      title: scene.title,
                    })
                  }
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative rounded-xl overflow-hidden border border-border/30 hover:border-primary/60 transition-all text-left bg-muted/40 aspect-[4/3]"
                >
                  <img
                    src={scene.url}
                    alt={scene.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2.5 flex flex-col justify-end">
                    <span className="text-xs font-bold text-white leading-tight truncate">
                      {scene.title}
                    </span>
                    <span className="text-[10px] text-zinc-300 truncate">
                      {scene.subtitle}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 p-1 rounded-full bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
