import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Box } from '@suite-native/atoms';

import { AccountListItem, AccountListItemProps } from './AccountListItem';
import { TokenList } from './TokenList';

interface AccountListItemInteractiveProps extends AccountListItemProps {
    onSelectAccount: (accountKey: string) => void;
}

export const AccountListItemInteractive = ({
    account,
    onSelectAccount,
}: AccountListItemInteractiveProps) => (
    <Box>
        <TouchableOpacity onPress={() => onSelectAccount(account.key)}>
            <AccountListItem key={account.key} account={account} />
        </TouchableOpacity>
        {account.symbol === 'eth' && <TokenList accountKey={account.key} />}
    </Box>
);
