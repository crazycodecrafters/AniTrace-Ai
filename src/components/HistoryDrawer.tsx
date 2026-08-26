import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Search,
  Trash2,
  Download,
  Upload,
  X,
  Star,
  Clock,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  deleteHistoryItem,
  clearAllHistory,
  searchHistory,
  exportHistoryJSON,
  importHistoryJSON,
  HistoryItem,
} from '@/lib/storage';
import { ANIME_GENRES } from '@/lib/anilist';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHistoryItem: (item: HistoryItem) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectHistoryItem,
}) => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const items = await searchHistory(searchQuery, selectedGenre);
      setHistoryItems(items);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedGenre]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = await deleteHistoryItem(id);
    setHistoryItems(updated);
    toast({
      title: 'Scan Removed',
      description: 'The scan record was removed from your local history.',
    });
  };

  const handleClearAll = async () => {
    await clearAllHistory();
    setHistoryItems([]);
    setShowClearConfirm(false);
    toast({
      title: 'History Cleared',
      description: 'All local scan records have been cleared.',
    });
  };

  const handleExport = async () => {
    try {
      const json = await exportHistoryJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anime-lens-history-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: 'History Exported',
        description: 'Your scan history backup was downloaded as JSON.',
      });
    } catch {
      toast({
        title: 'Export Failed',
        description: 'Could not export scan history.',
        variant: 'destructive',
      });
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const count = await importHistoryJSON(text);
      await loadData();
      toast({
        title: 'Import Successful',
        description: `Imported ${count} new scan records into history.`,
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      toast({
        title: 'Import Failed',
        description: error.message || 'Invalid JSON file format.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-6 bg-card/95 backdrop-blur-2xl border-border/40 text-foreground rounded-2xl flex flex-col space-y-4">
          <DialogTitle className="sr-only">Scan History Library</DialogTitle>
          <DialogDescription className="sr-only">
            Browse and manage your saved anime screenshot scans.
          </DialogDescription>

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Scan History & Library</h2>
                <p className="text-xs text-muted-foreground">
                  Saved on-device in IndexedDB • 100% Private
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="gap-1.5 text-xs h-8"
                title="Export history backup"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 text-xs h-8"
                title="Import backup"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Import</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
              {historyItems.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClearConfirm(true)}
                  className="gap-1.5 text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Clear all history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground ml-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search history by title, genre, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50 h-10 text-xs rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Genre Filter Scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                onClick={() => setSelectedGenre('All')}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                  selectedGenre === 'All'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/40 text-muted-foreground border-border/30 hover:border-primary/40'
                }`}
              >
                All ({historyItems.length})
              </button>
              {ANIME_GENRES.slice(0, 10).map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                    selectedGenre === genre
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/40 text-muted-foreground border-border/30 hover:border-primary/40'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* History Item Cards List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[300px]">
            {historyItems.length > 0 ? (
              historyItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => {
                    onSelectHistoryItem(item);
                    onClose();
                  }}
                  className="group flex items-center gap-3.5 p-3 rounded-xl glass-card hover:bg-primary/10 border border-border/30 hover:border-primary/40 transition-all cursor-pointer"
                >
                  <img
                    src={item.coverUrl}
                    alt={item.title}
                    className="w-12 h-16 object-cover rounded-lg shrink-0 border border-border/30 shadow-sm"
                  />

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      {item.similarity && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 bg-primary/15 text-primary border-primary/30 shrink-0 font-mono"
                        >
                          {(item.similarity * 100).toFixed(1)}% Match
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {item.episode && <span>Ep {item.episode}</span>}
                      {item.timeRange && (
                        <span className="flex items-center gap-0.5 font-mono">
                          <Clock className="w-3 h-3" />
                          {item.timeRange}
                        </span>
                      )}
                      <span>•</span>
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {item.genres?.slice(0, 3).map((g) => (
                        <span
                          key={g}
                          className="text-[9px] px-1.5 py-0.2 rounded-md bg-muted/60 text-muted-foreground"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(item.id, e)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Delete from history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-16 text-center space-y-3">
                <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto text-primary">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h4 className="text-base font-semibold">No scan records found</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {searchQuery || selectedGenre !== 'All'
                    ? 'No scans match your search filters.'
                    : 'Scanned scenes and identified anime will appear here automatically.'}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/40 text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Clear Scan History?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your saved scan records and search history on this
              device. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Clear Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
