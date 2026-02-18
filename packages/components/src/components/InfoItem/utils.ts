import { SpacingValues, TypographyStyle, spacings } from '@trezor/theme';

import { InfoItemVerticalAlignment } from './types';
import { FlexAlignItems } from '../Flex/FlexProp';
import { IconSize, IconVariant } from '../Icon/Icon';
import { TextIntent, TextPriority } from '../typography/Text/Text';

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

export const mapTypographyStyleToIconSize = (
    typographyStyle: TypographyStyle,
): IconSize | number => {
    const iconSizeMap: Record<TypographyStyle, IconSize | number> = {
        'headline-lg': 48,
        'headline-md': 'extraLarge',
        'headline-sm': 'large',
        'body-md-strong': 'mediumLarge',
        'body-md': 'mediumLarge',
        'body-sm-strong': 'medium',
        'body-sm': 'medium',
        'body-xs': 'medium',
        inherit: 'medium',
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

type MapIntentToIconVariantArgs = {
    intent: TextIntent;
    priority: TextPriority;
    isDisabled: boolean;
};

export const mapIntentToIconVariant = ({
    intent,
    priority,
    isDisabled,
}: MapIntentToIconVariantArgs): IconVariant => {
    if (isDisabled) return 'disabled';

    switch (intent) {
        case 'warning':
            return 'warning';
        case 'info':
            return 'info';
        case 'critical':
            return 'destructive';
        case 'accentViolet':
            return 'purple';
        case 'brand':
            return 'primary';
        case 'accentOrange':
            return 'warning';
        case 'neutral':
            return priority === 'secondary' ? 'tertiary' : 'default';
    }
};
