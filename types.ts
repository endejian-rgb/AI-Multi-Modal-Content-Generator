
export enum Style {
  Informational = 'Informational',
  Personal = 'Personal Experience',
  Entertainment = 'Entertainment',
  Professional = 'Professional / Business',
  Technical = 'Technical Deep Dive',
}

export enum OutputTab {
  Article = 'Article',
  Script = 'Script',
  Titles = 'Titles & Tags',
  Storyboard = 'Storyboard',
}

export enum AspectRatio {
  SixteenNine = '16:9',
  NineSixteen = '9:16',
  OneOne = '1:1',
  FourThree = '4:3',
  ThreeFour = '3:4',
}

export enum Language {
  English = 'English',
  Chinese = 'Chinese',
}

export enum Voice {
  Kore = 'Kore',
  Puck = 'Puck',
  Charon = 'Charon',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
}

export enum ComplianceProfile {
    Standard = 'Standard (Global)',
    COPPA = 'COPPA (US Children\'s Online Privacy)',
    GDPR = 'GDPR (EU Data Privacy)',
    Healthcare = 'Healthcare (HIPAA-focused)',
}

export enum ImageQuality {
  Standard = 'Standard',
  HD = 'HD',
}

export enum ImageStyle {
  None = 'None (Default)',
  Photorealistic = 'Photorealistic',
  Cartoon = 'Cartoon',
  Abstract = 'Abstract',
  Anime = 'Anime / Manga',
  Fantasy = 'Fantasy Art',
}

export interface GeneratedContent {
  article: string;
  script: string;
  titles: string;
}

export interface GroundingSource {
  web?: {
    uri: string;
    title:string;
  };
}

export interface StoryboardScene {
  image: string; // base64 data
  text: string;
  audio: string; // base64 data
}

// Types for Text-to-Infographic feature
export interface InfographicModule {
  name: string;
  type: string;
  bullets: string[];
}

export interface InfographicData {
  title: string;
  modules: InfographicModule[];
  summary: string;
}

export interface InfographicGenerationResponse {
  modularSummary: string;
  structuredJSON: InfographicData;
  infographicScript: string;
}

export interface SeoAnalysisResult {
    keywordDifficulty: number; // A score from 0 to 100
    searchVolumeTrend: 'Rising' | 'Stable' | 'Falling';
    competitorAnalysis: string; // A paragraph of text
    contentStrategy: string; // A paragraph of actionable advice
}