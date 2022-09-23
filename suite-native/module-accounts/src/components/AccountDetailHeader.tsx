import React, { memo } from 'react';

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
        <Box marginBottom="large">
            <Text variant="titleSmall">Transactions</Text>
        </Box>
    </>
));
