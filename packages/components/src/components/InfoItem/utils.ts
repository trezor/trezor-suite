import { type SpacingValue, type TypographyStyle } from '@trezor/theme';

import { type InfoItemVerticalAlignment } from './types';
import { type FlexAlignItems } from '../Flex/FlexProp';
import { type IconSize } from '../Icon/Icon';

export const mapVerticalAlignmentToAlignItems = (
    verticalAlignment: InfoItemVerticalAlignment,
): FlexAlignItems => {
    const alignItemsMap: Record<InfoItemVerticalAlignment, FlexAlignItems> = {
        start: 'flex-start',
        center: 'center',
        end: 'flex-end',
    };

    return alignItemsMap[verticalAlignment];
};

export const mapTypographyStyleToIconSize = (typographyStyle: TypographyStyle): IconSize => {
    const iconSizeMap: Record<TypographyStyle, IconSize> = {
        'headline-lg': 48,
        'headline-md': 32,
        'headline-sm': 24,
        'body-md-strong': 20,
        'body-md': 20,
        'body-sm-strong': 16,
        'body-sm': 16,
        'body-xs': 16,
        inherit: 16,
    };

    return iconSizeMap[typographyStyle];
};

export const mapTypographyStyleToIconGap = (typographyStyle: TypographyStyle): SpacingValue => {
    const gapMap: Record<TypographyStyle, SpacingValue> = {
        'headline-lg': 20,
        'headline-md': 16,
        'headline-sm': 12,
        'body-md-strong': 8,
        'body-md': 8,
        'body-sm-strong': 8,
        'body-sm': 8,
        'body-xs': 4,
        inherit: 4,
    };

    return gapMap[typographyStyle];
};

export const mapTypographyStyleToLabelGap = (typographyStyle: TypographyStyle): SpacingValue => {
    const gapMap: Record<TypographyStyle, SpacingValue> = {
        'headline-lg': 20,
        'headline-md': 16,
        'headline-sm': 12,
        'body-md-strong': 4,
        'body-md': 4,
        'body-sm-strong': 4,
        'body-sm': 2,
        'body-xs': 2,
        inherit: 4,
    };

    return gapMap[typographyStyle];
};
