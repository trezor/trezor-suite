import { type Padding } from '../../../utils/frameProps';
import { type ButtonSize } from '../types';

export const mapSizeToPadding = (size: ButtonSize): Padding => {
    const paddingMap: Record<ButtonSize, Padding> = {
        large: 12,
        medium: 10,
        small: 6,
    };

    return paddingMap[size];
};
