import React from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { Box, Text } from '@suite-native/atoms';
import { selectAccounts } from '@suite-common/wallet-core';

import { AccountListItem } from './AccountListItem';

export const AccountsList = () => {
    const accounts = useSelector(selectAccounts);

    if (A.isEmpty(accounts)) return <Text>No accounts found.</Text>;

    return (
        <Box>
            {accounts.map(account => (
                <AccountListItem key={account.key} account={account} />
            ))}
        </Box>
    );
};
