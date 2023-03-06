import React from 'react';
import { useSelector } from 'react-redux';

import { VStack } from '@suite-native/atoms';
import { EthereumTokenSymbol, selectEthereumAccountsTokens } from '@suite-native/ethereum-tokens';
import { AccountsRootState, selectAccountLabel } from '@suite-common/wallet-core';

import { TokenListItem } from './TokenListItem';

export const TokenList = ({ accountKey }: { accountKey: string }) => {
    const accountTokens = useSelector((state: AccountsRootState) =>
        selectEthereumAccountsTokens(state, accountKey),
    );
    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );

    return (
        <VStack>
            {accountTokens?.map((token, index) => (
                <TokenListItem
                    key={token.name}
                    symbol={token.symbol as EthereumTokenSymbol}
                    balance={token.balance ?? '0'}
                    label={`${accountLabel} ${token.name}`}
                    isLast={accountTokens?.length - 1 === index}
                />
            ))}
        </VStack>
    );
};
