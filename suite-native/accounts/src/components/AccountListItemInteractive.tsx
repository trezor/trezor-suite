import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Box } from '@suite-native/atoms';
import { EthereumTokenSymbol, isEthereumAccountSymbol } from '@suite-native/ethereum-tokens';
import { AccountKey } from '@suite-common/wallet-types';

import { AccountListItem, AccountListItemProps } from './AccountListItem';
import { TokenList } from './TokenList';

interface AccountListItemInteractiveProps extends AccountListItemProps {
    onSelectAccount: (accountKey: AccountKey, tokenSymbol?: EthereumTokenSymbol) => void;
}

export const AccountListItemInteractive = ({
    account,
    onSelectAccount,
}: AccountListItemInteractiveProps) => (
    <Box>
        <TouchableOpacity onPress={() => onSelectAccount(account.key)}>
            <AccountListItem key={account.key} account={account} />
        </TouchableOpacity>
        {isEthereumAccountSymbol(account.symbol) && (
            <TokenList accountKey={account.key} onSelectAccount={onSelectAccount} />
        )}
    </Box>
);
