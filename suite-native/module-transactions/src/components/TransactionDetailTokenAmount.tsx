import { useSelector } from 'react-redux';

import { type FiatRatesRootState, type WalletSettingsRootState } from '@suite-common/wallet-core';
import {
    SignValueFormatter,
    TokenAmountFormatter,
    TokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { type TypedTokenTransfer, type WalletAccountTransaction } from '@suite-native/tokens';
import { getTransactionValueSign, selectTransactionFiatRate } from '@suite-native/transactions';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type TransactionDetailTokenAmountProps = {
    transaction: WalletAccountTransaction;
    tokenTransfer: TypedTokenTransfer;
};

const failedTxStyle = prepareNativeStyle<{ isFailedTx: boolean }>((_, { isFailedTx }) => ({
    extend: {
        condition: isFailedTx,
        style: {
            textDecorationLine: 'line-through',
        },
    },
}));

export const TransactionDetailTokenAmount = ({
    transaction,
    tokenTransfer,
}: TransactionDetailTokenAmountProps) => {
    const { applyStyle } = useNativeStyles();
    const isFailedTx = transaction.type === 'failed';
    const signValue = getTransactionValueSign(tokenTransfer.type);

    return (
        <>
            {!isFailedTx && (
                <SignValueFormatter
                    color="contentPrimary"
                    value={signValue}
                    variant="headline-md"
                />
            )}

            <TokenAmountFormatter
                value={tokenTransfer.amount}
                tokenSymbol={tokenTransfer.symbol}
                decimals={tokenTransfer.decimals}
                variant="headline-md"
                color="contentPrimary"
                numberOfLines={1}
                adjustsFontSizeToFit
                style={applyStyle(failedTxStyle, { isFailedTx })}
            />
        </>
    );
};

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
            decimals={tokenTransfer.decimals}
            historicRate={historicRate}
            color="contentSecondary"
            useHistoricRate
            style={applyStyle(failedTxStyle, { isFailedTx })}
        />
    );
};
