import { type TypographyStyle } from '@trezor/theme';

import { type SubTabsSize } from './types';

export const mapSizeToTypography = (size: SubTabsSize): TypographyStyle => {
    const typographyStyleMap: Record<SubTabsSize, TypographyStyle> = {
        large: 'body-md',
        medium: 'body-sm',
        small: 'body-xs',
    };

    return typographyStyleMap[size];
};

export const mapSizeToIconSize = (size: SubTabsSize): number => {
    const iconSizeMap: Record<SubTabsSize, number> = {
        large: 22,
        medium: 20,
        small: 18,
    };

    return iconSizeMap[size];
};
