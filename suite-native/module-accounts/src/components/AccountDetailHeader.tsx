import React, { memo } from 'react';

import { Graph } from '@suite-native/graph';
import { AccountBalance } from '@suite-native/accounts';
import { Box, Text } from '@suite-native/atoms';
import { AccountKey } from '@suite-common/suite-types';

type AccountDetailHeaderProps = {
    accountKey: AccountKey;
    accountName?: string;
};

export const AccountDetailHeader = memo(({ accountKey, accountName }: AccountDetailHeaderProps) => (
    <>
        <AccountBalance accountKey={accountKey} accountName={accountName} />
        <Graph />
        <Box marginBottom="large">
            <Text variant="titleSmall">Transactions</Text>
        </Box>
    </>
));
