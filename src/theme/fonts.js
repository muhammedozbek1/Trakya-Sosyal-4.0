export const fontFamilies = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

export const fontWeights = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
};

// Font family mapping for easy use in styles
export const typography = {
  // Headings
  h1: { fontFamily: fontFamilies.bold, fontSize: 28, fontWeight: fontWeights.bold, lineHeight: 36 },
  h2: { fontFamily: fontFamilies.bold, fontSize: 24, fontWeight: fontWeights.bold, lineHeight: 32 },
  h3: { fontFamily: fontFamilies.semiBold, fontSize: 20, fontWeight: fontWeights.semiBold, lineHeight: 28 },
  h4: { fontFamily: fontFamilies.semiBold, fontSize: 18, fontWeight: fontWeights.semiBold, lineHeight: 26 },
  h5: { fontFamily: fontFamilies.semiBold, fontSize: 16, fontWeight: fontWeights.semiBold, lineHeight: 24 },
  h6: { fontFamily: fontFamilies.medium, fontSize: 14, fontWeight: fontWeights.medium, lineHeight: 20 },

  // Body text
  bodyLarge: { fontFamily: fontFamilies.regular, fontSize: 16, fontWeight: fontWeights.regular, lineHeight: 24 },
  body: { fontFamily: fontFamilies.regular, fontSize: 14, fontWeight: fontWeights.regular, lineHeight: 20 },
  bodySmall: { fontFamily: fontFamilies.regular, fontSize: 12, fontWeight: fontWeights.regular, lineHeight: 16 },
  bodyXSmall: { fontFamily: fontFamilies.regular, fontSize: 10, fontWeight: fontWeights.regular, lineHeight: 14 },

  // Buttons
  buttonLarge: { fontFamily: fontFamilies.semiBold, fontSize: 16, fontWeight: fontWeights.semiBold, lineHeight: 24 },
  button: { fontFamily: fontFamilies.semiBold, fontSize: 14, fontWeight: fontWeights.semiBold, lineHeight: 20 },
  buttonSmall: { fontFamily: fontFamilies.medium, fontSize: 12, fontWeight: fontWeights.medium, lineHeight: 16 },

  // Labels & Captions
  label: { fontFamily: fontFamilies.medium, fontSize: 12, fontWeight: fontWeights.medium, lineHeight: 16 },
  caption: { fontFamily: fontFamilies.regular, fontSize: 11, fontWeight: fontWeights.regular, lineHeight: 14 },
  overline: { fontFamily: fontFamilies.medium, fontSize: 10, fontWeight: fontWeights.medium, lineHeight: 14, letterSpacing: 0.5 },

  // Special
  code: { fontFamily: fontFamilies.regular, fontSize: 12, fontWeight: fontWeights.regular, lineHeight: 16 },
  price: { fontFamily: fontFamilies.bold, fontSize: 18, fontWeight: fontWeights.bold, lineHeight: 24 },
  number: { fontFamily: fontFamilies.semiBold, fontSize: 16, fontWeight: fontWeights.semiBold, lineHeight: 22 },
};

// Helper to get font family by weight name
export const getFontFamily = (weight) => {
  switch (weight) {
    case 'regular':
    case 400:
      return fontFamilies.regular;
    case 'medium':
    case 500:
      return fontFamilies.medium;
    case 'semiBold':
    case 'semi-bold':
    case 600:
      return fontFamilies.semiBold;
    case 'bold':
    case 700:
      return fontFamilies.bold;
    default:
      return fontFamilies.regular;
  }
};

// Default font family for the app
export const defaultFontFamily = fontFamilies.regular;