import { NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { Translation } from '@suite-native/intl';

import { isPrecomposedTransactionError } from '../utils/precomposedTransactionErrorUtils';

type PrecomposedTransactionErrorProps = {
    error: string | null;
    networkSymbol?: NetworkSymbol;
};

export const PrecomposedTransactionError = ({
    error,
    networkSymbol,
}: PrecomposedTransactionErrorProps) => {
    if (!error || !isPrecomposedTransactionError(error)) {
        return null;
    }

    switch (error) {
        case 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE':
            return (
                <Translation
                    id="transactionManagement.precomposedTransaction.errors.amountNotEnoughCurrencyFee"
                    values={{
                        networkDisplaySymbol: networkSymbol
                            ? getNetworkDisplaySymbol(networkSymbol)
                            : '',
                    }}
                />
            );
        case 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT':
            return (
                <Translation
                    id="transactionManagement.precomposedTransaction.errors.amountNotEnoughCurrencyFeeWithEthAmount"
                    values={{
                        networkDisplaySymbol: networkSymbol
                            ? getNetworkDisplaySymbol(networkSymbol)
                            : '',
                    }}
                />
            );
        case 'AMOUNT_IS_LESS_THAN_RESERVE':
            return (
                <Translation id="transactionManagement.precomposedTransaction.errors.amountIsLessThanReserve" />
            );
        case 'REMAINING_BALANCE_LESS_THAN_RENT':
            return (
                <Translation id="transactionManagement.precomposedTransaction.errors.remainingBalanceLessThanRent" />
            );
        case 'AMOUNT_IS_NOT_ENOUGH':
            return (
                <Translation id="transactionManagement.precomposedTransaction.errors.amountIsNotEnough" />
            );
        case 'AMOUNT_IS_TOO_LOW':
            return (
                <Translation id="transactionManagement.precomposedTransaction.errors.amountIsTooLow" />
            );
        case 'TR_STAKE_NOT_ENOUGH_FUNDS':
            return (
                <Translation id="transactionManagement.precomposedTransaction.errors.stakeNotEnoughFunds" />
            );
        default:
            return (
                <Translation id="transactionManagement.precomposedTransaction.errors.amountIsNotEnough" />
            );
    }
};
