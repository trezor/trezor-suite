import { type ReactNode } from 'react';
import { type AccessibilityRole, View } from 'react-native';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Card, HStack, PressableOpacity, Text, VStack } from '@suite-native/atoms';
import { NetworkIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { NetworkBackendsButton } from './NetworkBackendsButton';

type NetworkListItemProps = {
    symbol: NetworkSymbol;
    accessory: ReactNode;
    onPress: () => void;
    accessibilityRole: AccessibilityRole;
    testID: string;
};

const wrapperStyle = prepareNativeStyle(utils => ({
    paddingVertical: 6,
    paddingHorizontal: 14,
    gap: utils.spacings.sp12,
    alignItems: 'center',
    flex: 1,
}));

const iconWrapperStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.sp8,
}));

export const NetworkListItem = ({
    symbol,
    accessory,
    onPress,
    accessibilityRole,
    testID,
}: NetworkListItemProps) => {
    const { applyStyle } = useNativeStyles();

    const { name, features } = getNetwork(symbol);
    const isTokensFeatureSupported = features.includes('tokens');
    const isStakingFeatureSupported = features.includes('staking');

    return (
        <Card noPadding>
            <PressableOpacity
                onPress={onPress}
                accessibilityRole={accessibilityRole}
                testID={testID}
            >
                <HStack style={applyStyle(wrapperStyle)}>
                    <View style={applyStyle(iconWrapperStyle)}>
                        <NetworkIcon symbol={symbol} size={32} />
                    </View>
                    <HStack
                        flex={1}
                        spacing="sp12"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <VStack spacing={0}>
                            <Text variant="body-sm-strong">{name}</Text>
                            {isTokensFeatureSupported && (
                                <Text variant="body-sm" color="contentSecondary">
                                    <Translation
                                        id={
                                            isStakingFeatureSupported
                                                ? 'moduleSettings.coinEnabling.labels.tokensAndStaking'
                                                : 'moduleSettings.coinEnabling.labels.tokens'
                                        }
                                    />
                                </Text>
                            )}
                        </VStack>
                        <HStack spacing="sp16" alignItems="center">
                            {symbol === 'btc' && <NetworkBackendsButton symbol={symbol} />}
                            {accessory}
                        </HStack>
                    </HStack>
                </HStack>
            </PressableOpacity>
        </Card>
    );
};
