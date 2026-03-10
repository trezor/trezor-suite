import { useSelector } from 'react-redux';

import { TokenDefinitionsRootState } from '@suite-common/token-definitions';
import {
    AccountsRootState,
    FiatRatesRootState,
    TransactionsRootState,
    WalletSettingsRootState,
    selectIsPhishingTransaction,
    selectIsTestnetAccount,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { signatureToStakeTypeMap } from '@suite-common/wallet-utils';
import { Box, VStack } from '@suite-native/atoms';
import {
    CryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    EmptyAmountText,
    SignValueFormatter,
} from '@suite-native/formatters';
import { WalletAccountTransaction } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { selectTransactionFiatRate } from '../selectors';
import { getTransactionValueSign } from '../utils';
import { InstantStakeBanner } from './InstantStakeBanner';
import { TokenTransferListItem } from './TokenTransferListItem';
import { TransactionListItemContainer } from './TransactionListItemContainer';

type TransactionListItemProps = {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
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

type TransactionListItemValuesProps = {
    accountKey: AccountKey;
    transaction: WalletAccountTransaction;
};

export const TransactionListItemValues = ({
    accountKey,
    transaction,
}: TransactionListItemValuesProps) => {
    const isTestnetAccount = useSelector((state: AccountsRootState) =>
        selectIsTestnetAccount(state, accountKey),
    );

    const isPhishingTransaction = useSelector(
        (state: TokenDefinitionsRootState & TransactionsRootState) =>
            selectIsPhishingTransaction(state, transaction.txid, accountKey),
    );

    const { applyStyle } = useNativeStyles();

    const historicRate = useSelector((state: WalletSettingsRootState & FiatRatesRootState) =>
        selectTransactionFiatRate(state, transaction),
    );
    const isFailedTx = transaction.type === 'failed';
    const sign = getTransactionValueSign(transaction.type);

    return (
        <VStack spacing="sp4" alignItems="flex-end">
            {isTestnetAccount ? (
                <EmptyAmountText />
            ) : (
                <Box flexDirection="row">
                    {!isFailedTx && <SignValueFormatter value={sign} />}
                    <CryptoToFiatAmountFormatter
                        value={transaction.amount}
                        symbol={transaction.symbol}
                        historicRate={historicRate}
                        useHistoricRate
                        isForcedDiscreetMode={isPhishingTransaction}
                        style={applyStyle(failedTxStyle, { isFailedTx })}
                    />
                </Box>
            )}

            <CryptoAmountFormatter
                value={transaction.amount}
                symbol={transaction.symbol}
                isBalance={false}
                numberOfLines={1}
                adjustsFontSizeToFit
                isForcedDiscreetMode={isPhishingTransaction}
                variant="body-sm"
                color="textSubdued"
            />
        </VStack>
    );
};

export const TransactionListItem = ({
    transaction,
    accountKey,
    isFirst = false,
    isLast = false,
}: TransactionListItemProps) => {
    const includedCoinsCount = transaction.tokens.length;

    const isTokenOnlyTransaction = transaction.amount === '0' && transaction.tokens.length !== 0;

    if (isTokenOnlyTransaction)
        return (
            <TokenTransferListItem
                transaction={transaction}
                accountKey={accountKey}
                txid={transaction.txid}
                tokenTransfer={transaction.tokens[0]}
                includedCoinsCount={transaction.tokens.length - 1}
                isFirst={isFirst}
                isLast={isLast}
            />
        );

    const stakeOperationType =
        signatureToStakeTypeMap[transaction.ethereumSpecific?.parsedData?.methodId ?? ''] ??
        transaction.solanaSpecific?.stakeOperation?.type;

    return (
        <TransactionListItemContainer
            symbol={transaction.symbol}
            txid={transaction.txid}
            transactionType={transaction.type}
            stakeOperationType={stakeOperationType}
            accountKey={accountKey}
            includedCoinsCount={includedCoinsCount}
            isFirst={isFirst}
            isLast={isLast}
            banner={<InstantStakeBanner accountKey={accountKey} transaction={transaction} />}
        >
            <TransactionListItemValues accountKey={accountKey} transaction={transaction} />
        </TransactionListItemContainer>
    );
};

TransactionListItem.displayName = 'TransactionListItem';
