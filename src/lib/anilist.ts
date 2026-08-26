// AniList GraphQL API Client for Search, Metadata, and Discovery

export interface AniListMedia {
  id: number;
  idMal?: number;
  title: {
    romaji: string;
    english?: string | null;
    native?: string | null;
  };
  coverImage: {
    extraLarge?: string;
    large: string;
    medium?: string;
    color?: string;
  };
  bannerImage?: string | null;
  description?: string | null;
  format?: 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC' | 'MANGA' | 'NOVEL' | 'ONE_SHOT';
  status?: 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';
  season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
  seasonYear?: number;
  episodes?: number | null;
  duration?: number | null;
  genres: string[];
  tags?: Array<{
    id: number;
    name: string;
    rank?: number;
    isMediaSpoiler?: boolean;
  }>;
  averageScore?: number | null;
  meanScore?: number | null;
  popularity?: number;
  favourites?: number;
  source?: string;
  studios?: {
    nodes: Array<{
      id: number;
      name: string;
      isAnimationStudio: boolean;
    }>;
  };
  trailer?: {
    id: string;
    site: string;
    thumbnail?: string;
  } | null;
  nextAiringEpisode?: {
    episode: number;
    timeUntilAiring: number;
  } | null;
  characters?: {
    edges: Array<{
      role: string;
      node: {
        id: number;
        name: {
          full: string;
          native?: string;
        };
        image?: {
          medium?: string;
          large?: string;
        };
      };
      voiceActors?: Array<{
        id: number;
        name: {
          full: string;
        };
        languageV2?: string;
        image?: {
          medium?: string;
        };
      }>;
    }>;
  };
  externalLinks?: Array<{
    id: number;
    url: string;
    site: string;
    icon?: string;
    color?: string;
  }>;
  relations?: {
    edges: Array<{
      relationType: string;
      node: {
        id: number;
        title: {
          romaji: string;
          english?: string;
        };
        coverImage: {
          medium?: string;
          large?: string;
        };
        format?: string;
        type: string;
      };
    }>;
  };
}

export interface SearchOptions {
  query?: string;
  page?: number;
  perPage?: number;
  genres?: string[];
  format?: string;
  season?: string;
  seasonYear?: number;
  status?: string;
  minScore?: number;
  sort?: Array<'POPULARITY_DESC' | 'SCORE_DESC' | 'TRENDING_DESC' | 'START_DATE_DESC' | 'TITLE_ROMAJI' | 'FAVOURITES_DESC'>;
}

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

async function fetchAniListGraphQL<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const response = await fetch(ANILIST_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AniList API error (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message || 'Error fetching AniList data');
  }

  return json.data;
}

const FULL_MEDIA_FIELDS = `
  id
  idMal
  title {
    romaji
    english
    native
  }
  coverImage {
    extraLarge
    large
    medium
    color
  }
  bannerImage
  description
  format
  status
  season
  seasonYear
  episodes
  duration
  genres
  tags {
    id
    name
    rank
    isMediaSpoiler
  }
  averageScore
  meanScore
  popularity
  favourites
  source
  studios(isMain: true) {
    nodes {
      id
      name
      isAnimationStudio
    }
  }
  trailer {
    id
    site
    thumbnail
  }
  nextAiringEpisode {
    episode
    timeUntilAiring
  }
  characters(sort: ROLE, perPage: 6) {
    edges {
      role
      node {
        id
        name {
          full
          native
        }
        image {
          medium
          large
        }
      }
      voiceActors(language: JAPANESE, sort: RELEVANCE) {
        id
        name {
          full
        }
        languageV2
        image {
          medium
        }
      }
    }
  }
  externalLinks {
    id
    url
    site
    icon
    color
  }
  relations {
    edges {
      relationType
      node {
        id
        title {
          romaji
          english
        }
        coverImage {
          medium
          large
        }
        format
        type
      }
    }
  }
`;

/**
 * Search anime with full text search & granular filtering options
 */
