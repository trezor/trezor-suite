import { TypographyStyle } from '@trezor/theme';

import { SubTabsSize } from './types';
import { IconSize } from '../Icon/Icon';

export const mapSizeToTypography = (size: SubTabsSize): TypographyStyle => {
    const typographyStyleMap: Record<SubTabsSize, TypographyStyle> = {
        large: 'body',
        medium: 'hint',
        small: 'label',
    };

    return typographyStyleMap[size];
};

export const mapSizeToIconSize = (size: SubTabsSize): IconSize => {
    const iconSizeMap: Record<SubTabsSize, IconSize> = {
        large: 24,
        medium: 20,
        small: 16,
    };

    return iconSizeMap[size];
};
