import React from 'react';

import {
    AccountsStackParamList,
    AccountsStackRoutes,
    Screen,
    StackProps,
} from '@suite-native/navigation';
import { AccountsList } from '@suite-native/accounts';
import { AccountKey } from '@suite-common/wallet-types';
import { EthereumTokenSymbol } from '@suite-native/ethereum-tokens';

import { AccountsScreenHeader } from '../components/AccountsScreenHeader';

export const AccountsScreen = ({
    navigation,
}: StackProps<AccountsStackParamList, AccountsStackRoutes.Accounts>) => {
    const handleSelectAccount = (accountKey: AccountKey, tokenSymbol?: EthereumTokenSymbol) => {
        navigation.navigate(AccountsStackRoutes.AccountDetail, {
            accountKey,
            tokenSymbol,
        });
    };

    return (
        <Screen header={<AccountsScreenHeader />}>
            <AccountsList onSelectAccount={handleSelectAccount} />
        </Screen>
    );
};
