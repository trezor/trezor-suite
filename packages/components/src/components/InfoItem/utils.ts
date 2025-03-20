import { SpacingValues, TypographyStyle, spacings } from '@trezor/theme';

import { InfoItemVerticalAlignment } from './types';
import { FlexAlignItems } from '../Flex/Flex';
import { IconSize } from '../Icon/Icon';

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
        titleLarge: 48,
        titleMedium: 'extraLarge',
        titleSmall: 'large',
        highlight: 'mediumLarge',
        body: 'mediumLarge',
        callout: 'medium',
        hint: 'medium',
        label: 'medium',
    };

    return iconSizeMap[typographyStyle];
};

export const mapTypographyStyleToIconGap = (typographyStyle: TypographyStyle): SpacingValues => {
    const gapMap: Record<TypographyStyle, SpacingValues> = {
        titleLarge: spacings.lg,
        titleMedium: spacings.md,
        titleSmall: spacings.sm,
        highlight: spacings.xs,
        body: spacings.xs,
        callout: spacings.xs,
        hint: spacings.xs,
        label: spacings.xxs,
    };

    return gapMap[typographyStyle];
};

export const mapTypographyStyleToLabelGap = (typographyStyle: TypographyStyle): SpacingValues => {
    const gapMap: Record<TypographyStyle, SpacingValues> = {
        titleLarge: spacings.lg,
        titleMedium: spacings.md,
        titleSmall: spacings.sm,
        highlight: spacings.xxs,
        body: spacings.xxs,
        callout: spacings.xxs,
        hint: spacings.xxxs,
        label: spacings.xxxs,
    };

    return gapMap[typographyStyle];
};
