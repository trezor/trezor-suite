import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Box } from '@suite-native/atoms';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { isEthereumAccountSymbol } from '@suite-common/wallet-utils';

import { AccountListItem, AccountListItemProps } from './AccountListItem';
import { TokenList } from './TokenList';

interface AccountListItemInteractiveProps extends AccountListItemProps {
    onSelectAccount: (accountKey: AccountKey, tokenContract?: TokenAddress) => void;
}

export const AccountListItemInteractive = ({
    account,
    onSelectAccount,
}: AccountListItemInteractiveProps) => (
    <Box>
        <TouchableOpacity onPress={() => onSelectAccount(account.key)}>
            <AccountListItem key={account.key} account={account} areTokensDisplayed />
        </TouchableOpacity>
        {isEthereumAccountSymbol(account.symbol) && (
            <TokenList accountKey={account.key} onSelectAccount={onSelectAccount} />
        )}
    </Box>
);
