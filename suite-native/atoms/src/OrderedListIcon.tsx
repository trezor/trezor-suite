import { RequireExactlyOne } from 'type-fest';

import { Icon, IconName, IconSize, getIconSize } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { Box } from './Box';
import { Text } from './Text';

const iconBackgroundStyle = prepareNativeStyle<{
    iconSize: number;
    backgroundColor: Color;
    borderColor: Color;
}>((utils, { iconSize, backgroundColor, borderColor }) => ({
    width: iconSize + 2 * (utils.spacings.sp8 + utils.borders.widths.small),
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: utils.colors[backgroundColor],
    borderRadius: utils.borders.radii.r12,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors[borderColor],
}));

export type OrderedListIconProps = RequireExactlyOne<
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

export const OrderedListIcon = ({
    iconName,
    iconNumber,
    iconColor,
    iconSize = 'mediumLarge',
    iconBackgroundColor = 'backgroundTertiaryDefaultOnElevation1',
    iconBorderColor = 'borderElevation0',
}: OrderedListIconProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box
            style={applyStyle(iconBackgroundStyle, {
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
