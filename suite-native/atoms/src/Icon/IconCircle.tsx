import { Icon, type IconName, type IconSize } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { Box } from '../Box';

export const ICON_CIRCLE_INTENTS = ['neutral', 'brand', 'warning', 'critical', 'info'] as const;
export type IconCircleIntent = (typeof ICON_CIRCLE_INTENTS)[number];

export const ICON_CIRCLE_SIZES = [20, 24, 32, 40, 48] as const;
export type IconCircleSize = (typeof ICON_CIRCLE_SIZES)[number];

export type IconCircleProps = {
    name: IconName;
    intent?: IconCircleIntent;
    size?: IconCircleSize;
    accessibilityLabel?: string;
};

type IconCircleStyle = {
    backgroundColor: Color;
    iconColor: Color;
};

const iconCircleIntentToStylePropsMap = {
    neutral: {
        backgroundColor: 'elementFillNeutralSoft',
        iconColor: 'contentSecondary',
    },
    brand: {
        backgroundColor: 'elementFillBrandSoft',
        iconColor: 'contentBrand',
    },
    warning: {
        backgroundColor: 'elementFillWarningSoft',
        iconColor: 'contentWarning',
    },
    critical: {
        backgroundColor: 'elementFillCriticalSoft',
        iconColor: 'contentCritical',
    },
    info: {
        backgroundColor: 'elementFillInfoSoft',
        iconColor: 'contentInfo',
    },
} as const satisfies Record<IconCircleIntent, IconCircleStyle>;

const iconCircleSizeToIconSizeMap: Record<IconCircleSize, IconSize> = {
    20: 'small',
    24: 'small',
    32: 'medium',
    40: 'mediumLarge',
    48: 'large',
};

const iconCircleStyle = prepareNativeStyle<{ backgroundColor: Color; size: IconCircleSize }>(
    (utils, { backgroundColor, size }) => ({
        justifyContent: 'center',
        alignItems: 'center',
        width: size,
        height: size,
        backgroundColor: utils.colors[backgroundColor],
        borderRadius: utils.borders.radii.round,
    }),
);

export const IconCircle = ({
    name,
    intent = 'neutral',
    size = 48,
    accessibilityLabel,
}: IconCircleProps) => {
    const { applyStyle } = useNativeStyles();
    const { backgroundColor, iconColor } = iconCircleIntentToStylePropsMap[intent];
    const iconSize = iconCircleSizeToIconSizeMap[size];

    return (
        <Box
            style={applyStyle(iconCircleStyle, { backgroundColor, size })}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="image"
        >
            <Icon name={name} color={iconColor} size={iconSize} />
        </Box>
    );
};
