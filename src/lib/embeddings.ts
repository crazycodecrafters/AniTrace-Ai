// Client-Side AI Embeddings and Vector Similarity Engine
import localforage from 'localforage';
import { ANIME_GENRES, AniListMedia } from './anilist';

const embeddingsStore = localforage.createInstance({
  name: 'AniTraceAI',
  storeName: 'embeddings_cache',
});

// Vocabulary of top anime tags for vector representation
export const ANIME_TAG_VOCAB = [
  'Magic', 'Superpowers', 'School', 'Isekai', 'Demons', 'Military', 'Time Travel',
  'Martial Arts', 'Space', 'Mecha', 'Psychological', 'Vampire', 'Monsters', 'Mythology',
  'Gods', 'Cyberpunk', 'Post-Apocalyptic', 'Time Loop', 'Swordplay', 'Gore', 'Tragedy',
  'Coming of Age', 'Historical', 'Crime', 'Detective', 'Survival', 'Gaming', 'Music',
  'Revenge', 'Philosophy', 'Family Life', 'Friendship', 'Parody', 'Idol', 'Cultivation',
  'Assassins', 'Royalty', 'Aliens', 'Robots', 'Steampunk', 'Dystopian', 'Female Protagonist',
  'Male Protagonist', 'Anti-Hero', 'Ensemble Cast', 'Shounen', 'Seinen', 'Shoujo', 'Josei'
];

/**
 * Creates a normalized feature embedding vector from AniList media metadata
 * Vector dimensions:
 * - Genres: ANIME_GENRES.length (18 dims)
 * - Tags: ANIME_TAG_VOCAB.length (48 dims)
 * - Score: 1 dim (0-1)
 * - Popularity: 1 dim (log scale)
 * - Format: 6 dims
 */
export function createMediaEmbedding(media: Partial<AniListMedia>): Float32Array {
  const genreDim = ANIME_GENRES.length;
  const tagDim = ANIME_TAG_VOCAB.length;
  const formatDim = 6;
  const metaDim = 2; // score, popularity
  const totalDim = genreDim + tagDim + formatDim + metaDim;

  const vector = new Float32Array(totalDim);
  let offset = 0;

  // 1. Genres (weighted)
  if (media.genres) {
    media.genres.forEach((genre) => {
      const idx = ANIME_GENRES.indexOf(genre);
      if (idx !== -1) {
        vector[offset + idx] = 1.5; // High weight for core genres
      }
    });
  }
  offset += genreDim;

  // 2. Tags (weighted by rank if available)
  if (media.tags) {
    media.tags.forEach((tag) => {
      const idx = ANIME_TAG_VOCAB.findIndex(t => t.toLowerCase() === tag.name.toLowerCase());
      if (idx !== -1) {
        const weight = (tag.rank ? tag.rank / 100 : 0.8);
        vector[offset + idx] = weight * 1.2;
      }
    });
  }
  offset += tagDim;

  // 3. Format One-Hot
  const formats = ['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA'];
  if (media.format) {
    const fIdx = formats.indexOf(media.format);
    if (fIdx !== -1) {
      vector[offset + fIdx] = 1.0;
    }
  }
  offset += formatDim;

  // 4. Normalized score
  if (media.averageScore) {
    vector[offset] = media.averageScore / 100;
  }
  // Normalized popularity
  if (media.popularity) {
    vector[offset + 1] = Math.min(Math.log10(media.popularity + 1) / 6, 1.0);
  }

  // Normalize to unit vector for fast dot-product cosine similarity
  return normalizeVector(vector);
}

/**
 * Extracts a color histogram & luminance vector from an image element or canvas (32 dimensions)
 */
