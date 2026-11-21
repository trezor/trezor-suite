import { useSelector } from 'react-redux';

import { type FiatRatesRootState, type WalletSettingsRootState } from '@suite-common/wallet-core';
import { CryptoToFiatAmountFormatter, ExactCryptoAmountFormatter } from '@suite-native/formatters';
import { type WalletAccountTransaction } from '@suite-native/tokens';
import { getTransactionValueSign, selectTransactionFiatRate } from '@suite-native/transactions';
import { useNativeStyles } from '@trezor/styles-native';

import {
    TransactionDetailHeadlineAmount,
    transactionDetailAmountStyle,
} from './TransactionDetailHeadlineAmount';

type TransactionDetailCryptoAmountProps = {
    transaction: WalletAccountTransaction;
    amount: string;
};

export const TransactionDetailCryptoAmount = ({
    transaction,
    amount,
}: TransactionDetailCryptoAmountProps) => {
    const isSolanaUnstakeTx = transaction?.solanaSpecific?.stakeOperation?.type === 'unstake';

    if (isSolanaUnstakeTx) {
        return null;
    }

    return (
        <TransactionDetailHeadlineAmount
            signValue={getTransactionValueSign(transaction.type)}
            isFailedTx={transaction.type === 'failed'}
        >
            <ExactCryptoAmountFormatter
                value={amount}
                symbol={transaction.symbol}
                isBalance={false}
                variant="headline-md"
                color="contentPrimary"
            />
        </TransactionDetailHeadlineAmount>
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
            style={applyStyle(transactionDetailAmountStyle, { isFailedTx })}
        />
    );
};
