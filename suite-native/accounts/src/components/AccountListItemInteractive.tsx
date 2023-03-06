import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { Box, VStack } from '@suite-native/atoms';
import { EthereumTokenSymbol, selectEthereumAccountsTokens } from '@suite-native/ethereum-tokens';
import { AccountsRootState } from '@suite-common/wallet-core';

import { AccountListItem, AccountListItemProps } from './AccountListItem';
import { TokenListItem } from './TokenListItem';

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

    return (
        <Box>
            <TouchableOpacity onPress={() => onSelectAccount(account.key)}>
                <AccountListItem key={account.key} account={account} />
            </TouchableOpacity>
            <VStack>
                {accountsTokens?.map((token, index) => (
                    <TokenListItem
                        key={token.name}
                        symbol={token.symbol as EthereumTokenSymbol}
                        balance={token.balance ?? '0'}
                        isLast={accountsTokens.length - 1 === index}
                    />
                ))}
            </VStack>
        </Box>
    );
};
