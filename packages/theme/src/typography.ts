import { nativeFontFamilies } from './fontFamilies';

export const fontWeights = {
    medium: 400,
    demi: 600,
} as const;

export type FontWeight = keyof typeof fontWeights;
export type FontWeightValue = typeof fontWeights[FontWeight];

// we need unit-less typography base because RN is unit-less, we can easily add units later
// for web we need string instead of object because styled-components syntax
export const typographyStylesBase = {
    largeTitle: {
        fontSize: 48,
        lineHeight: 53,
        fontWeight: fontWeights.medium,
        letterSpacing: 0.4,
    },
    mediumTitle: {
        fontSize: 34,
        lineHeight: 37,
        fontWeight: fontWeights.medium,
        letterSpacing: -1.4,
    },
    smallTitle: {
        fontSize: 22,
        lineHeight: 26,
        fontWeight: fontWeights.medium,
        letterSpacing: -0.3,
    },
    highlight: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: fontWeights.demi,
        letterSpacing: -0.4,
    },
    body: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: fontWeights.medium,
        letterSpacing: -0.4,
    },
    callout: {
        fontSize: 14,
        lineHeight: 21,
        fontWeight: fontWeights.demi,
        letterSpacing: -0.3,
    },
    hint: {
        fontSize: 14,
        lineHeight: 21,
        fontWeight: fontWeights.medium,
        letterSpacing: -0.3,
    },
    label: {
        fontSize: 12,
        lineHeight: 18,
        fontWeight: fontWeights.medium,
        letterSpacing: -0.1,
    },
} as const;

export type TypographyStyle = keyof typeof typographyStylesBase;
export type TypographyStyles = Record<TypographyStyle, string>;
export type NativeTypographyStyleDefinition = {
    fontSize: number;
    lineHeight: number;
    fontWeight: FontWeightValue;
    letterSpacing: number;
    fontFamily?: string;
};
export type NativeTypographyStyles = Record<TypographyStyle, NativeTypographyStyleDefinition>;

const prepareTypography = (): TypographyStyles =>
    Object.fromEntries(
        Object.entries(typographyStylesBase).map(([styleName, value]) => [
            styleName,
            `
            font-size: ${value.fontSize}px;
            line-height: ${value.lineHeight}px;
            font-weight: ${value.fontWeight};
            letter-spacing: ${value.letterSpacing}px;
            font-family: ${fontFamilies.base}
            `,
        ]),
    ) as TypographyStyles;

const prepareNativeTypography = (): NativeTypographyStyles =>
    Object.fromEntries(
        Object.entries(typographyStylesBase).map(([styleName, value]) => [
            styleName,
            // in React Native we need to define fontFamily everytime
            // https://reactnative.dev/docs/text#limited-style-inheritance
            { ...value, fontFamily: nativeFontFamilies.base },
        ]),
    ) as NativeTypographyStyles;

export const typography: TypographyStyles = prepareTypography();
export const nativeTypography: NativeTypographyStyles = prepareNativeTypography();
