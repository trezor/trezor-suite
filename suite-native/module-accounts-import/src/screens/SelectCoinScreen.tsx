import React from 'react';

import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    Screen,
    StackProps,
} from '@suite-native/navigation';
import { Box, Card, Text, VStack } from '@suite-native/atoms';
import { SelectAssetItem } from '@suite-native/assets';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { mainnets, testnets } from '@suite-native/config';

import { AccountImportHeader } from '../components/AccountImportHeader';

export const SelectCoinScreen = ({
    navigation,
}: StackProps<AccountsImportStackParamList, AccountsImportStackRoutes.SelectCoin>) => {
    const mainnetNetworkItems = mainnets.map(network => ({
        value: network.symbol,
        label: networks[network.symbol].name,
        iconName: network.symbol,
    }));

    const testnetNetworkItems = testnets.map(network => ({
        value: network.symbol,
        label: networks[network.symbol].name,
        iconName: network.symbol,
    }));

    const handleSelectCoin = (currencySymbol: NetworkSymbol) => {
        navigation.navigate(AccountsImportStackRoutes.XpubScan, {
            currencySymbol,
        });
    };

    return (
        <Screen header={<AccountImportHeader activeStep={1} />}>
            <Box>
                <Box alignItems="center" marginBottom="medium">
                    <Box marginBottom="medium">
                        <Text variant="titleMedium">XPUB Import</Text>
                    </Box>
                </Box>
            </Box>
            <Text variant="hint" color="gray600">
                Pick a coin to import
            </Text>
            <Card>
                <VStack spacing={19}>
                    {mainnetNetworkItems.map(({ value, label, iconName }) => (
                        <SelectAssetItem
                            key={value}
                            iconName={iconName}
                            cryptoCurrencyName={label}
                            cryptoCurrencySymbol={value}
                            onPress={() => handleSelectCoin(value)}
                        />
                    ))}
                </VStack>
            </Card>
            <Text variant="hint" color="gray600">
                Testnet coins (Hold no value, only for testing)
            </Text>
            <Card>
                <VStack spacing={19}>
                    {testnetNetworkItems.map(({ value, label, iconName }) => (
                        <SelectAssetItem
                            key={value}
                            iconName={iconName}
                            cryptoCurrencyName={label}
                            cryptoCurrencySymbol={value}
                            onPress={() => handleSelectCoin(value)}
                        />
                    ))}
                </VStack>
            </Card>
        </Screen>
    );
};
