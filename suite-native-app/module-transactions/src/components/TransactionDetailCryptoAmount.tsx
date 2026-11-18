import { useSelector } from 'react-redux';

import { type FiatRatesRootState, type WalletSettingsRootState } from '@suite-common/wallet-core';
import { Text } from '@suite-native/atoms';
import {
    CryptoToFiatAmountFormatter,
    ExactCryptoAmountFormatter,
    SignValueFormatter,
} from '@suite-native/formatters';
import { type WalletAccountTransaction } from '@suite-native/tokens';
import { getTransactionValueSign, selectTransactionFiatRate } from '@suite-native/transactions';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type TransactionDetailCryptoAmountProps = {
    transaction: WalletAccountTransaction;
    amount: string;
};

const amountStyle = prepareNativeStyle<{ isFailedTx: boolean }>((_, { isFailedTx }) => ({
    // A row item does not shrink by default, so adjustsFontSizeToFit would never get a narrower width.
    flexShrink: 1,
    extend: {
        condition: isFailedTx,
        style: {
            textDecorationLine: 'line-through',
        },
    },
}));

export const TransactionDetailCryptoAmount = ({
    transaction,
    amount,
}: TransactionDetailCryptoAmountProps) => {
    const { applyStyle } = useNativeStyles();
    const isFailedTx = transaction.type === 'failed';
    const isSolanaUnstakeTx = transaction?.solanaSpecific?.stakeOperation?.type === 'unstake';
    const signValue = getTransactionValueSign(transaction.type);

    if (isSolanaUnstakeTx) {
        return null;
    }

    // One text run, so the sign shrinks along with the amount and stays aligned with it.
    return (
        <Text
            variant="headline-md"
            numberOfLines={1}
            adjustsFontSizeToFit
            style={applyStyle(amountStyle, { isFailedTx })}
        >
            {!isFailedTx && (
                <SignValueFormatter
                    color="contentPrimary"
                    value={signValue}
                    variant="headline-md"
                />
            )}
            <ExactCryptoAmountFormatter
                value={amount}
                symbol={transaction.symbol}
                isBalance={false}
                variant="headline-md"
                color="contentPrimary"
            />
        </Text>
    );
};

export const TransactionDetailCryptoFiatAmount = ({
    transaction,
    amount,
}: TransactionDetailCryptoAmountProps) => {
    const { applyStyle } = useNativeStyles();
    const isFailedTx = transaction.type === 'failed';
    const historicRate = useSelector((state: WalletSettingsRootState & FiatRatesRootState) =>
        selectTransactionFiatRate(state, transaction),
    );

    if (!historicRate || historicRate === 0) {
        return null;
    }

    return (
        <CryptoToFiatAmountFormatter
            value={amount}
            symbol={transaction.symbol}
            historicRate={historicRate}
            color="contentSecondary"
            useHistoricRate
            style={applyStyle(amountStyle, { isFailedTx })}
        />
    );
};
