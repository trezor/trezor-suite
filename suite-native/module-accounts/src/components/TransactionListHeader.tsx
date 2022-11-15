import React, { memo } from 'react';
import { useSelector } from 'react-redux';

import { useAtom } from 'jotai';

import { Box, Button, Divider, Text } from '@suite-native/atoms';
import { AccountKey } from '@suite-common/suite-types';
import { AccountsRootState, selectHasAccountTransactions } from '@suite-common/wallet-core';
import { isSendReceiveActionsVisibleAtom } from '@suite-native/navigation';

import { AccountDetailGraph } from './AccountDetailGraph';
import { AccountBalance } from './AccountBalance';

type AccountDetailHeaderProps = {
    accountKey: AccountKey;
};

export const TransactionListHeader = memo(({ accountKey }: AccountDetailHeaderProps) => {
    const [_, setIsSendReceiveActionsVisible] = useAtom(isSendReceiveActionsVisibleAtom);
    const accountHasTransactions = useSelector((state: AccountsRootState) =>
        selectHasAccountTransactions(state, accountKey),
    );

    return (
        <>
            <AccountBalance accountKey={accountKey} />
            {accountHasTransactions && (
                <>
                    <AccountDetailGraph accountKey={accountKey} />
                    <Box marginBottom="large" paddingHorizontal="medium">
                        <Button
                            iconName="receive"
                            size="large"
                            onPress={() => setIsSendReceiveActionsVisible(true)}
                        >
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
