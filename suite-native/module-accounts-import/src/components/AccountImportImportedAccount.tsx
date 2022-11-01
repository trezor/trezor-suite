import React from 'react';

import { Box, Text } from '@suite-native/atoms';
import { AccountListItem } from '@suite-native/accounts';
import { Account } from '@suite-common/wallet-types';

import { AccountImportSummarySection } from './AccountImportSummarySection';

type AccountImportImportedAccountProps = {
    account: Account;
};

export const AccountImportImportedAccount = ({ account }: AccountImportImportedAccountProps) => (
    <AccountImportSummarySection title="Already imported">
        <Box>
            <Text>Here's what you've got in your account.</Text>
            {account && <AccountListItem account={account} />}
        </Box>
    </AccountImportSummarySection>
);
