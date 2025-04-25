import { SpacingValues, TypographyStyle, spacings } from '@trezor/theme';

import { type SwitchSize } from './types';

export const mapSizeToHandleSize = (size: SwitchSize): number => {
    const sizesMap: Record<SwitchSize, number> = {
        small: 16,
        medium: 20,
    };

    return sizesMap[size];
};

export const mapSizeToLabelTypography = (size: SwitchSize): TypographyStyle => {
    const sizesMap: Record<SwitchSize, TypographyStyle> = {
        small: 'hint',
        medium: 'body',
    };

    return sizesMap[size];
};

export const mapSizeToLabelContainerGap = (size: SwitchSize): SpacingValues => {
    const sizesMap: Record<SwitchSize, SpacingValues> = {
        small: spacings.sm,
        medium: spacings.md,
    };

    return sizesMap[size];
};
