import { LinearGradient } from 'expo-linear-gradient';

import { HStack, OrderedListIcon, Text, VStack } from '@suite-native/atoms';
import { IconName } from '@suite-native/icons';
import { Translation, TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ColorVariant, connectorColorsMap, iconColorsMap } from './presets';

type WalletBackupRecapListItemProps = {
    labelId: TxKeyPath;
    iconName: IconName;
    isLast: boolean;
    iconVariant?: ColorVariant;
    connectorVariant?: ColorVariant;
};

const connectorStyle = prepareNativeStyle(utils => ({
    width: utils.spacings.sp2,
    height: utils.spacings.sp36,
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation0,
    position: 'absolute',
    bottom: -utils.spacings.sp36,
}));

const textStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
}));

export const WalletBackupRecapListItem = ({
    labelId,
    iconName,
    isLast,
    iconVariant = 'default',
    connectorVariant = 'default',
}: WalletBackupRecapListItemProps) => {
    const { applyStyle, utils } = useNativeStyles();

    const connectorColor1 = utils.colors[connectorColorsMap[connectorVariant][0]];
    const connectorColor2 = utils.colors[connectorColorsMap[connectorVariant][1]];

    return (
        <HStack spacing="sp16" alignItems="center">
            <VStack alignItems="center">
                <OrderedListIcon
                    iconBorderRadius="round"
                    iconName={iconName}
                    iconSize="large"
                    {...iconColorsMap[iconVariant]}
                />
                {!isLast && (
                    <LinearGradient
                        colors={[connectorColor1, connectorColor2]}
                        style={applyStyle(connectorStyle)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    />
                )}
            </VStack>
            <Text variant="highlight" style={applyStyle(textStyle)}>
                <Translation id={labelId} />
            </Text>
        </HStack>
    );
};
