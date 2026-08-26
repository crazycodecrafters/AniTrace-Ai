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
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getAnimeById } from '@/lib/anilist';
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

// Curated sample anime screenshots for instant testing
const SAMPLE_SCENES = [
  {
    title: 'Frieren',
    subtitle: 'Beyond Journey\'s End',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    fallbackQuery: 'Sousou no Frieren',
  },
  {
    title: 'Demon Slayer',
    subtitle: 'Kimetsu no Yaiba',
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    fallbackQuery: 'Kimetsu no Yaiba',
  },
  {
    title: 'Your Name',
    subtitle: 'Kimi no Na wa',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    fallbackQuery: 'Kimi no Na wa',
  },
  {
    title: 'Cyberpunk',
    subtitle: 'Edgerunners',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
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
      // If user is typing in an input or textarea, don't hijack unless it's an image file
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

  const handleScan = async (imageSource: File | string) => {
    setIsScanning(true);
    setScanSuccess(false);
    setStatusMessage('Querying neural anime index...');
    onScanStart();

    // Create local preview if File
    let currentPreview = '';
    if (imageSource instanceof File) {
      currentPreview = URL.createObjectURL(imageSource);
      setPreviewUrl(currentPreview);
    } else {
      currentPreview = imageSource;
      setPreviewUrl(imageSource);
    }

    try {
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

      if (traceMoeResponse.status === 429) {
        throw new Error('Trace.moe rate limit reached. Please wait a minute or provide an API key.');
      }

      if (!traceMoeResponse.ok) {
        const errText = await traceMoeResponse.text().catch(() => '');
        throw new Error(errText || 'Failed to scan image. Please try a different screenshot.');
      }

      const traceMoeData = await traceMoeResponse.json();

      if (!traceMoeData.result || traceMoeData.result.length === 0) {
        throw new Error('No matching anime scenes found. Try a sharper, unedited screenshot.');
      }

      setStatusMessage('Found matches! Retrieving AniList metadata...');

      // Sort all candidates by similarity
      const sortedCandidates: TraceCandidate[] = [...traceMoeData.result].sort(
        (a: any, b: any) => b.similarity - a.similarity
      );

      const bestMatch = sortedCandidates[0];

      // Step 2: Fetch detailed metadata from AniList GraphQL
      let anilistData = await getAnimeById(bestMatch.anilist);

      // Fallback if full details fail or minimal
      if (!anilistData) {
        // Fallback minimal query
        const minimalQuery = `
          query ($id: Int) {
            Media(id: $id) {
              id
              title { romaji english native }
              coverImage { large extraLarge }
              description
              genres
              averageScore
              episodes
              seasonYear
            }
          }
        `;
        const fallbackResp = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: minimalQuery, variables: { id: bestMatch.anilist } }),
        });
        const fallbackJson = await fallbackResp.json();
        anilistData = fallbackJson.data?.Media;
      }

      if (!anilistData) {
        throw new Error('Anime metadata could not be resolved from AniList.');
      }

      const finalResult = {
        trace: bestMatch,
        allCandidates: sortedCandidates,
        anilist: anilistData,
        timestamp: new Date().toISOString(),
        imagePreviewUrl: currentPreview,
      };

      setScanSuccess(true);
      setTimeout(() => {
        onScanComplete(finalResult);
        setScanSuccess(false);
      }, 600);
    } catch (error: any) {
      console.error('Scan error:', error);
      toast({
        title: 'Scan Failed',
        description: error.message || 'Please try another screenshot.',
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
      // If no image blob, check text for image URL
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
                  onClick={() => handleScan(scene.url)}
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
