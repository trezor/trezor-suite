import { useSelector } from 'react-redux';

import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type PhishingRootState,
    type TransactionsRootState,
    type WalletSettingsRootState,
    selectAccountNetworkSymbol,
    selectIsPhishingTransaction,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { TokenAmountFormatter, TokenToFiatAmountFormatter } from '@suite-native/formatters';
import { type TypedTokenTransfer, type WalletAccountTransaction } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { selectTransactionFiatRate } from '../selectors';
import { getTransactionValueSign } from '../utils';
import { TransactionListItemContainer } from './TransactionListItemContainer';

type TokenTransferListItemProps = {
    txid: string;
    tokenTransfer: TypedTokenTransfer;
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    includedCoinsCount?: number;
    isFirst?: boolean;
    isLast?: boolean;
};

const failedTxStyle = prepareNativeStyle<{ isFailedTx: boolean }>((_, { isFailedTx }) => ({
    extend: {
        condition: isFailedTx,
        style: {
            textDecorationLine: 'line-through',
        },
    },
}));

export const TokenTransferListItemValues = ({
    tokenTransfer,
    transaction,
    accountKey,
}: {
    tokenTransfer: TypedTokenTransfer;
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
}) => {
    const historicRate = useSelector((state: WalletSettingsRootState & FiatRatesRootState) =>
        selectTransactionFiatRate(state, transaction, tokenTransfer?.contract),
    );

    const isPhishingTransaction = useSelector(
        (
            state: TokenDefinitionsRootState &
                TransactionsRootState &
                FiatRatesRootState &
                PhishingRootState,
        ) => selectIsPhishingTransaction(state, transaction.txid, accountKey),
    );

    const { applyStyle } = useNativeStyles();

    const isFailedTx = transaction.type === 'failed';

    if (!tokenTransfer?.amount) return;

    return (
        <>
            <TokenToFiatAmountFormatter
                symbol={transaction.symbol}
                value={tokenTransfer.amount}
                contract={tokenTransfer.contract}
                decimals={tokenTransfer.decimals}
                signValue={isFailedTx ? undefined : getTransactionValueSign(tokenTransfer.type)}
                numberOfLines={1}
                ellipsizeMode="tail"
                historicRate={historicRate}
                useHistoricRate
                isForcedDiscreetMode={isPhishingTransaction}
                style={applyStyle(failedTxStyle, { isFailedTx })}
            />
            <TokenAmountFormatter
                value={tokenTransfer.amount}
                tokenSymbol={tokenTransfer.symbol}
                decimals={tokenTransfer.decimals}
                numberOfLines={1}
                ellipsizeMode="tail"
                isPhishingTransaction={isPhishingTransaction}
                variant="body-sm"
                color="textSubdued"
            />
        </>
    );
};

export const TokenTransferListItem = ({
    txid,
    accountKey,
    transaction,
    tokenTransfer,
    includedCoinsCount = 0,
    isFirst,
    isLast,
}: TokenTransferListItemProps) => {
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const isFailedTxn = transaction.type === 'failed';

    return (
        <TransactionListItemContainer
            symbol={symbol ?? undefined}
            tokenTransfer={tokenTransfer}
            transactionType={isFailedTxn ? 'failed' : tokenTransfer.type}
            txid={txid}
            includedCoinsCount={includedCoinsCount}
            accountKey={accountKey}
            isFirst={isFirst}
            isLast={isLast}
        >
            <TokenTransferListItemValues
                tokenTransfer={tokenTransfer}
                transaction={transaction}
                accountKey={accountKey}
            />
        </TransactionListItemContainer>
    );
};
