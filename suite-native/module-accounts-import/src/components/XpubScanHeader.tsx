import React from 'react';

import { Box, Select, Text } from '@suite-native/atoms';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { CryptoIconName } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type XpubScanHeaderProps = {
    onSelectCurrency: (currencySymbol: NetworkSymbol) => void;
    selectedCurrencySymbol: NetworkSymbol;
};

const selectWrapper = prepareNativeStyle(() => ({
    width: '100%',
}));

export const XpubScanHeader = ({
    onSelectCurrency,
    selectedCurrencySymbol,
}: XpubScanHeaderProps) => {
    const { applyStyle } = useNativeStyles();

    const selectNetworkItems = Object.keys(networks).map(networkSymbol => ({
        value: networkSymbol as NetworkSymbol,
        label: networks[networkSymbol as NetworkSymbol].name,
        iconName: networkSymbol as CryptoIconName,
    }));

    return (
        <Box alignItems="center" marginBottom="large">
            <Box marginBottom="medium">
                <Text variant="titleMedium">XPUB Import</Text>
            </Box>
            <Box style={applyStyle(selectWrapper)}>
                <Select<NetworkSymbol>
                    selectLabel="Select coin"
                    onSelectItem={onSelectCurrency}
                    selectValue={selectedCurrencySymbol}
                    items={selectNetworkItems}
                />
            </Box>
        </Box>
    );
};
