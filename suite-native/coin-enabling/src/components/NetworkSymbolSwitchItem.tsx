import { View } from 'react-native';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Card, HStack, PressableOpacity, Switch, Text, VStack } from '@suite-native/atoms';
import { NetworkIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { isNetworkWithTokens } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { NetworkBackendsButton } from './NetworkBackendsButton';

type NetworkSymbolSwitchItemProps = {
    symbol: NetworkSymbol;
    isEnabled: boolean;
    onToggle: (isEnabled: boolean) => void;
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

export const NetworkSymbolSwitchItem = ({
    symbol,
    isEnabled,
    onToggle,
}: NetworkSymbolSwitchItemProps) => {
    const { applyStyle } = useNativeStyles();

    const { name } = getNetwork(symbol);

    return (
        <Card noPadding>
            <PressableOpacity
                onPress={() => onToggle(!isEnabled)}
                accessibilityRole="togglebutton"
                testID={`@coin-enabling/toggle-${symbol}`}
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
                            {isNetworkWithTokens(symbol) && (
                                <Text variant="body-sm" color="contentSecondary">
                                    <Translation id="generic.tokens" />
                                </Text>
                            )}
                        </VStack>
                        <HStack spacing="sp16" alignItems="center">
                            {symbol === 'btc' && <NetworkBackendsButton symbol={symbol} />}
                            <Switch onChange={onToggle} isChecked={isEnabled} />
                        </HStack>
                    </HStack>
                </HStack>
            </PressableOpacity>
        </Card>
    );
};
