import { TypographyStyle } from '@trezor/theme';

import { SubTabsSize } from './types';

export const mapSizeToTypography = (size: SubTabsSize): TypographyStyle => {
    const typographyStyleMap: Record<SubTabsSize, TypographyStyle> = {
        large: 'body',
        medium: 'hint',
        small: 'label',
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
