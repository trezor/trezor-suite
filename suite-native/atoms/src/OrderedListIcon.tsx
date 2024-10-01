import { G } from '@mobily/ts-belt';
import { RequireExactlyOne } from 'type-fest';

import { Icon, IconName, IconSize } from '@suite-common/icons-deprecated';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { Box } from './Box';
import { Text } from './Text';

const iconBackgroundStyle = prepareNativeStyle<{ color: Color; borderColor: Color }>(
    (utils, { color, borderColor }) => ({
        alignItems: 'center',
        justifyContent: 'center',
        width: utils.spacings.sp32,
        height: utils.spacings.sp32,
        borderRadius: 12,
        extend: [
            {
                condition: G.isNotNullable(color),
                style: {
                    backgroundColor: utils.colors[color],
                },
            },
            {
                condition: G.isNotNullable(borderColor),
                style: {
                    borderWidth: utils.borders.widths.small,
                    borderColor: utils.colors[borderColor],
                },
            },
        ],
    }),
);

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
    iconBorderColor = 'borderElevation1',
}: OrderedListIconProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box
            style={applyStyle(iconBackgroundStyle, {
                color: iconBackgroundColor,
                borderColor: iconBorderColor,
            })}
        >
            {iconNumber && <Text color={iconColor}>{iconNumber}</Text>}
            {iconName && <Icon name={iconName} color={iconColor} size={iconSize} />}
        </Box>
    );
};
