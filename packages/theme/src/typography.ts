import { pipe, D } from '@mobily/ts-belt';

import { NativeFont } from './fontFamilies';
import { fontWeights, FontWeightValue } from './fontWeights';

export const typographyStyles = [
    'titleLarge',
    'titleMedium',
    'titleSmall',
    'highlight',
    'body',
    'callout',
    'hint',
    'label',
] as const;

export type TypographyStyle = (typeof typographyStyles)[number];

export type TypographyStyles = Record<TypographyStyle, string>;

type TypographyStyleDefinition = {
    fontSize: number;
    lineHeight: number;
    fontWeight: FontWeightValue;
    fontFamily?: string;
};

export type NativeTypographyStyleDefinition = {
    fontSize: number;
    lineHeight: number;
    fontFamily: string;
};

export type NativeTypographyStyles = Record<TypographyStyle, NativeTypographyStyleDefinition>;

// we need unit-less typography base because RN is unit-less, we can easily add units later
// for web we need string instead of object because styled-components syntax
export const typographyStylesBase: Record<TypographyStyle, TypographyStyleDefinition> = {
    titleLarge: {
        fontSize: 48,
        lineHeight: 53,
        fontWeight: fontWeights.medium,
    },
    titleMedium: {
        fontSize: 34,
        lineHeight: 37,
        fontWeight: fontWeights.medium,
    },
    titleSmall: {
        fontSize: 22,
        lineHeight: 32,
        fontWeight: fontWeights.medium,
    },
    highlight: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: fontWeights.semiBold,
    },
    body: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: fontWeights.medium,
    },
    callout: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: fontWeights.semiBold,
    },
    hint: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: fontWeights.medium,
    },
    label: {
        fontSize: 12,
        lineHeight: 18,
        fontWeight: fontWeights.medium,
    },
};

const nativeFontFamilyStyle = {
    titleLarge: 'TTSatoshi-Medium',
    titleMedium: 'TTSatoshi-Medium',
    titleSmall: 'TTSatoshi-Medium',
    highlight: 'TTSatoshi-DemiBold',
    body: 'TTSatoshi-Medium',
    callout: 'TTSatoshi-DemiBold',
    hint: 'TTSatoshi-Medium',
    label: 'TTSatoshi-Medium',
} as const satisfies Record<TypographyStyle, NativeFont>;

const prepareTypography = (): TypographyStyles =>
    Object.fromEntries(
        Object.entries(typographyStylesBase).map(([styleName, value]) => [
            styleName,
            `
            font-size: ${value.fontSize}px;
            line-height: ${value.lineHeight}px;
            font-weight: ${value.fontWeight};
            `,
        ]),
    ) as TypographyStyles;

const prepareNativeTypography = (): NativeTypographyStyles =>
    Object.fromEntries(
        Object.entries(typographyStylesBase).map(([styleName, value]) => {
            // Android doesn't support fontWeight
            // For this reason we need to substitute it for a specific font reflecting the weight itself.
            const nativeTypographyStyle = pipe(
                value,
                D.deleteKey('fontWeight'),
                D.set('fontFamily', nativeFontFamilyStyle[styleName as TypographyStyle]),
            );

            return [styleName, nativeTypographyStyle];
        }),
    ) as NativeTypographyStyles;

export const typography: TypographyStyles = prepareTypography();
export const nativeTypography: NativeTypographyStyles = prepareNativeTypography();
