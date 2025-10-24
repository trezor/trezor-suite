import { SpacingValuesNew } from '@trezor/theme';

import { Padding } from '../../../utils/frameProps';
import { NewButtonSize } from '../types';

export const mapSizeToPadding = (size: NewButtonSize): Padding => {
    const paddingMap: Record<NewButtonSize, Padding> = {
        large: { horizontal: 20, vertical: 10 },
        medium: { horizontal: 16, vertical: 8 },
        small: { horizontal: 10, vertical: 4 },
    };

    return paddingMap[size];
};

export const mapSizeToGap = (size: NewButtonSize): SpacingValuesNew => {
    const gapMap: Record<NewButtonSize, SpacingValuesNew> = {
        large: 4,
        medium: 2,
        small: 0,
    };

    return gapMap[size];
};
