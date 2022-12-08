import React, { useMemo } from 'react';

import { Box, Card, Text, VStack } from '@suite-native/atoms';
import { Network, networks, NetworkSymbol } from '@suite-common/wallet-config';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { SelectableAssetItem } from './SelectableAssetItem';

type SelectableAssetListProps = {
    items: Network[];
    title: string;
    onSelectItem: (currencySymbol: NetworkSymbol) => void;
};

const listItemTitleStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.medium,
}));

export const SelectableAssetList = ({ items, title, onSelectItem }: SelectableAssetListProps) => {
    const { applyStyle } = useNativeStyles();

    const networkItems = useMemo(
        () =>
            items.map(network => ({
                value: network.symbol,
                label: networks[network.symbol].name,
                iconName: network.symbol,
            })),
        [items],
    );

    return (
        <Box marginBottom="large">
            <Text variant="hint" color="gray600" style={applyStyle(listItemTitleStyle)}>
                {title}
            </Text>
            <Card>
                <VStack spacing={19}>
                    {networkItems.map(network => {
                        const { value, label, iconName } = network;
                        return (
                            <SelectableAssetItem
                                key={value}
                                iconName={iconName}
                                cryptoCurrencyName={label}
                                cryptoCurrencySymbol={value}
                                onPress={() => onSelectItem(value)}
                            />
                        );
                    })}
                </VStack>
            </Card>
        </Box>
    );
};
