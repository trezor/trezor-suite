import { useSelector } from 'react-redux';
import { AccountKey, Timestamp, TransactionType } from '@suite-common/wallet-types';
import { SignValue } from '@suite-common/suite-types';
import {
    CryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    SignValueFormatter,
} from '@suite-native/formatters';

import { Box } from '@suite-native/atoms';
import {
    AccountsRootState,
    FiatRatesRootState,
    selectHistoricFiatRatesByTimestamp,
    selectIsTestnetAccount,
} from '@suite-common/wallet-core';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { EmptyAmountText } from '@suite-native/formatters/src/components/EmptyAmountText';
import { WalletAccountTransaction } from '@suite-native/tokens';

import { useTransactionFiatRate } from '../../hooks/useTransactionFiatRate';
import { TokenTransferListItem } from './TokenTransferListItem';
import { TransactionListItemContainer } from './TransactionListItemContainer';
import { getTransactionValueSign } from '../../utils';

type TransactionListItemProps = {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    areTokensIncluded: boolean;
    isFirst?: boolean;
    isLast?: boolean;
};

export const TransactionListItemValues = ({
    accountKey,
    transaction,
}: {
    accountKey: AccountKey;
    transaction: WalletAccountTransaction;
}) => {
    const isTestnetAccount = useSelector((state: AccountsRootState) =>
        selectIsTestnetAccount(state, accountKey),
    );

    const historicRate = useTransactionFiatRate({ accountKey, transaction });

    return (
        <>
            {isTestnetAccount ? (
                <EmptyAmountText />
            ) : (
                <Box flexDirection="row">
                    <SignValueFormatter value={getTransactionValueSign(transaction.type)} />

                    <CryptoToFiatAmountFormatter
                        value={transaction.amount}
                        network={transaction.symbol}
                        historicRate={historicRate}
                        useHistoricRate
                    />
                </Box>
            )}

            <CryptoAmountFormatter
                value={transaction.amount}
                network={transaction.symbol}
                isBalance={false}
                numberOfLines={1}
                adjustsFontSizeToFit
            />
        </>
    );
};

export const TransactionListItem = ({
    transaction,
    accountKey,
    areTokensIncluded,
    isFirst = false,
    isLast = false,
}: TransactionListItemProps) => {
    const includedCoinsCount = areTokensIncluded ? transaction.tokens.length : 0;

    const isTokenOnlyTransaction =
        areTokensIncluded && transaction.amount === '0' && transaction.tokens.length !== 0;

    if (isTokenOnlyTransaction)
        return (
            <TokenTransferListItem
                transaction={transaction}
                accountKey={accountKey}
                txid={transaction.txid}
                tokenTransfer={transaction.tokens[0]}
                includedCoinsCount={transaction.tokens.length - 1}
            />
        );

    return (
        <TransactionListItemContainer
            networkSymbol={transaction.symbol}
            txid={transaction.txid}
            transactionType={transaction.type}
            accountKey={accountKey}
            includedCoinsCount={includedCoinsCount}
            isFirst={isFirst}
            isLast={isLast}
        >
            <TransactionListItemValues accountKey={accountKey} transaction={transaction} />
        </TransactionListItemContainer>
    );
};

TransactionListItem.displayName = 'TransactionListItem';
