import React, { useState } from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    AccountsImportStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    StackNavigationProps,
} from '@suite-native/navigation';
import { AccountsList, SearchableAccountsListScreenHeader } from '@suite-native/accounts';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { IconButton } from '@suite-native/atoms';

const AddAccountButton = () => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountsImport>>();

    const navigateToImportScreen = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    return (
        <IconButton
            iconName="plus"
            onPress={navigateToImportScreen}
            colorScheme="tertiaryElevation0"
            size="medium"
        />
    );
};

export const AccountsScreen = () => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountDetail>>();

    const [accountsFilterValue, setAccountsFilterValue] = useState<string>('');

    const handleSelectAccount = (accountKey: AccountKey, tokenContract?: TokenAddress) => {
        navigation.navigate(RootStackRoutes.AccountDetail, {
            accountKey,
            tokenContract,
        });
    };

    const handleFilterChange = (value: string) => {
        setAccountsFilterValue(value);
    };

    return (
        <Screen
            header={
                <SearchableAccountsListScreenHeader
                    title="My assets"
                    onSearchInputChange={handleFilterChange}
                    rightIcon={<AddAccountButton />}
                />
            }
        >
            <AccountsList onSelectAccount={handleSelectAccount} filterValue={accountsFilterValue} />
        </Screen>
    );
};
