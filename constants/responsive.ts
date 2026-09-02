// Powered by OnSpace.AI
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const screen = { width, height };

export const isTablet = width >= 600;
export const isDesktop = width >= 1024;

// Column counts
export const numColumns = isTablet ? 2 : 1;

// Responsive spacing multiplier
export const spacingScale = isTablet ? 1.25 : 1;

// Content max-width for tablet
export const contentMaxWidth = isDesktop ? 960 : isTablet ? 720 : undefined;

// Responsive font scale
export const fontScale = isTablet ? 1.1 : 1;

// Responsive padding
export const pagePadding = isTablet ? 24 : 16;

// Card column width (for 2-column layouts on tablet)
export function getCardWidth(columns: number = numColumns, gap: number = 16, padding: number = pagePadding) {
  const totalGap = (columns - 1) * gap;
  const availableWidth = Math.min(screen.width, contentMaxWidth || screen.width) - padding * 2;
  return (availableWidth - totalGap) / columns;
}
