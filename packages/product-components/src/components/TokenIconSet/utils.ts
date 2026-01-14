import { TypographyStyle } from '@trezor/theme';

import { AssetLogoSize } from '../AssetLogo/AssetLogo';

export const mapSizeToTypographyStyle = (size: AssetLogoSize): TypographyStyle => {
    const typographyStyleMap: Record<AssetLogoSize, TypographyStyle> = {
        20: 'label',
        24: 'hint',
        32: 'body',
        40: 'titleSmall',
    };

    return typographyStyleMap[size];
};
