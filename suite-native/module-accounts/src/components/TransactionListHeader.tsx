import React, { memo } from 'react';
import { useSelector } from 'react-redux';

import { AccountBalance } from '@suite-native/accounts';
import { Box, Button, Divider, Text } from '@suite-native/atoms';
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

    const accountHasTransactions = !!account?.history.total ?? false;

    return (
        <>
            <AccountBalance accountKey={accountKey} />
            {accountHasTransactions && (
                <>
                    <AccountDetailGraph accountKey={accountKey} />
                    <Box marginBottom="large" paddingHorizontal="medium">
                        <Button iconName="receive" size="large">
                            Receive
                        </Button>
                    </Box>
                    <Divider />
                </>
            )}
            <Box marginVertical="medium" marginHorizontal="medium">
                <Text variant="titleSmall">Transactions</Text>
            </Box>
        </>
    );
});
