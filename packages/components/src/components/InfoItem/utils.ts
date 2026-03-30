import { type SpacingValues, type TypographyStyle, spacings } from '@trezor/theme';

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

export const mapTypographyStyleToIconGap = (typographyStyle: TypographyStyle): SpacingValues => {
    const gapMap: Record<TypographyStyle, SpacingValues> = {
        'headline-lg': spacings.lg,
        'headline-md': spacings.md,
        'headline-sm': spacings.sm,
        'body-md-strong': spacings.xs,
        'body-md': spacings.xs,
        'body-sm-strong': spacings.xs,
        'body-sm': spacings.xs,
        'body-xs': spacings.xxs,
        inherit: spacings.xxs,
    };

    return gapMap[typographyStyle];
};

export const mapTypographyStyleToLabelGap = (typographyStyle: TypographyStyle): SpacingValues => {
    const gapMap: Record<TypographyStyle, SpacingValues> = {
        'headline-lg': spacings.lg,
        'headline-md': spacings.md,
        'headline-sm': spacings.sm,
        'body-md-strong': spacings.xxs,
        'body-md': spacings.xxs,
        'body-sm-strong': spacings.xxs,
        'body-sm': spacings.xxxs,
        'body-xs': spacings.xxxs,
        inherit: spacings.xxs,
    };

    return gapMap[typographyStyle];
};
