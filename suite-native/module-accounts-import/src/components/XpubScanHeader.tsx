import React from 'react';

import { Box, Select, Text } from '@suite-native/atoms';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { CryptoIconName } from '@trezor/icons';

type XpubScanHeaderProps = {
    onSelectCurrency: (currencySymbol: NetworkSymbol) => void;
    selectedCurrencySymbol: NetworkSymbol;
};

export const XpubScanHeader = ({
    onSelectCurrency,
    selectedCurrencySymbol,
}: XpubScanHeaderProps) => {
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
            <Box style={{ width: '100%' }}>
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
