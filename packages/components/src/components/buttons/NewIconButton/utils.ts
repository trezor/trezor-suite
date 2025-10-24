import { Padding } from '../../../utils/frameProps';
import { NewButtonSize } from '../types';

export const mapSizeToPadding = (size: NewButtonSize): Padding => {
    const paddingMap: Record<NewButtonSize, Padding> = {
        large: 12,
        medium: 10,
        small: 6,
    };

    return paddingMap[size];
};
