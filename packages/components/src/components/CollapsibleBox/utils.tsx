import { spacingsPx, TypographyStyle } from '@trezor/theme';
import { HeadingSize, PaddingType } from './types';
import { IconSize } from '../Icon/Icon';

type PaddingMapArgs = {
    $paddingType: PaddingType;
};

type SizeMapArgs = {
    $headingSize: HeadingSize;
};

export const mapPaddingTypeToHeaderPadding = ({ $paddingType }: PaddingMapArgs): string => {
    const paddingMap: Record<PaddingType, string> = {
        none: '0',
        normal: `${spacingsPx.sm} ${spacingsPx.md}`,
        large: `${spacingsPx.md} ${spacingsPx.xl}`,
    };

    return paddingMap[$paddingType];
};

export const mapPaddingTypeToContentPadding = ({ $paddingType }: PaddingMapArgs): string => {
    const paddingMap: Record<PaddingType, string> = {
        none: `${spacingsPx.sm} 0 0`,
        normal: `${spacingsPx.lg} ${spacingsPx.md}`,
        large: `${spacingsPx.xl}`,
    };

    return paddingMap[$paddingType];
};

export const mapSizeToHeadingTypography = ({ $headingSize }: SizeMapArgs): TypographyStyle => {
    const typographyMap: Record<HeadingSize, TypographyStyle> = {
        small: 'label',
        medium: 'hint',
        large: 'body',
    };

    return typographyMap[$headingSize];
};

export const mapSizeToSubheadingTypography = ({ $headingSize }: SizeMapArgs): TypographyStyle => {
    const typographyMap: Record<HeadingSize, TypographyStyle> = {
        small: 'label',
        medium: 'hint',
        large: 'hint',
    };

    return typographyMap[$headingSize];
};

export const mapSizeToIconSize = ({ $headingSize }: SizeMapArgs): IconSize => {
    const sizeMap: Record<HeadingSize, IconSize> = {
        small: 'small',
        medium: 'medium',
        large: 'medium',
    };

    return sizeMap[$headingSize];
};
