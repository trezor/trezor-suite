import { G } from '@mobily/ts-belt';
import { RequireExactlyOne } from 'type-fest';

import { Icon, IconName, IconSize } from '@suite-common/icons';
import { Translation, TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { HStack } from '../Stack';
import { Box } from '../Box';
import { Text } from '../Text';

const listItemStyle = prepareNativeStyle(() => ({
    width: '90%',
}));

const iconBackgroundStyle = prepareNativeStyle<{ color: Color; borderColor: Color }>(
    (utils, { color, borderColor }) => ({
        alignItems: 'center',
        justifyContent: 'center',
        width: utils.spacings.extraLarge,
        height: utils.spacings.extraLarge,
        borderRadius: 12,
        extend: {
            condition: G.isNotNullable(color),
            style: {
                backgroundColor: utils.colors[color],
                borderWidth: utils.borders.widths.small,
                borderColor: utils.colors[borderColor],
            },
        },
    }),
);

type BottomSheetListItemProps = RequireExactlyOne<
    {
        translationKey: TxKeyPath;
        iconName: IconName;
        iconNumber: number;
        iconBackgroundColor?: Color;
        iconColor?: Color;
        iconSize?: IconSize;
        iconBorderColor?: Color;
    },
    'iconName' | 'iconNumber'
>;

export const BottomSheetListItem = ({
    iconName,
    iconColor,
    iconNumber,

    translationKey,
    iconSize = 'mediumLarge',
    iconBackgroundColor = 'backgroundTertiaryDefaultOnElevation1',
    iconBorderColor = 'borderElevation1',
}: BottomSheetListItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack spacing={12} alignItems="center">
            <Box
                style={applyStyle(iconBackgroundStyle, {
                    color: iconBackgroundColor,
                    borderColor: iconBorderColor,
                })}
            >
                {iconNumber && <Text color={iconColor}>{iconNumber}</Text>}
                {iconName && <Icon name={iconName} color={iconColor} size={iconSize} />}
            </Box>
            <Text style={applyStyle(listItemStyle)}>
                <Translation id={translationKey} />
            </Text>
        </HStack>
    );
};
