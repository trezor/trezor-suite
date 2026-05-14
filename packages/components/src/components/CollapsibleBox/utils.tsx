import { type TypographyStyle, spacingsPx } from '@trezor/theme';

import { type HeadingSize, type PaddingType } from './types';
import { type IconSize } from '../Icon/Icon';

type PaddingMapArgs = {
    $paddingType: PaddingType;
};

type SizeMapArgs = {
    $headingSize: HeadingSize;
};

export const mapPaddingTypeToHeaderPadding = ({ $paddingType }: PaddingMapArgs): string => {
    const paddingMap: Record<PaddingType, string> = {
        none: '0',
        small: `${spacingsPx.xs} ${spacingsPx.sm}`,
        normal: `${spacingsPx.sm} ${spacingsPx.md}`,
        large: `${spacingsPx.md} ${spacingsPx.xl}`,
    };

    return paddingMap[$paddingType];
};

export const mapPaddingTypeToContentPadding = ({ $paddingType }: PaddingMapArgs): string => {
    const paddingMap: Record<PaddingType, string> = {
        none: `${spacingsPx.sm} 0 0`,
        small: `${spacingsPx.md} ${spacingsPx.sm}`,
        normal: `${spacingsPx.lg} ${spacingsPx.md}`,
        large: `${spacingsPx.xl}`,
    };

    return paddingMap[$paddingType];
};

export const mapSizeToHeadingTypography = ({ $headingSize }: SizeMapArgs): TypographyStyle => {
    const typographyMap: Record<HeadingSize, TypographyStyle> = {
        small: 'body-xs',
        medium: 'body-sm',
        large: 'body-md',
    };

    return typographyMap[$headingSize];
};

export const mapSizeToSubheadingTypography = ({ $headingSize }: SizeMapArgs): TypographyStyle => {
    const typographyMap: Record<HeadingSize, TypographyStyle> = {
        small: 'body-xs',
        medium: 'body-sm',
        large: 'body-sm',
    };

    return typographyMap[$headingSize];
};

export const mapSizeToIconSize = ({ $headingSize }: SizeMapArgs): IconSize => {
    const sizeMap: Record<HeadingSize, IconSize> = {
        small: 12,
        medium: 16,
        large: 16,
    };

    return sizeMap[$headingSize];
};
