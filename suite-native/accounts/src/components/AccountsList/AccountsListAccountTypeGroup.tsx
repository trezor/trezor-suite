import React from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { type AccountType, type NetworkSymbol } from '@suite-common/wallet-config';
import { Card } from '@suite-native/atoms';

import { AccountsListItem } from './AccountsListItem';
import {
    type NativeAccountsRootState,
    selectFilteredDeviceAccountsByNetworkSymbolAndAccountType,
} from '../../selectors';
import { type OnSelectAccount } from '../../types';

type AccountsListAccountTypeGroupProps = {
    networkSymbol: NetworkSymbol;
    accountType: AccountType;
    searchValue: string;
    isSendFlow: boolean;
    onSelectAccount: OnSelectAccount;
};

const AccountsListAccountTypeGroupComponent = ({
    networkSymbol,
    accountType,
    searchValue,
    isSendFlow,
    onSelectAccount,
}: AccountsListAccountTypeGroupProps) => {
    const accounts = useSelector((state: NativeAccountsRootState) =>
        selectFilteredDeviceAccountsByNetworkSymbolAndAccountType(
            state,
            searchValue,
            isSendFlow,
            networkSymbol,
            accountType,
        ),
    );

    if (A.isEmpty(accounts)) return null;

    return (
        <Card noPadding>
            {accounts.map(account => (
                <AccountsListItem key={account.key} account={account} onPress={onSelectAccount} />
            ))}
        </Card>
    );
};

export const AccountsListAccountTypeGroup = React.memo(AccountsListAccountTypeGroupComponent);

AccountsListAccountTypeGroup.displayName = 'AccountsListAccountTypeGroup';
