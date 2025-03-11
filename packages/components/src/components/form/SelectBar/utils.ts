import { TypographyStyle, spacings } from '@trezor/theme';

import { SelectBarSize } from './types';
import { Padding } from '../../../utils/frameProps';
import { TextVariant } from '../../typography/Text/Text';

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

export const mapStateToTextVariant = (isDisabled: boolean, isSelected: boolean): TextVariant => {
    if (isDisabled) return 'disabled';

    return isSelected ? 'primary' : 'tertiary';
};
