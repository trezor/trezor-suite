import React from 'react';

import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    HomeStackRoutes,
    Screen,
    StackProps,
} from '@suite-native/navigation';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { AccountImportHeader } from '../components/AccountImportHeader';
import { SelectableNetworkList } from '../components/SelectableNetworkList';

export const SelectNetworkScreen = ({
    navigation,
    route,
}: StackProps<AccountsImportStackParamList, AccountsImportStackRoutes.SelectNetwork>) => {
    const handleSelectNetworkSymbol = (networkSymbol: NetworkSymbol) => {
        navigation.navigate(AccountsImportStackRoutes.XpubScan, {
            networkSymbol,
            origin: route.params?.origin ?? HomeStackRoutes.Home,
        });
    };

    return (
        <Screen
            header={
                <AccountImportHeader
                    origin={route.params?.origin ?? HomeStackRoutes.Home}
                    activeStep={1}
                />
            }
        >
            <SelectableNetworkList onSelectItem={handleSelectNetworkSymbol} />
        </Screen>
    );
};
