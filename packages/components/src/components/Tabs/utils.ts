import { spacingsPx, spacings, TypographyStyle } from '@trezor/theme';

import { TabsSize } from './types';

type mapArgs = {
    $size: TabsSize;
};

export const mapSizeToTypography = ({ $size }: mapArgs): TypographyStyle => {
    const typographyStyleMap: Record<TabsSize, TypographyStyle> = {
        large: 'body',
        medium: 'hint',
        small: 'label',
    };

    return typographyStyleMap[$size];
};

export const mapSizeToItemPadding = ({ $size }: mapArgs): string => {
    const paddingMap: Record<TabsSize, string> = {
        large: `${spacingsPx.xxs} ${spacingsPx.sm}`,
        medium: `${spacingsPx.xxs} ${spacingsPx.xs}`,
        small: `${spacingsPx.xxxs} ${spacingsPx.xs}`,
    };

    return paddingMap[$size];
};

export const mapSizeToContainerPaddingBottom = ({ $size }: mapArgs): string => {
    const paddingMap: Record<TabsSize, string> = {
        large: `${spacings.xxxs + spacings.xs}px`,
        medium: `${spacings.xxxs + spacings.xxs}px`,
        small: `${spacings.xxxs + spacings.xxxs}px`,
    };

    return paddingMap[$size];
};

export const TRANSFORM_OPTIONS = '150ms ease-out';
