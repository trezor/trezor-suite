import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { runAdditionalDiscoveryThunk, selectSelectedDevice } from '@suite-common/wallet-core';
import { Text, VStack } from '@suite-native/atoms';
import {
    selectDeviceEnabledDiscoveryNetworkSymbols,
    selectDiscoverySupportedNetworks,
} from '@suite-native/discovery';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

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
    const enabledNetworkSymbols = useSelector(selectDeviceEnabledDiscoveryNetworkSymbols);
    const availableNetworks = useSelector(selectDiscoverySupportedNetworks);
    const selectedDevice = useSelector(selectSelectedDevice);

    useFocusEffect(
        useCallback(
            () =>
                // run on leaving the screen
                () =>
                    selectedDevice?.state?.staticSessionId &&
                    dispatch(runAdditionalDiscoveryThunk(selectedDevice.state.staticSessionId)),
            [dispatch, selectedDevice],
        ),
    );

    const uniqueNetworkSymbols = [...new Set(availableNetworks.map(n => n.symbol))];

    return (
        <VStack spacing="sp12">
            {uniqueNetworkSymbols.map(symbol => (
                <NetworkSymbolSwitchItem
                    key={symbol}
                    symbol={symbol}
                    isEnabled={enabledNetworkSymbols.includes(symbol)}
                    allowDeselectLastCoin={allowDeselectLastCoin}
                    allowChangeAnalytics={allowChangeAnalytics}
                />
            ))}
            <VStack paddingVertical="sp8" alignItems="center">
                <Icon name="question" color="textSubdued" size="large" />
                <Text color="textSubdued" textAlign="center">
                    <Translation id="moduleSettings.coinEnabling.bottomNote" />
                </Text>
            </VStack>
        </VStack>
    );
};
