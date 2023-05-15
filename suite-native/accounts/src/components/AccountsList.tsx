import React from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { Text } from '@suite-native/atoms';
import { selectAccounts, selectAccountsSymbols } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';

import { AccountsListGroup } from './AccountsListGroup';

type AccountsListProps = {
    onSelectAccount: (accountKey: AccountKey, tokenContract?: TokenAddress) => void;
};

export const AccountsList = ({ onSelectAccount }: AccountsListProps) => {
    const accountsSymbols = useSelector(selectAccountsSymbols);
    const accounts = useSelector(selectAccounts);

    if (A.isEmpty(accounts)) return <Text>No accounts found.</Text>;

    return (
        <>
            {accountsSymbols.map(symbol => (
                <AccountsListGroup key={symbol} symbol={symbol} onSelectAccount={onSelectAccount} />
            ))}
        </>
    );
};
