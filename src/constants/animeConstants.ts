/**
 * Global Constants for AniTrace AI
 */

export const ANIME_GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Ecchi',
  'Fantasy',
  'Horror',
  'Mahou Shoujo',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
] as const;

export const ANIME_FORMATS = [
  { value: 'TV', label: 'TV Series' },
  { value: 'MOVIE', label: 'Movie' },
  { value: 'OVA', label: 'OVA' },
  { value: 'ONA', label: 'ONA (Web)' },
  { value: 'SPECIAL', label: 'Special' },
  { value: 'TV_SHORT', label: 'TV Short' },
] as const;

export const ANIME_STATUSES = [
  { value: 'RELEASING', label: 'Airing Now' },
  { value: 'FINISHED', label: 'Finished' },
  { value: 'NOT_YET_RELEASED', label: 'Upcoming' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

export const ANIME_SORT_OPTIONS = [
  { value: 'POPULARITY_DESC', label: 'Most Popular' },
  { value: 'SCORE_DESC', label: 'Highest Rated' },
  { value: 'TRENDING_DESC', label: 'Trending Now' },
  { value: 'START_DATE_DESC', label: 'Newest First' },
  { value: 'TITLE_ROMAJI', label: 'Title (A-Z)' },
] as const;

export const DEFAULT_ENDPOINTS = {
  TRACE_MOE_API: 'https://api.trace.moe/search',
  ANILIST_GRAPHQL: 'https://graphql.anilist.co',
  CORS_PROXY: 'https://corsproxy.io/?url=',
} as const;
