import { type ReactElement, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { FlashList } from '@shopify/flash-list';

import { selectIsDeviceConnected } from '@suite-common/device';
import { type Network, type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Box, Text } from '@suite-native/atoms';
import { type DiscoveryRootState, selectDiscoveryNetworkGroups } from '@suite-native/discovery';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { useScrollDivider } from '@suite-native/scrollview';
import { SearchNoResults } from '@suite-native/search';
import { useToast } from '@suite-native/toasts';
import { type NativeSpacing } from '@trezor/theme';

import {
    type CoinEnablingFormValues,
    getEnabledCoinFieldName,
    getNetworkSymbolsFromEnabledCoins,
} from '../coinEnablingFormUtils';
import { NetworkListItem } from './NetworkListItem';
import { NetworkSymbolSwitch } from './NetworkSymbolSwitch';

type NetworkGroups = {
    supportedMainnets: Network[];
    supportedTestnets: Network[];
    unsupportedMainnets: Network[];
    unsupportedTestnets: Network[];
};

type NetworkListRow =
    | { kind: 'network'; key: NetworkSymbol; symbol: NetworkSymbol; spacingTop?: NativeSpacing }
    | { kind: 'testnetsTitle'; key: string; spacingTop?: NativeSpacing }
    | { kind: 'unsupportedNetworksTitle'; key: string; spacingTop?: NativeSpacing };

type DiscoveryCoinsFilterProps = {
    searchQuery: string;
    onDisablingLastCoin?: () => void;
};

// Spacing lives on the rows instead of on wrapping stacks, because a virtualized
// list renders every row on its own.
const getNetworkListRows = ({
    supportedMainnets,
    supportedTestnets,
    unsupportedMainnets,
    unsupportedTestnets,
}: NetworkGroups): NetworkListRow[] => {
    const rows: NetworkListRow[] = [];

    const appendNetworks = (networks: Network[], firstRowSpacingTop?: NativeSpacing) => {
        networks.forEach(({ symbol }, index) => {
            rows.push({
                kind: 'network',
                key: symbol,
                symbol,
                spacingTop: index === 0 ? firstRowSpacingTop : 'sp12',
            });
        });
    };

    appendNetworks(supportedMainnets);

    if (supportedTestnets.length > 0) {
        rows.push({
            kind: 'testnetsTitle',
            key: 'supported-testnets-title',
            spacingTop: rows.length > 0 ? 'sp24' : undefined,
        });
        appendNetworks(supportedTestnets, 'sp12');
    }

    if (unsupportedMainnets.length > 0 || unsupportedTestnets.length > 0) {
        rows.push({
            kind: 'unsupportedNetworksTitle',
            key: 'unsupported-networks-title',
            spacingTop: rows.length > 0 ? 'sp32' : undefined,
        });
        appendNetworks(unsupportedMainnets, 'sp16');

        if (unsupportedTestnets.length > 0) {
            rows.push({
                kind: 'testnetsTitle',
                key: 'unsupported-testnets-title',
                spacingTop: unsupportedMainnets.length > 0 ? 'sp24' : 'sp16',
            });
            appendNetworks(unsupportedTestnets, 'sp12');
        }
    }

    return rows;
};

const getNetworkListRowKey = (row: NetworkListRow) => row.key;

const getNetworkListRowType = (row: NetworkListRow) => row.kind;

export const DiscoveryCoinsFilter = ({
    searchQuery,
    onDisablingLastCoin,
}: DiscoveryCoinsFilterProps) => {
    const networkGroups = useSelector((state: DiscoveryRootState) =>
        selectDiscoveryNetworkGroups(state, searchQuery),
    );
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    const { getValues, setValue } = useFormContext<CoinEnablingFormValues>();
    const { showToast } = useToast();
    const { scrollDivider, handleScroll } = useScrollDivider();

    const networkListRows = useMemo(() => getNetworkListRows(networkGroups), [networkGroups]);

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

            setValue(getEnabledCoinFieldName(symbol), nextIsEnabled);
        },
        [getValues, isDeviceConnected, onDisablingLastCoin, setValue, showToast],
    );

    const renderItem = useCallback(
        ({ item: row }: { item: NetworkListRow }): ReactElement => {
            switch (row.kind) {
                case 'network':
                    return (
                        // Keying by symbol opts the row out of cell recycling. A recycled switch
                        // would keep the previous network's animated state and slide into the new
                        // one as the row scrolls into view.
                        <Box key={row.symbol} marginTop={row.spacingTop}>
                            <NetworkListItem
                                symbol={row.symbol}
                                accessory={
                                    <NetworkSymbolSwitch
                                        symbol={row.symbol}
                                        onToggle={handleToggle}
                                    />
                                }
                                onPress={() => handleToggle(row.symbol)}
                                accessibilityRole="togglebutton"
                                testID={`@coin-enabling/toggle-${row.symbol}`}
                            />
                        </Box>
                    );
                case 'testnetsTitle':
                    return (
                        <Box marginTop={row.spacingTop}>
                            <Text variant="body-sm">
                                <Translation id="moduleSettings.coinEnabling.labels.testnets" />
                            </Text>
                        </Box>
                    );
                case 'unsupportedNetworksTitle':
                    return (
                        <Box marginTop={row.spacingTop}>
                            <Text variant="headline-sm">
                                <Translation id="moduleSettings.coinEnabling.unsupportedSubtitle" />
                            </Text>
                        </Box>
                    );
            }
        },
        [handleToggle],
    );

    if (networkListRows.length === 0) {
        return <SearchNoResults />;
    }

    return (
        <Box flex={1}>
            {scrollDivider}
            <FlashList
                data={networkListRows}
                keyExtractor={getNetworkListRowKey}
                getItemType={getNetworkListRowType}
                renderItem={renderItem}
                keyboardShouldPersistTaps="handled"
                onScroll={handleScroll}
                testID="@coin-enabling/network-list"
            />
        </Box>
    );
};
