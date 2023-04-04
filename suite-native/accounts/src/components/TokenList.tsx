import React from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { VStack } from '@suite-native/atoms';
import {
    EthereumTokenSymbol,
    selectEthereumAccountsTokensWithBalance,
} from '@suite-native/ethereum-tokens';
import { AccountsRootState, selectAccountLabel } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';

import { TokenListItem } from './TokenListItem';

type TokenListProps = {
    accountKey: string;
    onSelectAccount: (accountKey: AccountKey, tokenSymbol?: EthereumTokenSymbol) => void;
};

export const TokenList = ({ accountKey, onSelectAccount }: TokenListProps) => {
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
                    accountKey={accountKey}
                    key={token.name}
                    symbol={token.symbol}
                    onSelectAccount={onSelectAccount}
                    balance={token.balance}
                    label={`${accountLabel} ${token.name}`}
                    isLast={accountTokens?.length - 1 === index}
                />
            ))}
        </VStack>
    );
};
