import React, { memo } from 'react';

import { AccountKey } from '@suite-common/wallet-types';
import { EthereumTokenTransfer } from '@suite-native/ethereum-tokens';
import {
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
} from '@suite-native/formatters';

import { TransactionListItemContainer } from './TransactionListItemContainer';
import { signValueMap } from '../TransactionDetail/TransactionDetailHeader';

type TokenTransferListItemProps = {
    txid: string;
    tokenTransfer: EthereumTokenTransfer;
    accountKey: AccountKey;
    includedCoinsCount?: number;
    isFirst?: boolean;
    isLast?: boolean;
};

export const TokenTransferListItemValues = ({
    tokenTransfer,
}: {
    tokenTransfer: EthereumTokenTransfer;
}) => (
    <>
        <EthereumTokenToFiatAmountFormatter
            value={tokenTransfer.amount}
            contract={tokenTransfer.contract}
            ethereumToken={tokenTransfer.symbol}
            decimals={tokenTransfer.decimals}
            signValue={signValueMap[tokenTransfer.type]}
            numberOfLines={1}
            ellipsizeMode="tail"
        />
        <EthereumTokenAmountFormatter
            value={tokenTransfer.amount}
            ethereumToken={tokenTransfer.symbol}
            decimals={tokenTransfer.decimals}
            numberOfLines={1}
            ellipsizeMode="tail"
        />
    </>
);

export const TokenTransferListItem = memo(
    ({
        txid,
        accountKey,
        tokenTransfer,
        includedCoinsCount = 0,
        isFirst,
        isLast,
    }: TokenTransferListItemProps) => (
        <TransactionListItemContainer
            tokenTransfer={tokenTransfer}
            transactionType={tokenTransfer.type}
            txid={txid}
            includedCoinsCount={includedCoinsCount}
            accountKey={accountKey}
            isFirst={isFirst}
            isLast={isLast}
        >
            <TokenTransferListItemValues tokenTransfer={tokenTransfer} />
        </TransactionListItemContainer>
    ),
);
