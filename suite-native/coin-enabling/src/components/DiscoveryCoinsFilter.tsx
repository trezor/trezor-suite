import { useSelector } from 'react-redux';

import { selectIsDeviceConnected } from '@suite-common/device';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Text, VStack } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';

import { NetworkSymbolSwitchItem } from './NetworkSymbolSwitchItem';

type DiscoveryCoinsFilterProps = {
    networkSymbols: NetworkSymbol[];
    onDisablingLastCoin?: () => void;
};

export const DiscoveryCoinsFilter = ({
    networkSymbols,
    onDisablingLastCoin,
}: DiscoveryCoinsFilterProps) => {
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const { showToast } = useToast();

    const { setValue, watch } = useFormContext();
    const enabledSymbols: NetworkSymbol[] = watch('enabledCoins');

    const handleToggle = (symbol: NetworkSymbol, isEnabled: boolean) => {
        if (
            !isEnabled &&
            onDisablingLastCoin &&
            enabledSymbols.length === 1 &&
            enabledSymbols.includes(symbol)
        ) {
            onDisablingLastCoin();

            return;
        }

        if (!isDeviceConnected && isEnabled) {
            const { name } = getNetwork(symbol);
            showToast({
                variant: 'default',
                message: (
                    <Translation
                        id="moduleSettings.coinEnabling.toasts.coinEnabled"
                        values={{ coin: name }}
                    />
                ),
            });
        }

        const newEnabledSymbols = isEnabled
            ? [...enabledSymbols, symbol]
            : enabledSymbols.filter(s => s !== symbol);

        setValue('enabledCoins', newEnabledSymbols, { shouldDirty: true, shouldValidate: true });
    };

    return (
        <VStack spacing="sp12">
            {networkSymbols.map(symbol => (
                <NetworkSymbolSwitchItem
                    key={symbol}
                    symbol={symbol}
                    isEnabled={enabledSymbols?.includes(symbol)}
                    onToggle={isEnabled => handleToggle(symbol, isEnabled)}
                />
            ))}
            <VStack paddingVertical="sp8" alignItems="center">
                <Icon name="question" color="contentSecondary" size="large" />
                <Text color="contentSecondary" textAlign="center">
                    <Translation id="moduleSettings.coinEnabling.bottomNote" />
                </Text>
            </VStack>
        </VStack>
    );
};
