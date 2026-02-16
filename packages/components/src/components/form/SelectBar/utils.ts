import { TypographyStyle, spacings } from '@trezor/theme';

import { SelectBarSize } from './types';
import { Padding } from '../../../utils/frameProps';
import { TextIntent, TextPriority } from '../../typography/Text/Text';

export const mapSizeToTypographyStyle = (
    size: SelectBarSize,
    isSelected?: boolean,
): TypographyStyle => {
    const typographyStyleMap: Record<SelectBarSize, TypographyStyle> = {
        large: isSelected ? 'highlight' : 'body',
        small: isSelected ? 'callout' : 'hint',
    };

    return typographyStyleMap[size];
};

export const mapSizeToPadding = (size: SelectBarSize): Padding => {
    const paddingMap: Record<SelectBarSize, Padding> = {
        large: {
            vertical: spacings.xs,
            horizontal: spacings.xl,
        },
        small: {
            vertical: spacings.xxs,
            horizontal: spacings.lg,
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
