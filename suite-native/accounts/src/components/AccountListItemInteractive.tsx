import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { ListItem, Text, VStack } from '@suite-native/atoms';
import { selectEthereumAccountsTokens } from '@suite-native/ethereum-tokens';
import { AccountsRootState } from '@suite-common/wallet-core';

import { AccountListItem, AccountListItemProps } from './AccountListItem';

interface AccountListItemInteractiveProps extends AccountListItemProps {
    onSelectAccount: (accountKey: string) => void;
}

export const AccountListItemInteractive = ({
    account,
    onSelectAccount,
}: AccountListItemInteractiveProps) => {
    const accountsTokens = useSelector((state: AccountsRootState) =>
        selectEthereumAccountsTokens(state, account.key),
    );

    console.log(accountsTokens);

    return (
        <TouchableOpacity onPress={() => onSelectAccount(account.key)}>
            <AccountListItem key={account.key} account={account} />
            <VStack>
                {accountsTokens?.map(token => (
                    <Text key={token.name}>{token.name}</Text>
                ))}
            </VStack>
        </TouchableOpacity>
    );
};
