
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
}

export enum Language {
  English = 'English',
  Chinese = 'Chinese',
}

export interface GeneratedContent {
  article: string;
  script: string;
  titles: string;
}

export interface GroundingSource {
  web?: {
    uri: string;
    title: string;
  };
}

export interface StoryboardScene {
  image: string; // base64 data
  text: string;
  audio: string; // base64 data
}