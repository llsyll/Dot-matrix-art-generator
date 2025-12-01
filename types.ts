
export enum DitherMethod {
  THRESHOLD = 'Threshold',
  RANDOM = 'Random (Noise)',
  FLOYD_STEINBERG = 'Floyd-Steinberg',
  ATKINSON = 'Atkinson',
  STUCKI = 'Stucki',
  SIERRA_LITE = 'Sierra Lite',
  BAYER_4x4 = 'Bayer 4x4',
  BAYER_8x8 = 'Bayer 8x8',
  HALFTONE = 'Halftone'
}

export enum DotShape {
  SQUARE = 'Square',
  CIRCLE = 'Circle',
  DIAMOND = 'Diamond',
  TRIANGLE = 'Triangle',
  CROSS = 'Cross',
  PLUS = 'Plus',
  HEART = 'Heart',
  STAR = 'Star',
  ASCII = 'ASCII'
}

export interface AppSettings {
  pixelSize: number; // The size of the "dot"
  contrast: number; // 0 to 2
  brightness: number; // -1 to 1
  ditherMethod: DitherMethod;
  dotShape: DotShape;
  inverted: boolean;
  foregroundColor: string;
  backgroundColor: string;
  transparentBackground: boolean;
  inkBleed: number; // New: 0 to ~20px blur radius for metaball effect
  
  // Dimensions
  outputWidth: number; 
  outputHeight: number;
  gap: number; // Gap between dots

  // Text Overlay
  showText: boolean;
  text: string;
  fontFamily: string; // New: Font selection
  textSize: number; // Font size in px (relative to final output)
  textX: number; // X position in px
  textY: number; // Y position in px
  textDark: boolean; // True = dark text, False = light text
}

export const DEFAULT_SETTINGS: AppSettings = {
  pixelSize: 6,
  contrast: 1.1,
  brightness: 0,
  ditherMethod: DitherMethod.FLOYD_STEINBERG,
  dotShape: DotShape.CIRCLE,
  inverted: false,
  foregroundColor: '#1f2937', // Dark gray
  backgroundColor: '#f3f4f6', // Light gray/white
  transparentBackground: false,
  inkBleed: 0, // Default no bleed
  outputWidth: 384,
  outputHeight: 500, // Default slightly taller
  gap: 1,

  showText: false,
  text: "示例文本\nSAMPLE",
  fontFamily: 'Space Mono',
  textSize: 40,
  textX: 20,
  textY: 60,
  textDark: true
};
