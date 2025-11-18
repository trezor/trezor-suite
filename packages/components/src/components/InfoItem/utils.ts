import { SpacingValues, TypographyStyle, spacings } from '@trezor/theme';

import { InfoItemVerticalAlignment } from './types';
import { FlexAlignItems } from '../Flex/FlexProp';
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

export const mapTypographyStyleToIconSize = (typographyStyle: TypographyStyle): IconSize => {
    const iconSizeMap: Record<TypographyStyle, IconSize> = {
        titleLarge: 48,
        titleMedium: 32,
        titleSmall: 24,
        highlight: 20,
        body: 20,
        callout: 16,
        hint: 16,
        label: 16,
        inherit: 16,
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
        inherit: spacings.xxs,
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
        inherit: spacings.xxs,
    };

    return gapMap[typographyStyle];
};
