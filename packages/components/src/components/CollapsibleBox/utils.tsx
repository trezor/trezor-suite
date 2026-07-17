import { type TypographyStyle } from '@trezor/theme';

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
        small: `8px 12px`,
        normal: `12px 16px`,
        large: `16px 24px`,
    };

    return paddingMap[$paddingType];
};

export const mapPaddingTypeToContentPadding = ({ $paddingType }: PaddingMapArgs): string => {
    const paddingMap: Record<PaddingType, string> = {
        none: `12px 0 0`,
        small: `16px 12px`,
        normal: `20px 16px`,
        large: `24px`,
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
