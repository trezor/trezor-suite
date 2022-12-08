import React from 'react';
import { useDispatch } from 'react-redux';

import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    Screen,
    StackProps,
} from '@suite-native/navigation';
import { Box, Text } from '@suite-native/atoms';
import { mainnets, mainnetsOrder, testnets, testnetsOrder } from '@suite-native/config';

import { updateSelectedCoin } from '../accountsImportSlice';
import { AccountImportHeader } from '../components/AccountImportHeader';
import { AssetItem, SelectableAssetList } from '../components/SelectableAssetList';

export const SelectCoinScreen = ({
    navigation,
}: StackProps<AccountsImportStackParamList, AccountsImportStackRoutes.SelectCoin>) => {
    const dispatch = useDispatch();

    const handleSelectCoin = (assetItem: AssetItem) => {
        dispatch(updateSelectedCoin(assetItem));
        navigation.navigate(AccountsImportStackRoutes.XpubScan, {});
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
                itemsOrder={mainnetsOrder}
                onSelectItem={handleSelectCoin}
            />
            <SelectableAssetList
                title="Testnet coins (Hold no value, only for testing)"
                items={testnets}
                itemsOrder={testnetsOrder}
                onSelectItem={handleSelectCoin}
            />
        </Screen>
    );
};
