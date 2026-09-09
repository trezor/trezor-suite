import { type RequireExactlyOne } from 'type-fest';

import { Icon, type IconName, type IconSize, getIconSize } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { Box } from '../Box';
import { Text } from '../Text';

export const ICON_SQUARE_INTENTS = ['brand', 'neutral', 'info', 'warning', 'critical'] as const;
export type IconSquareIntent = (typeof ICON_SQUARE_INTENTS)[number];

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

const iconSquareStyle = prepareNativeStyle<{
    iconSize: number;
    borderColor: Color;
    backgroundColor: Color;
}>((utils, { iconSize, borderColor, backgroundColor }) => ({
    width: iconSize + 2 * utils.spacings.sp8,
    borderWidth: utils.borders.widths.small,
    borderRadius: utils.borders.radii.r12,
    borderColor: utils.colors[borderColor],
    backgroundColor: utils.colors[backgroundColor],
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
}));

export type IconSquareProps = RequireExactlyOne<
    {
        iconName: IconName;
        iconNumber: number;
        intent?: IconSquareIntent;
        iconSize?: IconSize;
    },
    'iconName' | 'iconNumber'
>;

export const IconSquare = ({
    iconName,
    iconNumber,
    intent = 'neutral',
    iconSize = 'mediumLarge',
}: IconSquareProps) => {
    const { applyStyle } = useNativeStyles();

    const { borderColor, backgroundColor, iconColor } = intentToColorsMap[intent];

    return (
        <Box
            style={applyStyle(iconSquareStyle, {
                iconSize: getIconSize(iconSize),
                borderColor,
                backgroundColor,
            })}
        >
            {iconNumber && <Text color={iconColor}>{iconNumber}</Text>}
            {iconName && <Icon name={iconName} color={iconColor} size={iconSize} />}
        </Box>
    );
};
