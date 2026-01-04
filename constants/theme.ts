import { Platform } from "react-native";

const primaryGreen = "#4CAF50";
const warmGold = "#F9A825";

export const Colors = {
  light: {
    text: "#2C3E50",
    textSecondary: "#7F8C8D",
    buttonText: "#FFFFFF",
    tabIconDefault: "#7F8C8D",
    tabIconSelected: primaryGreen,
    link: primaryGreen,
    primary: primaryGreen,
    secondary: warmGold,
    backgroundRoot: "#FAF9F6",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#E8F4F8",
    backgroundTertiary: "#F0F0F0",
    surface: "#FFFFFF",
    positive: primaryGreen,
    warning: warmGold,
    danger: "#E74C3C",
    drawingSage: "#A8BBA6",
    drawingLavender: "#B8A8D6",
    drawingCoral: "#F08080",
    drawingSky: "#87CEEB",
    drawingCharcoal: "#2C3E50",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: primaryGreen,
    link: primaryGreen,
    primary: primaryGreen,
    secondary: warmGold,
    backgroundRoot: "#1F2123",
    backgroundDefault: "#2A2C2E",
    backgroundSecondary: "#353739",
    backgroundTertiary: "#404244",
    surface: "#2A2C2E",
    positive: primaryGreen,
    warning: warmGold,
    danger: "#E74C3C",
    drawingSage: "#A8BBA6",
    drawingLavender: "#B8A8D6",
    drawingCoral: "#F08080",
    drawingSky: "#87CEEB",
    drawingCharcoal: "#2C3E50",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 56,
  buttonHeight: 52,
  minTouchTarget: 44,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: "700" as const,
  },
  title: {
    fontSize: 28,
    fontWeight: "600" as const,
  },
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 17,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 13,
    fontWeight: "400" as const,
  },
  currency: {
    fontSize: 20,
    fontWeight: "500" as const,
  },
  link: {
    fontSize: 17,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Shadows = {
  card: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowColor: "#000000",
    elevation: 3,
  },
  floating: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowColor: "#000000",
    elevation: 6,
  },
  subtle: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowColor: "#000000",
    elevation: 1,
  },
};
