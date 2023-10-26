import { View } from 'react-native';

import { IconName, Icon } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { Text } from '../Text';

export type CardStatusVariant = 'info' | 'success';

export type CardStatusProps = { status: CardStatusVariant; statusMessage: string };

type CardStatusStyleProps = { backgroundColor: Color; textColor: Color; iconName: IconName };
type CardStatusContainerStyleProps = { backgroundColor: Color };

const cardStatusToStyleMap = {
    info: {
        backgroundColor: 'backgroundAlertBlueSubtleOnElevation0',
        textColor: 'textAlertBlue',
        iconName: 'info',
    },
    success: {
        backgroundColor: 'backgroundPrimarySubtleOnElevation0',
        textColor: 'textSecondaryHighlight',
        iconName: 'success',
    },
} as const satisfies Record<CardStatusVariant, CardStatusStyleProps>;

const cardStatusContainerStyle = prepareNativeStyle<CardStatusContainerStyleProps>(
    (utils, { backgroundColor }) => ({
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',

        gap: utils.spacings.small,
        padding: utils.spacings.small,
        backgroundColor: utils.colors[backgroundColor],
        borderTopLeftRadius: utils.borders.radii.medium,
        borderTopRightRadius: utils.borders.radii.medium,
    }),
);

export const CardStatus = ({ status, statusMessage }: CardStatusProps) => {
    const { applyStyle } = useNativeStyles();
    const { backgroundColor, textColor, iconName } = cardStatusToStyleMap[status];

    return (
        <View style={applyStyle(cardStatusContainerStyle, { backgroundColor })}>
            <Icon size="mediumLarge" name={iconName} color={textColor} />
            <Text variant="label" color={textColor}>
                {statusMessage}
            </Text>
        </View>
    );
};
