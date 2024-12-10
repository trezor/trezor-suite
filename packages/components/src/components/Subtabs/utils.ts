import { TypographyStyle } from '@trezor/theme';

import { SubtabsSize } from './types';

export const mapSizeToTypography = (size: SubtabsSize): TypographyStyle => {
    const typographyStyleMap: Record<SubtabsSize, TypographyStyle> = {
        large: 'body',
        medium: 'hint',
        small: 'label',
    };

    return typographyStyleMap[size];
};

export const mapSizeToIconSize = (size: SubtabsSize): number => {
    const iconSizeMap: Record<SubtabsSize, number> = {
        large: 22,
        medium: 20,
        small: 18,
    };

    return iconSizeMap[size];
};
