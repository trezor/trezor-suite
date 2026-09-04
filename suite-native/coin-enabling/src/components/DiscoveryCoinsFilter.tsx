import { memo, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceConnected } from '@suite-common/device';
import { type Network, type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Text, VStack } from '@suite-native/atoms';
import { type DiscoveryRootState, selectDiscoveryNetworkGroups } from '@suite-native/discovery';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { SearchNoResults } from '@suite-native/search';
import { useToast } from '@suite-native/toasts';

import {
    type CoinEnablingFormValues,
    getEnabledCoinFieldName,
    getNetworkSymbolsFromEnabledCoins,
} from '../coinEnablingFormUtils';
import { NetworkListItem } from './NetworkListItem';
import { NetworkSymbolSwitch } from './NetworkSymbolSwitch';

type NetworkGroupProps = {
    networks: Network[];
    handleToggle: (symbol: NetworkSymbol, isEnabled?: boolean) => void;
    showTestnetsLabel?: boolean;
};

type DiscoveryCoinsFilterProps = {
    searchQuery: string;
    onDisablingLastCoin?: () => void;
};

const NetworkGroup = ({ networks, handleToggle, showTestnetsLabel }: NetworkGroupProps) => (
    <VStack spacing="sp12">
        {showTestnetsLabel && (
            <Text variant="body-sm">
                <Translation id="moduleSettings.coinEnabling.labels.testnets" />
            </Text>
        )}
        {networks.map(({ symbol }) => (
            <NetworkListItem
                key={symbol}
                symbol={symbol}
                accessory={<NetworkSymbolSwitch symbol={symbol} onToggle={handleToggle} />}
                onPress={() => handleToggle(symbol)}
                accessibilityRole="togglebutton"
                testID={`@coin-enabling/toggle-${symbol}`}
            />
        ))}
    </VStack>
);

const MemoizedNetworkGroup = memo(NetworkGroup);

export const DiscoveryCoinsFilter = ({
    searchQuery,
    onDisablingLastCoin,
}: DiscoveryCoinsFilterProps) => {
    const { supportedMainnets, supportedTestnets, unsupportedMainnets, unsupportedTestnets } =
        useSelector((state: DiscoveryRootState) =>
            selectDiscoveryNetworkGroups(state, searchQuery),
        );
    const isAnyNetworkVisible =
        supportedMainnets.length > 0 ||
        supportedTestnets.length > 0 ||
        unsupportedMainnets.length > 0 ||
        unsupportedTestnets.length > 0;

    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const { showToast } = useToast();

    const { getValues, setValue } = useFormContext<CoinEnablingFormValues>();

    const handleToggle = useCallback(
        (symbol: NetworkSymbol, isEnabled?: boolean) => {
            const enabledCoins = getValues('enabledCoins') ?? {};
            const isSymbolEnabled = !!enabledCoins[symbol];
            // Row press does not subscribe to form state, so it toggles from current form value.
            // Switch press already knows the next value and passes it directly.
            const nextIsEnabled = isEnabled ?? !isSymbolEnabled;

            if (nextIsEnabled === isSymbolEnabled) {
                return;
            }

            const enabledSymbols = getNetworkSymbolsFromEnabledCoins(enabledCoins);

            if (
                !nextIsEnabled &&
                onDisablingLastCoin &&
                enabledSymbols.length === 1 &&
                isSymbolEnabled
            ) {
                onDisablingLastCoin();

                return;
            }

            if (!isDeviceConnected && nextIsEnabled) {
                const { name } = getNetwork(symbol);
                showToast({
                    intent: 'neutral',
                    message: (
                        <Translation
                            id="moduleSettings.coinEnabling.toasts.coinEnabled"
                            values={{ coin: name }}
                        />
                    ),
                });
            }

            // React Hook Form cannot infer the boolean value behind a branded record key.
            (setValue as (fieldName: `enabledCoins.${string}`, value: boolean) => void)(
                getEnabledCoinFieldName(symbol),
                nextIsEnabled,
            );
        },
        [getValues, isDeviceConnected, onDisablingLastCoin, setValue, showToast],
    );

    if (!isAnyNetworkVisible) {
        return <SearchNoResults />;
    }

    return (
        <VStack spacing="sp32">
            <VStack spacing="sp24">
                <MemoizedNetworkGroup networks={supportedMainnets} handleToggle={handleToggle} />
                {supportedTestnets.length > 0 && (
                    <MemoizedNetworkGroup
                        networks={supportedTestnets}
                        handleToggle={handleToggle}
                        showTestnetsLabel
                    />
                )}
            </VStack>
            {unsupportedMainnets.length > 0 && (
                <VStack spacing="sp16">
                    <Text variant="headline-sm">
                        <Translation id="moduleSettings.coinEnabling.unsupportedSubtitle" />
                    </Text>
                    <VStack spacing="sp24">
                        <MemoizedNetworkGroup
                            networks={unsupportedMainnets}
                            handleToggle={handleToggle}
                        />
                        {unsupportedTestnets.length > 0 && (
                            <MemoizedNetworkGroup
                                networks={unsupportedTestnets}
                                handleToggle={handleToggle}
                                showTestnetsLabel
                            />
                        )}
                    </VStack>
                </VStack>
            )}
        </VStack>
    );
};
