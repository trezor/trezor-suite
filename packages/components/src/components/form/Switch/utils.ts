import { type SpacingValue, type TypographyStyle } from '@trezor/theme';

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
        small: 'body-sm',
        medium: 'body-md',
    };

    return sizesMap[size];
};

export const mapSizeToLabelContainerGap = (size: SwitchSize): SpacingValue => {
    const sizesMap: Record<SwitchSize, SpacingValue> = {
        small: 12,
        medium: 16,
    };

    return sizesMap[size];
};
