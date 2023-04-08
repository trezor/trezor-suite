import React, { memo } from 'react';

import { AccountKey } from '@suite-common/wallet-types';
import { EthereumTokenTransfer } from '@suite-native/ethereum-tokens';
import {
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
} from '@suite-native/formatters';

import { TransactionListItemContainer } from './TransactionListItemContainer';
import { signValueMap } from './TransactionListItem';

type TokenTransferListItemProps = {
    txid: string;
    tokenTransfer: EthereumTokenTransfer;
    accountKey: AccountKey;
    isFirst?: boolean;
    isLast?: boolean;
};

export const TokenTransferListItem = memo(
    ({ txid, accountKey, tokenTransfer, isFirst, isLast }: TokenTransferListItemProps) => {
        const tokenSymbol = tokenTransfer.symbol;

        return (
            <TransactionListItemContainer
                symbol={tokenSymbol}
                transactionType={tokenTransfer.type}
                txid={txid}
                accountKey={accountKey}
                isFirst={isFirst}
                isLast={isLast}
            >
                <EthereumTokenToFiatAmountFormatter
                    value={tokenTransfer.amount}
                    ethereumToken={tokenSymbol}
                    decimals={tokenTransfer.decimals}
                    signValue={signValueMap[tokenTransfer.type]}
                />
                <EthereumTokenAmountFormatter
                    value={tokenTransfer.amount}
                    ethereumToken={tokenSymbol}
                    decimals={tokenTransfer.decimals}
                />
            </TransactionListItemContainer>
        );
    },
);
