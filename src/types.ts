export interface TranslationPair {
  arabic: string;
  english: string;
  numberPronunciation?: string;
}

export interface ProcessingResult {
  title?: string;
  author?: string;
  content: TranslationPair[];
  currentPage: number;
  hasMore: boolean;
}
