import React, { useMemo } from 'react';

import { Box, Card, Text, VStack } from '@suite-native/atoms';
import { Network, networks, NetworkSymbol } from '@suite-common/wallet-config';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { SelectableAssetItem, SelectableAssetItemProps } from './SelectableAssetItem';

export type AssetItem = Omit<SelectableAssetItemProps, 'onPress'>;

type SelectableAssetListProps = {
    items: Network[];
    itemsOrder: NetworkSymbol[];
    title: string;
    onSelectItem: (assetItem: AssetItem) => void;
};

const listItemTitleStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.medium,
}));

export const SelectableAssetList = ({
    items,
    itemsOrder,
    title,
    onSelectItem,
}: SelectableAssetListProps) => {
    const { applyStyle } = useNativeStyles();

    const networkAssetItem: AssetItem[] = useMemo(() => {
        const itemsWithOrdering = items.map(network => ({
            cryptoCurrencySymbol: network.symbol,
            cryptoCurrencyName: networks[network.symbol].name,
            iconName: network.symbol,
            order: itemsOrder.includes(network.symbol)
                ? itemsOrder.indexOf(network.symbol)
                : Number.MAX_SAFE_INTEGER,
        }));
        return itemsWithOrdering.sort((a, b) => (a.order > b.order ? 1 : -1));
    }, [items, itemsOrder]);

    return (
        <Box marginBottom="large">
            <Text variant="hint" color="gray600" style={applyStyle(listItemTitleStyle)}>
                {title}
            </Text>
            <Card>
                <VStack spacing={19}>
                    {networkAssetItem.map(assetItem => {
                        const { cryptoCurrencySymbol, cryptoCurrencyName, iconName } = assetItem;
                        return (
                            <SelectableAssetItem
                                key={cryptoCurrencySymbol}
                                iconName={iconName}
                                cryptoCurrencyName={cryptoCurrencyName}
                                cryptoCurrencySymbol={cryptoCurrencySymbol}
                                onPress={() => onSelectItem(assetItem)}
                            />
                        );
                    })}
                </VStack>
            </Card>
        </Box>
    );
};
