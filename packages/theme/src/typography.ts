import { D, pipe } from '@mobily/ts-belt';

import { type NativeFont } from './fontFamilies';
import { type FontWeightValue, fontWeights } from './fontWeights';

export const nativeTypographyStyles = [
    'headline-lg',
    'title-xl',
    'headline-md',
    'headline-sm',
    'body-md-strong',
    'body-md',
    'body-sm-strong',
    'body-sm',
    'body-xs',
] as const;

export const typographyStyles = [...nativeTypographyStyles, 'inherit'] as const;

export type NativeTypographyStyle = (typeof nativeTypographyStyles)[number];
export type TypographyStyle = (typeof typographyStyles)[number];

export type TypographyStyles = Record<TypographyStyle, string>;

type TypographyStyleDefinition = {
    fontSize: number;
    lineHeight: number;
    fontWeight: FontWeightValue;
    letterSpacing: number;
    fontFamily?: string;
};

export type NativeTypographyStyleDefinition = {
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
    fontFamily: string;
};

export type NativeTypographyStyles = Record<TypographyStyle, NativeTypographyStyleDefinition>;

// we need unit-less typography base because RN is unit-less, we can easily add units later
// for web we need string instead of object because styled-components syntax
export const typographyStylesBase: Record<NativeTypographyStyle, TypographyStyleDefinition> = {
    'headline-lg': {
        fontSize: 48,
        lineHeight: 56,
        fontWeight: fontWeights.medium,
        letterSpacing: -1.44,
    },
    'title-xl': {
        fontSize: 34,
        lineHeight: 42,
        fontWeight: fontWeights.medium,
        letterSpacing: -0.85,
    },
    'headline-md': {
        fontSize: 32,
        lineHeight: 40,
        fontWeight: fontWeights.medium,
        letterSpacing: -0.8,
    },
    'headline-sm': {
        fontSize: 22,
        lineHeight: 32,
        fontWeight: fontWeights.medium,
        letterSpacing: -0.4,
    },
    'body-md-strong': {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: fontWeights.semiBold,
        letterSpacing: -0.16,
    },
    'body-md': {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: fontWeights.medium,
        letterSpacing: -0.16,
    },
    'body-sm-strong': {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: fontWeights.semiBold,
        letterSpacing: -0.08,
    },
    'body-sm': {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: fontWeights.medium,
        letterSpacing: -0.08,
    },
    'body-xs': {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: fontWeights.medium,
        letterSpacing: 0,
    },
};

const nativeFontFamilyStyle = {
    'headline-lg': 'TTSatoshi-Medium',
    'title-xl': 'TTSatoshi-Medium',
    'headline-md': 'TTSatoshi-Medium',
    'headline-sm': 'TTSatoshi-Medium',
    'body-md-strong': 'TTSatoshi-DemiBold',
    'body-md': 'TTSatoshi-Medium',
    'body-sm-strong': 'TTSatoshi-DemiBold',
    'body-sm': 'TTSatoshi-Medium',
    'body-xs': 'TTSatoshi-Medium',
} as const satisfies Record<NativeTypographyStyle, NativeFont>;

const prepareTypography = (): TypographyStyles =>
    ({
        ...Object.fromEntries(
            Object.entries(typographyStylesBase).map(([styleName, value]) => [
                styleName,
                `
            font-size: ${value.fontSize}px;
            line-height: ${value.lineHeight}px;
            font-weight: ${value.fontWeight};
            letter-spacing: ${value.letterSpacing}px;
            `,
            ]),
        ),
        inherit: `
            font-size: inherit;
            line-height: inherit;
            font-weight: inherit;
            letter-spacing: inherit;
        `,
    }) as TypographyStyles;

const prepareNativeTypography = (): NativeTypographyStyles =>
    Object.fromEntries(
        Object.entries(typographyStylesBase).map(([styleName, value]) => {
            // Android doesn't support fontWeight
            // For this reason we need to substitute it for a specific font reflecting the weight itself.
            const nativeTypographyStyle = pipe(
                value,
                D.deleteKey('fontWeight'),
                D.set('fontFamily', nativeFontFamilyStyle[styleName as NativeTypographyStyle]),
            );

            return [styleName, nativeTypographyStyle];
        }),
    ) as NativeTypographyStyles;

export const typography: TypographyStyles = prepareTypography();
export const nativeTypography: NativeTypographyStyles = prepareNativeTypography();
