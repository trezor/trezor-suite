import React from 'react';

import { A, pipe } from '@mobily/ts-belt';

import { Box, Card, Text, VStack } from '@suite-native/atoms';
import { Network, networks, NetworkSymbol } from '@suite-common/wallet-config';
import {
    mainnetsOrder,
    testnetsOrder,
    enabledMainnets,
    enabledTestnets,
} from '@suite-native/config';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { SelectableNetworkItem } from './SelectableNetworkItem';

type SelectableAssetListProps = {
    onSelectItem: (networkSymbol: NetworkSymbol) => void;
};

const listItemTitleStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.medium,
}));

const mapAndSortNetworkItems = (networkItems: Network[], networkOrder: NetworkSymbol[]) =>
    pipe(
        networkItems,
        A.map(network => ({
            cryptoCurrencySymbol: network.symbol,
            cryptoCurrencyName: networks[network.symbol].name,
            iconName: network.symbol,
            order: networkOrder.includes(network.symbol)
                ? networkOrder.indexOf(network.symbol)
                : Number.MAX_SAFE_INTEGER,
        })),
        A.sort((a, b) => (a.order > b.order ? 1 : -1)),
    );

const sortedMainnetsNetworks = mapAndSortNetworkItems(enabledMainnets, mainnetsOrder);
const sortedTestnetNetworks = mapAndSortNetworkItems(enabledTestnets, testnetsOrder);

export const SelectableNetworkList = ({ onSelectItem }: SelectableAssetListProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <>
            <Box marginBottom="large">
                <Text variant="hint" color="textSubdued" style={applyStyle(listItemTitleStyle)}>
                    Select a coin to sync
                </Text>
                <Card>
                    <VStack spacing="large">
                        {sortedMainnetsNetworks.map(
                            ({ cryptoCurrencySymbol, cryptoCurrencyName, iconName }) => (
                                <SelectableNetworkItem
                                    key={cryptoCurrencySymbol}
                                    iconName={iconName}
                                    cryptoCurrencyName={cryptoCurrencyName}
                                    cryptoCurrencySymbol={cryptoCurrencySymbol}
                                    data-testID={`@onboarding/select-coin/${cryptoCurrencySymbol}`}
                                    onPress={onSelectItem}
                                />
                            ),
                        )}
                    </VStack>
                </Card>
            </Box>
            <Box marginBottom="large">
                <Text variant="hint" color="textSubdued" style={applyStyle(listItemTitleStyle)}>
                    Testnet coins (have no value – for testing purposes only)
                </Text>
                <Card>
                    <VStack spacing="large">
                        {sortedTestnetNetworks.map(
                            ({ cryptoCurrencySymbol, cryptoCurrencyName, iconName }) => (
                                <SelectableNetworkItem
                                    key={cryptoCurrencySymbol}
                                    iconName={iconName}
                                    cryptoCurrencyName={cryptoCurrencyName}
                                    cryptoCurrencySymbol={cryptoCurrencySymbol}
                                    data-testID={`@onboarding/select-coin/${cryptoCurrencySymbol}`}
                                    onPress={onSelectItem}
                                />
                            ),
                        )}
                    </VStack>
                </Card>
            </Box>
        </>
    );
};