export async function searchAnime(options: SearchOptions = {}): Promise<{
  media: AniListMedia[];
  pageInfo: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    hasNextPage: boolean;
  };
}> {
  const {
    query,
    page = 1,
    perPage = 18,
    genres,
    format,
    season,
    seasonYear,
    status,
    minScore,
    sort = ['POPULARITY_DESC'],
  } = options;

  const graphQLQuery = `
    query (
      $page: Int,
      $perPage: Int,
      $search: String,
      $genre_in: [String],
      $format: MediaFormat,
      $season: MediaSeason,
      $seasonYear: Int,
      $status: MediaStatus,
      $averageScore_greater: Int,
      $sort: [MediaSort]
    ) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          perPage
          currentPage
          lastPage
          hasNextPage
        }
        media(
          search: $search,
          genre_in: $genre_in,
          format: $format,
          season: $season,
          seasonYear: $seasonYear,
          status: $status,
          averageScore_greater: $averageScore_greater,
          sort: $sort,
          type: ANIME,
          isAdult: false
        ) {
          ${FULL_MEDIA_FIELDS}
        }
      }
    }
  `;

  const variables: Record<string, any> = {
    page,
    perPage,
    sort,
  };

  if (query && query.trim()) variables.search = query.trim();
  if (genres && genres.length > 0) variables.genre_in = genres;
  if (format) variables.format = format;
  if (season) variables.season = season;
  if (seasonYear) variables.seasonYear = seasonYear;
  if (status) variables.status = status;
  if (minScore && minScore > 0) variables.averageScore_greater = minScore;

  const data = await fetchAniListGraphQL<{
    Page: {
      pageInfo: {
        total: number;
        perPage: number;
        currentPage: number;
        lastPage: number;
        hasNextPage: boolean;
      };
      media: AniListMedia[];
    };
  }>(graphQLQuery, variables);

  return {
    media: data.Page.media || [],
    pageInfo: data.Page.pageInfo,
  };
}

/**
 * Fetch detailed info for a single anime by AniList ID
 */
export async function getAnimeById(id: number): Promise<AniListMedia | null> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${FULL_MEDIA_FIELDS}
      }
    }
  `;

  try {
    const data = await fetchAniListGraphQL<{ Media: AniListMedia }>(query, { id });
    return data.Media;
  } catch (error) {
    console.error(`Failed to fetch anime #${id}:`, error);
    return null;
  }
}

/**
 * Fetch trending anime right now
 */
export async function getTrendingAnime(perPage = 12): Promise<AniListMedia[]> {
  const query = `
    query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          ${FULL_MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await fetchAniListGraphQL<{ Page: { media: AniListMedia[] } }>(query, { perPage });
  return data.Page.media || [];
}

/**
 * Fetch top rated anime of all time
 */
export async function getTopRatedAnime(perPage = 12): Promise<AniListMedia[]> {
  const query = `
    query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(sort: SCORE_DESC, type: ANIME, isAdult: false) {
          ${FULL_MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await fetchAniListGraphQL<{ Page: { media: AniListMedia[] } }>(query, { perPage });
  return data.Page.media || [];
}

/**
 * Fetch currently airing popular shows this season
 */
export async function getSeasonalAnime(perPage = 12): Promise<AniListMedia[]> {
  const date = new Date();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  let currentSeason: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' = 'WINTER';
  if (month >= 3 && month <= 5) currentSeason = 'SPRING';
  else if (month >= 6 && month <= 8) currentSeason = 'SUMMER';
  else if (month >= 9 && month <= 11) currentSeason = 'FALL';

  const query = `
    query ($season: MediaSeason, $seasonYear: Int, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          ${FULL_MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await fetchAniListGraphQL<{ Page: { media: AniListMedia[] } }>(query, {
    season: currentSeason,
    seasonYear: year,
    perPage,
  });
  return data.Page.media || [];
}

/**
 * Standard Anime Genres list on AniList
 */
export const ANIME_GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Ecchi',
  'Fantasy',
  'Hentai',
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
].filter(g => g !== 'Hentai'); // SFW filter

export const ANIME_FORMATS = [
  { value: 'TV', label: 'TV Series' },
  { value: 'TV_SHORT', label: 'TV Short' },
  { value: 'MOVIE', label: 'Movie' },
  { value: 'SPECIAL', label: 'Special' },
  { value: 'OVA', label: 'OVA' },
  { value: 'ONA', label: 'ONA (Web)' },
];

export const ANIME_STATUSES = [
  { value: 'RELEASING', label: 'Airing Now' },
  { value: 'FINISHED', label: 'Completed' },
  { value: 'NOT_YET_RELEASED', label: 'Upcoming' },
];

export const ANIME_SORT_OPTIONS = [
  { value: 'POPULARITY_DESC', label: 'Most Popular' },
  { value: 'SCORE_DESC', label: 'Highest Rated' },
  { value: 'TRENDING_DESC', label: 'Trending' },
  { value: 'FAVOURITES_DESC', label: 'Most Favorited' },
  { value: 'START_DATE_DESC', label: 'Recently Released' },
  { value: 'TITLE_ROMAJI', label: 'Title (A-Z)' },
];
