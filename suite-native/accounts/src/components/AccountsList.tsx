import React from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { Text } from '@suite-native/atoms';
import {
    AccountsRootState,
    selectAccounts,
    selectAccountsSymbols,
} from '@suite-common/wallet-core';

import { AccountsListGroup } from './AccountsListGroup';

type AccountsListProps = {
    onSelectAccount: (accountKey: string) => void;
};

export const AccountsList = ({ onSelectAccount }: AccountsListProps) => {
    const accountsSymbols = useSelector(selectAccountsSymbols);
    const accounts = useSelector((state: AccountsRootState) => selectAccounts(state));

    if (A.isEmpty(accounts)) return <Text>No accounts found.</Text>;

    return (
        <>
            {accountsSymbols.map(symbol => (
                <AccountsListGroup key={symbol} symbol={symbol} onSelectAccount={onSelectAccount} />
            ))}
        </>
    );
};
