import { type SpacingValuesNew } from '@trezor/theme';

import { type Padding } from '../../../utils/frameProps';
import { type ButtonSize } from '../types';

export const mapSizeToPadding = (size: ButtonSize): Padding => {
    const paddingMap: Record<ButtonSize, Padding> = {
        large: { horizontal: 20, vertical: 10 },
        medium: { horizontal: 16, vertical: 8 },
        small: { horizontal: 10, vertical: 4 },
    };

    return paddingMap[size];
};

export const mapSizeToGap = (size: ButtonSize): SpacingValuesNew => {
    const gapMap: Record<ButtonSize, SpacingValuesNew> = {
        large: 4,
        medium: 2,
        small: 0,
    };

    return gapMap[size];
};
