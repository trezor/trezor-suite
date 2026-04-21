import { useSelector } from 'react-redux';

import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import {
    type FiatRatesRootState,
    type PhishingRootState,
    type TransactionsRootState,
    type WalletSettingsRootState,
    selectIsPhishingTransaction,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { TokenAmountFormatter, TokenToFiatAmountFormatter } from '@suite-native/formatters';
import { type TypedTokenTransfer, type WalletAccountTransaction } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { selectTransactionFiatRate } from '../selectors';
import { getTransactionValueSign } from '../utils';
import { TransactionListItemContainer } from './TransactionListItemContainer';

const failedTxStyle = prepareNativeStyle<{ isFailedTx: boolean }>((_, { isFailedTx }) => ({
    extend: {
        condition: isFailedTx,
        style: {
            textDecorationLine: 'line-through',
        },
    },
}));

type TokenTransferListItemValuesProps = {
    tokenTransfer: TypedTokenTransfer;
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
};

export const TokenTransferListItemValues = ({
    tokenTransfer,
    transaction,
    accountKey,
}: TokenTransferListItemValuesProps) => {
    const historicRate = useSelector((state: WalletSettingsRootState & FiatRatesRootState) =>
        selectTransactionFiatRate(state, transaction, tokenTransfer?.contract),
    );

    const { isPhishing: isPhishingTransaction } = useSelector(
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
                color="contentSecondary"
            />
        </>
    );
};

type TokenTransferListItemProps = {
    tokenTransfer: TypedTokenTransfer;
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    includedCoinsCount?: number;
    isFirst?: boolean;
    isLast?: boolean;
};

export const TokenTransferListItem = ({
    accountKey,
    transaction,
    tokenTransfer,
    includedCoinsCount = 0,
    isFirst,
    isLast,
}: TokenTransferListItemProps) => {
    const isFailedTxn = transaction.type === 'failed';

    return (
        <TransactionListItemContainer
            tokenTransfer={tokenTransfer}
            transactionType={isFailedTxn ? 'failed' : tokenTransfer.type}
            transaction={transaction}
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
