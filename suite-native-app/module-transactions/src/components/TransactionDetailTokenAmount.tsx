import { useSelector } from 'react-redux';

import { type FiatRatesRootState, type WalletSettingsRootState } from '@suite-common/wallet-core';
import {
    ExactTokenAmountFormatter,
    TokenToFiatAmountFormatter,
    convertTokenValueToDecimal,
} from '@suite-native/formatters';
import { type TypedTokenTransfer, type WalletAccountTransaction } from '@suite-native/tokens';
import { getTransactionValueSign, selectTransactionFiatRate } from '@suite-native/transactions';
import { useNativeStyles } from '@trezor/styles-native';

import {
    TransactionDetailHeadlineAmount,
    transactionDetailAmountStyle,
} from './TransactionDetailHeadlineAmount';

type TransactionDetailTokenAmountProps = {
    transaction: WalletAccountTransaction;
    tokenTransfer: TypedTokenTransfer;
};

export const TransactionDetailTokenAmount = ({
    transaction,
    tokenTransfer,
}: TransactionDetailTokenAmountProps) => (
    <TransactionDetailHeadlineAmount
        signValue={getTransactionValueSign(tokenTransfer.type)}
        isFailedTx={transaction.type === 'failed'}
    >
        <ExactTokenAmountFormatter
            value={convertTokenValueToDecimal(tokenTransfer.amount, tokenTransfer.decimals)}
            networkSymbol={transaction.symbol}
            contractAddress={tokenTransfer.contract}
            variant="headline-md"
            color="contentPrimary"
        />
    </TransactionDetailHeadlineAmount>
);

export const TransactionDetailTokenFiatAmount = ({
    transaction,
    tokenTransfer,
}: TransactionDetailTokenAmountProps) => {
    const { applyStyle } = useNativeStyles();
    const isFailedTx = transaction.type === 'failed';
    const historicRate = useSelector((state: WalletSettingsRootState & FiatRatesRootState) =>
        selectTransactionFiatRate(state, transaction, tokenTransfer.contract),
    );

    if (!historicRate || historicRate === 0) {
        return null;
    }

    return (
        <TokenToFiatAmountFormatter
            symbol={transaction.symbol}
            contract={tokenTransfer.contract}
            value={tokenTransfer.amount}
            historicRate={historicRate}
            color="contentSecondary"
            useHistoricRate
            style={applyStyle(transactionDetailAmountStyle, { isFailedTx })}
        />
    );
};