export async function extractImageColorEmbedding(imageSrc: string | HTMLImageElement): Promise<Float32Array> {
  return new Promise((resolve) => {
    const img = typeof imageSrc === 'string' ? new Image() : imageSrc;
    if (typeof imageSrc === 'string') {
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;
    }

    const onComplete = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 32;
        canvas.width = size;
        canvas.height = size;

        if (!ctx) {
          resolve(new Float32Array(32));
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        // 32-bin color histogram (8 bins R, 8 bins G, 8 bins B, 8 bins Luminance)
        const hist = new Float32Array(32);
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          hist[Math.floor(r / 32)] += 1;
          hist[8 + Math.floor(g / 32)] += 1;
          hist[16 + Math.floor(b / 32)] += 1;
          hist[24 + Math.floor(lum / 32)] += 1;
        }

        resolve(normalizeVector(hist));
      } catch (err) {
        console.warn('Could not extract image embedding due to CORS/canvas restrictions', err);
        resolve(new Float32Array(32));
      }
    };

    if (img.complete && img.naturalWidth !== 0) {
      onComplete();
    } else {
      img.onload = () => onComplete();
      img.onerror = () => resolve(new Float32Array(32));
    }
  });
}

/**
 * Cosine similarity between two float vectors: dot(a, b) / (||a|| * ||b||)
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (!a || !b || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return Math.max(0, Math.min(1, dot / (Math.sqrt(normA) * Math.sqrt(normB))));
}

/**
 * Normalize vector in-place to unit length
 */
export function normalizeVector(vec: Float32Array): Float32Array {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < vec.length; i++) {
      vec[i] /= norm;
    }
  }
  return vec;
}

/**
 * Store embedding vector in local storage
 */
export async function cacheMediaEmbedding(id: number, vector: Float32Array): Promise<void> {
  try {
    await embeddingsStore.setItem(`media_${id}`, Array.from(vector));
  } catch (err) {
    console.error('Error caching embedding:', err);
  }
}

/**
 * Retrieve cached embedding
 */
export async function getCachedMediaEmbedding(id: number): Promise<Float32Array | null> {
  try {
    const data = await embeddingsStore.getItem<number[]>(`media_${id}`);
    if (data) {
      return new Float32Array(data);
    }
    return null;
  } catch {
    return null;
  }
}

export interface RecommendationMatch {
  media: AniListMedia;
  similarityScore: number;
  matchPercentage: number;
  matchReasons: string[];
}

/**
 * Rank candidate anime against a target anime using hybrid vector similarity & tag overlap
 */
export function rankSimilarAnime(
  target: AniListMedia,
  candidates: AniListMedia[],
  topK = 8
): RecommendationMatch[] {
  const targetVector = createMediaEmbedding(target);

  const scoredList: RecommendationMatch[] = candidates
    .filter((candidate) => candidate.id !== target.id)
    .map((candidate) => {
      const candidateVector = createMediaEmbedding(candidate);
      const similarity = cosineSimilarity(targetVector, candidateVector);

      // Find shared genres & tags for explanation
      const sharedGenres = (target.genres || []).filter((g) =>
        (candidate.genres || []).includes(g)
      );

      const targetTagNames = (target.tags || []).map((t) => t.name.toLowerCase());
      const sharedTags = (candidate.tags || [])
        .filter((t) => targetTagNames.includes(t.name.toLowerCase()))
        .map((t) => t.name);

      const matchReasons: string[] = [];
      if (sharedGenres.length > 0) {
        matchReasons.push(`Shared: ${sharedGenres.slice(0, 3).join(', ')}`);
      }
      if (sharedTags.length > 0) {
        matchReasons.push(`Themes: ${sharedTags.slice(0, 2).join(', ')}`);
      }
      if (target.format && candidate.format && target.format === candidate.format) {
        matchReasons.push(`${target.format} format`);
      }

      // Convert similarity to a 0-100 percentage
      const matchPercentage = Math.round(similarity * 100);

      return {
        media: candidate,
        similarityScore: similarity,
        matchPercentage,
        matchReasons,
      };
    });

  // Sort descending by similarity score
  return scoredList.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, topK);
}
