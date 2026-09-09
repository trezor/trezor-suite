import { type RequireExactlyOne } from 'type-fest';

import { Icon, type IconName, type IconSize, getIconSize } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { Box } from '../Box';
import { Text } from '../Text';

const iconSquareStyle = prepareNativeStyle<{
    iconSize: number;
    backgroundColor: Color;
    borderColor: Color;
}>((utils, { iconSize, backgroundColor, borderColor }) => ({
    width: iconSize + 2 * utils.spacings.sp8,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: utils.colors[backgroundColor],
    borderRadius: utils.borders.radii.r12,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors[borderColor],
}));

export type IconSquareProps = RequireExactlyOne<
    {
        iconName: IconName;
        iconNumber: number;
        iconBackgroundColor?: Color;
        iconColor?: Color;
        iconSize?: IconSize;
        iconBorderColor?: Color;
    },
    'iconName' | 'iconNumber'
>;

export const IconSquare = ({
    iconName,
    iconNumber,
    iconColor,
    iconSize = 'mediumLarge',
    iconBackgroundColor = 'elementFillNeutralSofter',
    iconBorderColor = 'elementBorderNeutralSofter',
}: IconSquareProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box
            style={applyStyle(iconSquareStyle, {
                iconSize: getIconSize(iconSize),
                backgroundColor: iconBackgroundColor,
                borderColor: iconBorderColor,
            })}
        >
            {iconNumber && <Text color={iconColor}>{iconNumber}</Text>}
            {iconName && <Icon name={iconName} color={iconColor} size={iconSize} />}
        </Box>
    );
};
