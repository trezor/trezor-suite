import { useSelector } from 'react-redux';

import { AccountKey, TransactionType } from '@suite-common/wallet-types';
import {
    CryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    SignValueFormatter,
} from '@suite-native/formatters';
import { SignValue } from '@suite-common/suite-types';
import { Box } from '@suite-native/atoms';
import { AccountsRootState, selectIsTestnetAccount } from '@suite-common/wallet-core';
import { EmptyAmountText } from '@suite-native/formatters/src/components/EmptyAmountText';
import { WalletAccountTransaction } from '@suite-native/ethereum-tokens';

import { TransactionListItemContainer } from './TransactionListItemContainer';
import { TokenTransferListItem } from './TokenTransferListItem';

type TransactionListItemProps = {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    areTokensIncluded: boolean;
    isFirst?: boolean;
    isLast?: boolean;
};

export const signValueMap = {
    recv: 'positive',
    sent: 'negative',
    self: undefined,
    joint: undefined,
    contract: undefined,
    failed: undefined,
    unknown: undefined,
} as const satisfies Record<TransactionType, SignValue | undefined>;

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

    return (
        <>
            {isTestnetAccount ? (
                <EmptyAmountText />
            ) : (
                <Box flexDirection="row">
                    <SignValueFormatter value={signValueMap[transaction.type]} />

                    <CryptoToFiatAmountFormatter
                        value={transaction.amount}
                        network={transaction.symbol}
                        customRates={transaction.rates}
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
