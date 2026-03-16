import { type TypographyStyle } from '@trezor/theme';

import { type AssetLogoSize } from '../AssetLogo/AssetLogo';

export const mapSizeToTypographyStyle = (size: AssetLogoSize): TypographyStyle => {
    const typographyStyleMap: Record<AssetLogoSize, TypographyStyle> = {
        20: 'body-xs',
        24: 'body-sm',
        32: 'body-md',
        40: 'headline-sm',
    };

    return typographyStyleMap[size];
};
