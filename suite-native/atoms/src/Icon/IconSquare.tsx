import { type RequireExactlyOne } from 'type-fest';

import { Icon, type IconName, type IconSize } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { Box } from '../Box';
import { Text } from '../Text';

export type IconSquareProps = RequireExactlyOne<
    {
        iconName: IconName;
        iconNumber: number;
        intent?: IconSquareIntent;
        size?: IconSquareSize;
    },
    'iconName' | 'iconNumber'
>;

export const ICON_SQUARE_INTENTS = ['brand', 'neutral', 'info', 'warning', 'critical'] as const;
export type IconSquareIntent = (typeof ICON_SQUARE_INTENTS)[number];

export const ICON_SQUARE_SIZES = [36, 40] as const;
export type IconSquareSize = (typeof ICON_SQUARE_SIZES)[number];

type IconSquareColors = {
    borderColor: Color;
    backgroundColor: Color;
    iconColor: Color;
};

const intentToColorsMap = {
    brand: {
        borderColor: 'elementBorderBrandSofter',
        backgroundColor: 'elementFillBrandSofter',
        iconColor: 'contentBrand',
    },
    neutral: {
        borderColor: 'elementBorderNeutralSofter',
        backgroundColor: 'elementFillNeutralSofter',
        iconColor: 'contentPrimary',
    },
    info: {
        borderColor: 'elementBorderInfoSofter',
        backgroundColor: 'elementFillInfoSofter',
        iconColor: 'contentInfo',
    },
    warning: {
        borderColor: 'elementBorderWarningSofter',
        backgroundColor: 'elementFillWarningSofter',
        iconColor: 'contentWarning',
    },
    critical: {
        borderColor: 'elementBorderCriticalSofter',
        backgroundColor: 'elementFillCriticalSofter',
        iconColor: 'contentCritical',
    },
} as const satisfies Record<IconSquareIntent, IconSquareColors>;

const sizeToIconSizeMap = {
    36: 'mediumLarge',
    40: 'large',
} as const satisfies Record<IconSquareSize, IconSize>;

const iconSquareStyle = prepareNativeStyle<{
    size: number;
    borderColor: Color;
    backgroundColor: Color;
}>((utils, { size, borderColor, backgroundColor }) => ({
    width: size,
    aspectRatio: 1,
    borderWidth: utils.borders.widths.small,
    borderRadius: utils.borders.radii.r12,
    borderColor: utils.colors[borderColor],
    backgroundColor: utils.colors[backgroundColor],
    alignItems: 'center',
    justifyContent: 'center',
}));

export const IconSquare = ({
    iconName,
    iconNumber,
    intent = 'neutral',
    size = 40,
}: IconSquareProps) => {
    const { applyStyle } = useNativeStyles();

    const { borderColor, backgroundColor, iconColor } = intentToColorsMap[intent];
    const iconSize = sizeToIconSizeMap[size];

    return (
        <Box
            style={applyStyle(iconSquareStyle, {
                size,
                borderColor,
                backgroundColor,
            })}
        >
            {iconNumber && <Text color={iconColor}>{iconNumber}</Text>}
            {iconName && <Icon name={iconName} color={iconColor} size={iconSize} />}
        </Box>
    );
};
