import React from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { VStack } from '@suite-native/atoms';
import { selectEthereumAccountsTokensWithBalance } from '@suite-native/ethereum-tokens';
import { AccountsRootState, selectAccountLabel } from '@suite-common/wallet-core';

import { TokenListItem } from './TokenListItem';

export const TokenList = ({ accountKey }: { accountKey: string }) => {
    const accountTokens = useSelector((state: AccountsRootState) =>
        selectEthereumAccountsTokensWithBalance(state, accountKey),
    );
    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );

    if (A.isEmpty(accountTokens)) return null;

    return (
        <VStack>
            {accountTokens.map((token, index) => (
                <TokenListItem
                    key={token.name}
                    symbol={token.symbol}
                    balance={token.balance}
                    label={`${accountLabel} ${token.name}`}
                    isLast={accountTokens?.length - 1 === index}
                />
            ))}
        </VStack>
    );
};
