import { type TypographyStyle } from '@trezor/theme';

import { type SelectBarSize } from './types';
import { type Padding } from '../../../utils/frameProps';
import { type TextIntent, type TextPriority } from '../../typography/Text/Text';

export const mapSizeToTypographyStyle = (
    size: SelectBarSize,
    isSelected?: boolean,
): TypographyStyle => {
    const typographyStyleMap: Record<SelectBarSize, TypographyStyle> = {
        large: isSelected ? 'body-md-strong' : 'body-md',
        small: isSelected ? 'body-sm-strong' : 'body-sm',
    };

    return typographyStyleMap[size];
};

export const mapSizeToPadding = (size: SelectBarSize): Padding => {
    const paddingMap: Record<SelectBarSize, Padding> = {
        large: {
            vertical: 8,
            horizontal: 24,
        },
        small: {
            vertical: 4,
            horizontal: 16,
        },
    };

    return paddingMap[size];
};

export const mapStateToTextIntent = (
    isSelected: boolean,
): {
    intent: TextIntent;
    priority?: TextPriority;
} => {
    if (isSelected) {
        return { intent: 'brand' };
    }

    return { intent: 'neutral', priority: 'secondary' };
};
