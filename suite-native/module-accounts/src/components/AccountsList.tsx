import React from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { Box, Text } from '@suite-native/atoms';
import {
    AccountsRootState,
    selectAccounts,
    selectAccountsByNetworkSymbols,
} from '@suite-common/wallet-core';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { AccountListItem } from './AccountListItem';

type AccountsListProps = {
    assets: NetworkSymbol[];
};

export const AccountsList = ({ assets }: AccountsListProps) => {
    /*
    TODO improvement: add an array somewhere of all enabled networks for mobile app
     and pass it to selectAccountsByNetworkSymbols as default which will select everything.
     */
    const accounts = useSelector((state: AccountsRootState) =>
        A.isEmpty(assets) ? selectAccounts(state) : selectAccountsByNetworkSymbols(state, assets),
    );

    if (A.isEmpty(accounts)) return <Text>No accounts found.</Text>;

    return (
        <Box>
            {accounts.map(account => (
                <AccountListItem key={account.key} account={account} />
            ))}
        </Box>
    );
};
