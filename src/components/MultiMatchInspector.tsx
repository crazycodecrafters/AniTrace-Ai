import React from 'react';
import { motion } from 'framer-motion';
import { Layers, CheckCircle2, Video, Clock } from 'lucide-react';
import { TraceCandidate } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';

interface MultiMatchInspectorProps {
  candidates: TraceCandidate[];
  selectedCandidate: TraceCandidate | null;
  onSelectCandidate: (candidate: TraceCandidate) => void;
}

export const MultiMatchInspector: React.FC<MultiMatchInspectorProps> = ({
  candidates,
  selectedCandidate,
  onSelectCandidate,
}) => {
  if (!candidates || candidates.length <= 1) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getConfidenceBadge = (similarity: number) => {
    const pct = (similarity * 100).toFixed(1);
    if (similarity >= 0.9) {
      return {
        label: `${pct}% Match`,
        sub: 'High Confidence',
        className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      };
    } else if (similarity >= 0.8) {
      return {
        label: `${pct}% Match`,
        sub: 'Likely Match',
        className: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      };
    } else {
      return {
        label: `${pct}% Match`,
        sub: 'Possible Match',
        className: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 sm:p-5 rounded-2xl space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              Candidate Scene Matches ({candidates.length})
            </h4>
            <p className="text-xs text-muted-foreground">
              Multiple matching frames detected. Select a candidate to inspect.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
        {candidates.map((cand, idx) => {
          const isSelected =
            selectedCandidate &&
            selectedCandidate.filename === cand.filename &&
            selectedCandidate.from === cand.from;
          const conf = getConfidenceBadge(cand.similarity);

          return (
            <motion.button
              key={`${cand.anilist}_${cand.filename}_${cand.from}_${idx}`}
              onClick={() => onSelectCandidate(cand)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-3 p-2.5 rounded-xl text-left transition-all border ${
                isSelected
                  ? 'bg-primary/20 border-primary shadow-lg ring-1 ring-primary/50'
                  : 'bg-card/40 border-border/30 hover:border-primary/40 hover:bg-card/70'
              }`}
            >
              {/* Thumbnail */}
              <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                {cand.image ? (
                  <img
                    src={cand.image}
                    alt={`Match ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${conf.className}`}>
                    {conf.label}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {formatTime(cand.from)}
                  </span>
                </div>
                <p className="text-xs font-semibold truncate mt-1 text-foreground">
                  {cand.episode ? `Episode ${cand.episode}` : 'Feature / Movie'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate font-mono">
                  {cand.filename.replace(/\.[^/.]+$/, '')}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
