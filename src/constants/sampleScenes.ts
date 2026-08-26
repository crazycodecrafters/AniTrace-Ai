/**
 * Curated High-Definition Sample Anime Scenes for testing and quick start.
 */

export interface SampleScene {
  title: string;
  subtitle: string;
  url: string;
  anilistId: number;
  fallbackQuery: string;
}

export const SAMPLE_SCENES: SampleScene[] = [
  {
    title: 'Frieren',
    subtitle: "Beyond Journey's End",
    url: 'https://images.weserv.nl/?url=https://raw.githubusercontent.com/crazycodecrafters/AniTrace-Ai/main/public/samples/frieren.jpg&w=600&output=webp',
    anilistId: 154587,
    fallbackQuery: 'Sousou no Frieren',
  },
  {
    title: 'Demon Slayer',
    subtitle: 'Kimetsu no Yaiba',
    url: 'https://images.weserv.nl/?url=https://raw.githubusercontent.com/crazycodecrafters/AniTrace-Ai/main/public/samples/demonslayer.jpg&w=600&output=webp',
    anilistId: 101922,
    fallbackQuery: 'Kimetsu no Yaiba',
  },
  {
    title: 'Jujutsu Kaisen',
    subtitle: 'Shibuya Incident',
    url: 'https://images.weserv.nl/?url=https://raw.githubusercontent.com/crazycodecrafters/AniTrace-Ai/main/public/samples/jjk.jpg&w=600&output=webp',
    anilistId: 145064,
    fallbackQuery: 'Jujutsu Kaisen',
  },
  {
    title: 'Attack on Titan',
    subtitle: 'The Final Season',
    url: 'https://images.weserv.nl/?url=https://raw.githubusercontent.com/crazycodecrafters/AniTrace-Ai/main/public/samples/aot.jpg&w=600&output=webp',
    anilistId: 110277,
    fallbackQuery: 'Shingeki no Kyojin',
  },
];
