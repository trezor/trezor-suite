import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type SignOperator } from '@suite-common/suite-types';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type Target,
    type WalletSettingsRootState,
    selectIsTestnetAccount,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getTxOperation } from '@suite-common/wallet-utils';
import { Box, VStack } from '@suite-native/atoms';
import {
    CompactCryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    EmptyAmountText,
    SignValueFormatter,
} from '@suite-native/formatters';
import { type WalletAccountTransaction } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { selectTransactionFiatRate } from '../selectors';
import { getTransactionValueSign } from '../utils';

type TransactionListItemValuesProps = {
    accountKey: AccountKey;
    transaction: WalletAccountTransaction;
    isPhishingTransaction: boolean;
    amount: string;
    operation?: SignOperator | null;
};

const failedTxStyle = prepareNativeStyle<{ isFailedTx: boolean }>((_, { isFailedTx }) => ({
    extend: {
        condition: isFailedTx,
        style: {
            textDecorationLine: 'line-through',
        },
    },
}));

export const TransactionListItemValues = ({
    accountKey,
    transaction,
    isPhishingTransaction,
    amount,
    operation,
}: TransactionListItemValuesProps) => {
    const isTestnetAccount = useSelector((state: AccountsRootState) =>
        selectIsTestnetAccount(state, accountKey),
    );

    const { applyStyle } = useNativeStyles();

    const historicRate = useSelector((state: WalletSettingsRootState & FiatRatesRootState) =>
        selectTransactionFiatRate(state, transaction),
    );
    const isFailedTx = transaction.type === 'failed';
    const sign = operation || getTransactionValueSign(transaction.type);

    return (
        <VStack spacing="sp4" alignItems="flex-end">
            {isTestnetAccount ? (
                <EmptyAmountText />
            ) : (
                <Box flexDirection="row">
                    {!isFailedTx && !isPhishingTransaction && <SignValueFormatter value={sign} />}
                    <CryptoToFiatAmountFormatter
                        value={amount}
                        symbol={transaction.symbol}
                        historicRate={historicRate}
                        useHistoricRate={!!historicRate}
                        isForcedDiscreetMode={isPhishingTransaction}
                        style={applyStyle(failedTxStyle, { isFailedTx })}
                    />
                </Box>
            )}
            <CompactCryptoAmountFormatter
                value={amount}
                symbol={transaction.symbol}
                isBalance={false}
                numberOfLines={1}
                sign={operation === 'positive' ? '+' : '-'}
                adjustsFontSizeToFit
                isForcedDiscreetMode={isPhishingTransaction}
                variant="body-sm"
                color="contentSecondary"
            />
        </VStack>
    );
};

type TransactionTargetProps = Target & {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    isActionDisabled?: boolean;
    isPhishingTransaction?: boolean;
};

export const TransactionTarget = ({
    transaction,
    type,
    payload,
    accountKey,
    isPhishingTransaction,
}: TransactionTargetProps) => {
    const isSolanaUnstakeTx = transaction?.solanaSpecific?.stakeOperation?.type === 'unstake';

    // formatting is handled in a child component
    const amount = useMemo(() => {
        if (isSolanaUnstakeTx) return null;
        switch (type) {
            case 'target':
            case 'internal':
            case 'token':
                return payload.amount;
            default:
                return exhaustive(type);
        }
    }, [type, payload, isSolanaUnstakeTx]);

    const operation = useMemo(() => {
        switch (type) {
            case 'target':
                return getTxOperation(transaction.type);
            case 'internal':
            case 'token':
                return getTxOperation(payload.type);
            default:
                return exhaustive(type);
        }
    }, [transaction.type, payload, type]);

    if (new BigNumber(amount ?? '0').lte(0)) return null;

    return (
        <TransactionListItemValues
            transaction={transaction}
            amount={amount!}
            operation={operation}
            accountKey={accountKey}
            isPhishingTransaction={!!isPhishingTransaction}
        />
    );
};
