import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Box } from '@suite-native/atoms';
import { AccountKey, TokenSymbol } from '@suite-common/wallet-types';
import { isEthereumAccountSymbol } from '@suite-common/wallet-utils';

import { AccountListItem, AccountListItemProps } from './AccountListItem';
import { TokenList } from './TokenList';

interface AccountListItemInteractiveProps extends AccountListItemProps {
    onSelectAccount: (accountKey: AccountKey, tokenSymbol?: TokenSymbol) => void;
    areTokensDisplayed: boolean;
}

export const AccountListItemInteractive = ({
    account,
    onSelectAccount,
    areTokensDisplayed,
}: AccountListItemInteractiveProps) => (
    <Box>
        <TouchableOpacity onPress={() => onSelectAccount(account.key)}>
            <AccountListItem
                key={account.key}
                account={account}
                areTokensDisplayed={areTokensDisplayed}
            />
        </TouchableOpacity>
        {areTokensDisplayed && isEthereumAccountSymbol(account.symbol) && (
            <TokenList accountKey={account.key} onSelectAccount={onSelectAccount} />
        )}
    </Box>
);
