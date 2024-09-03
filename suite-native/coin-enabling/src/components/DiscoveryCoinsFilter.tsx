import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { VStack, Text } from '@suite-native/atoms';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Translation } from '@suite-native/intl';
import { Icon } from '@suite-common/icons-deprecated';
import {
    applyDiscoveryChangesThunk,
    selectDiscoverySupportedNetworks,
    selectEnabledDiscoveryNetworkSymbols,
} from '@suite-native/discovery';

import { NetworkSymbolSwitchItem } from './NetworkSymbolSwitchItem';

type DiscoveryCoinsFilterProps = {
    allowDeselectLastCoin?: boolean; // If true, the last coin can be deselected
    allowChangeAnalytics?: boolean; // If true, analytics will be sent
};

export const DiscoveryCoinsFilter = ({
    allowDeselectLastCoin = false,
    allowChangeAnalytics = true,
}: DiscoveryCoinsFilterProps) => {
    const dispatch = useDispatch();
    const enabledNetworkSymbols = useSelector(selectEnabledDiscoveryNetworkSymbols);
    const availableNetworks = useSelector(selectDiscoverySupportedNetworks);

    useFocusEffect(
        useCallback(() => {
            // run on leaving the screen
            return () => dispatch(applyDiscoveryChangesThunk());
        }, [dispatch]),
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
                    allowChangeAnalytics={allowChangeAnalytics}
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
