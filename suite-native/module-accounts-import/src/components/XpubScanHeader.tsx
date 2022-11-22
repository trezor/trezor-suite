import React from 'react';

import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { Box, Text, Select } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { enabledNetworks } from '@suite-native/config';

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

    const selectNetworkItems = enabledNetworks.map(networkSymbol => ({
        value: networkSymbol,
        label: networks[networkSymbol].name,
        iconName: networkSymbol,
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
