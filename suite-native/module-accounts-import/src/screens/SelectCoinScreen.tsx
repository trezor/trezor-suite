import React from 'react';

import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    Screen,
    StackProps,
} from '@suite-native/navigation';
import { Box, Text } from '@suite-native/atoms';
import { SelectableAssetList } from '@suite-native/assets';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { mainnets, testnets } from '@suite-native/config';

import { AccountImportHeader } from '../components/AccountImportHeader';

export const SelectCoinScreen = ({
    navigation,
}: StackProps<AccountsImportStackParamList, AccountsImportStackRoutes.SelectCoin>) => {
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
            <SelectableAssetList
                title="Pick a coin to import"
                items={mainnets}
                onSelectItem={handleSelectCoin}
            />
            <SelectableAssetList
                title="Testnet coins (Hold no value, only for testing)"
                items={testnets}
                onSelectItem={handleSelectCoin}
            />
        </Screen>
    );
};
