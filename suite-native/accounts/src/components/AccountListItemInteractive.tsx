import React from 'react';
import { TouchableOpacity } from 'react-native';

import { AccountListItem, AccountListItemProps } from './AccountListItem';

interface AccountListItemInteractiveProps extends AccountListItemProps {
    onSelectAccount: (accountKey: string) => void;
}

export const AccountListItemInteractive = ({
    account,
    onSelectAccount,
}: AccountListItemInteractiveProps) => (
    <TouchableOpacity onPress={() => onSelectAccount(account.key)}>
        <AccountListItem key={account.key} account={account} />
    </TouchableOpacity>
);
