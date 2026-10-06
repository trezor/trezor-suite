import { LinearGradient } from 'expo-linear-gradient';

import { HStack, IconCircle, Text, VStack } from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type ItemIntent, connectorColorsMap } from './presets';

type WalletBackupRecapListItemProps = {
    labelId: TxKeyPath;
    iconName: IconName;
    iconIntent: ItemIntent;
    connectorIntent: ItemIntent;
    isLast: boolean;
};

const ICON_SIZE = 40;

const itemStyle = prepareNativeStyle(utils => ({
    minHeight: ICON_SIZE + utils.spacings.sp8,
    gap: utils.spacings.sp16,
    alignItems: 'center',
}));

const connectorStyle = prepareNativeStyle(utils => ({
    width: utils.borders.widths.large,
    height: ICON_SIZE,
    backgroundColor: utils.colors.elementFillNeutralSofter,
    position: 'absolute',
    bottom: -ICON_SIZE,
}));

const textStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
}));

export const WalletBackupRecapListItem = ({
    labelId,
    iconName,
    iconIntent,
    connectorIntent,
    isLast,
}: WalletBackupRecapListItemProps) => {
    const { applyStyle, utils } = useNativeStyles();

    const connectorColor1 = utils.colors[connectorColorsMap[connectorIntent][0]];
    const connectorColor2 = utils.colors[connectorColorsMap[connectorIntent][1]];

    return (
        <HStack style={applyStyle(itemStyle)}>
            <VStack alignItems="center">
                <IconCircle name={iconName} intent={iconIntent} size={ICON_SIZE} />
                {!isLast && (
                    <LinearGradient
                        colors={[connectorColor1, connectorColor2]}
                        style={applyStyle(connectorStyle)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    />
                )}
            </VStack>
            <Text variant="body-md-strong" style={applyStyle(textStyle)}>
                <Translation id={labelId} />
            </Text>
        </HStack>
    );
};
