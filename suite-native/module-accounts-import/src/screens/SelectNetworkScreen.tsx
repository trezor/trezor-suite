import React from 'react';

import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    Screen,
    ScreenContent,
    StackProps,
} from '@suite-native/navigation';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { AccountImportHeader } from '../components/AccountImportHeader';
import { SelectableNetworkList } from '../components/SelectableNetworkList';

export const SelectNetworkScreen = ({
    navigation,
}: StackProps<AccountsImportStackParamList, AccountsImportStackRoutes.SelectNetwork>) => {
    const handleSelectNetworkSymbol = (networkSymbol: NetworkSymbol) => {
        navigation.navigate(AccountsImportStackRoutes.XpubScan, {
            networkSymbol,
        });
    };

    return (
        <Screen header={<AccountImportHeader activeStep={1} />}>
            <ScreenContent>
                <SelectableNetworkList onSelectItem={handleSelectNetworkSymbol} />
            </ScreenContent>
        </Screen>
    );
};
