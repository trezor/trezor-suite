import { useCallback } from 'react';

import { useFocusEffect } from '@react-navigation/native';

import { VStack, Text } from '@suite-native/atoms';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Translation } from '@suite-native/intl';
import { Icon } from '@suite-common/icons';

import { useCoinEnabling } from '../hooks/useCoinEnabling';
import { NetworkSymbolSwitchItem } from './NetworkSymbolSwitchItem';

type DiscoveryCoinsFilterProps = {
    allowDeselectLastCoin?: boolean; // If true, the last coin can be deselected
};

export const DiscoveryCoinsFilter = ({
    allowDeselectLastCoin = false,
}: DiscoveryCoinsFilterProps) => {
    const { enabledNetworkSymbols, availableNetworks, applyDiscoveryChanges } = useCoinEnabling();

    useFocusEffect(
        useCallback(() => {
            // run on leaving the screen
            return () => applyDiscoveryChanges();
        }, [applyDiscoveryChanges]),
    );

    const uniqueNetworkSymbols = [...new Set(availableNetworks.map(n => n.symbol))];

    return (
        <VStack spacing={12}>
            {uniqueNetworkSymbols.map((networkSymbol: NetworkSymbol) => (
                <NetworkSymbolSwitchItem
                    key={networkSymbol}
                    networkSymbol={networkSymbol}
                    isEnabled={enabledNetworkSymbols.includes(networkSymbol)}
                    allowDeselectLastCoin={allowDeselectLastCoin}
                />
            ))}
            <VStack paddingTop="small" paddingBottom="extraLarge" alignItems="center">
                <Icon name="questionLight" color="textSubdued" size="large" />
                <Text color="textSubdued" textAlign="center">
                    <Translation id="moduleSettings.coinEnabling.bottomNote" />
                </Text>
            </VStack>
        </VStack>
    );
};
