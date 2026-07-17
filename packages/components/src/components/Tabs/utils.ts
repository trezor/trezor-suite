import { type TypographyStyle } from '@trezor/theme';

import { type TabsSize } from './types';

type mapArgs = {
    $size: TabsSize;
};

export const mapSizeToTypography = ({ $size }: mapArgs): TypographyStyle => {
    const typographyStyleMap: Record<TabsSize, TypographyStyle> = {
        large: 'body-md',
        medium: 'body-sm',
        small: 'body-xs',
    };

    return typographyStyleMap[$size];
};

export const mapSizeToItemPadding = ({ $size }: mapArgs): string => {
    const paddingMap: Record<TabsSize, string> = {
        large: `4px 12px`,
        medium: `4px 8px`,
        small: `2px 8px`,
    };

    return paddingMap[$size];
};

export const mapSizeToContainerPaddingBottom = ({ $size }: mapArgs): string => {
    const paddingMap: Record<TabsSize, string> = {
        large: `${2 + 8}px`,
        medium: `${2 + 4}px`,
        small: `${2 + 2}px`,
    };

    return paddingMap[$size];
};

export const TRANSFORM_OPTIONS = '150ms ease-out';
