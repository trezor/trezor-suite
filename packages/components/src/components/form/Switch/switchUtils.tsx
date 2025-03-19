import { spacingsPx, typography } from '@trezor/theme';

import { SwitchSize } from './Switch';

type MapType = { $size: SwitchSize };

export const mapSizeToHandleSize = ({ $size }: MapType) => {
    const sizesMap = {
        small: '14px',
        medium: '20px',
    };

    return sizesMap[$size];
};
export const mapSizeToContainerWidth = ({ $size }: MapType) => {
    const sizesMap = {
        small: '32px',
        medium: '44px',
    };

    return sizesMap[$size];
};
export const mapSizeToContainerHeight = ({ $size }: MapType) => {
    const sizesMap = {
        small: '18px',
        medium: '24px',
    };

    return sizesMap[$size];
};

export const mapSizeToLabelTypography = ({ $size }: MapType) => {
    const sizesMap = {
        small: typography.label,
        medium: typography.body,
    };

    return sizesMap[$size];
};

export const mapSizeToLabelContainerGap = ({ $size }: MapType) => {
    const sizesMap = {
        small: spacingsPx.sm,
        medium: spacingsPx.md,
    };

    return sizesMap[$size];
};
