import React, { memo } from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { AccountBalance } from '@suite-native/accounts';
import { Box, Text } from '@suite-native/atoms';
import { AccountKey } from '@suite-common/suite-types';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';

import { AccountDetailGraph } from './AccountDetailGraph';

type AccountDetailHeaderProps = {
    accountKey: AccountKey;
};

export const TransactionListHeader = memo(({ accountKey }: AccountDetailHeaderProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const accountHasTransactions = A.isNotEmpty(account?.history.transactions ?? []);

    return (
        <>
            <AccountBalance accountKey={accountKey} />
            {accountHasTransactions && <AccountDetailGraph accountKey={accountKey} />}
            <Box marginBottom="large">
                <Text variant="titleSmall">Transactions</Text>
            </Box>
        </>
    );
});
