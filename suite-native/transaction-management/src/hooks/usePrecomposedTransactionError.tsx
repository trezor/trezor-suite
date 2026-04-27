import { type ReactNode, useMemo } from 'react';

import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type PrecomposedTransactionError } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';

export type UsePrecomposedTransactionErrorProps = {
    error: string | null | undefined;
    networkSymbol?: NetworkSymbol;
};

const VALID_PRECOMPOSED_ERRORS: PrecomposedTransactionError['error'][] = [
    'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
    'AMOUNT_IS_NOT_ENOUGH',
    'AMOUNT_IS_TOO_LOW',
    'AMOUNT_IS_LESS_THAN_RESERVE',
    'TR_STAKE_NOT_ENOUGH_FUNDS',
    'REMAINING_BALANCE_LESS_THAN_RENT',
    'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
    'NOT-ENOUGH-FUNDS',
];

/**
 * Type guard to check if an error is a precomposed transaction error
 */
export const isPrecomposedTransactionError = (
    error: string,
): error is PrecomposedTransactionError['error'] =>
    VALID_PRECOMPOSED_ERRORS.includes(error as PrecomposedTransactionError['error']);

/**
 * Hook to get precomposed transaction error translation with proper values
 */
export const usePrecomposedTransactionError = ({
    error,
    networkSymbol,
}: UsePrecomposedTransactionErrorProps): ReactNode | null =>
    useMemo(() => {
        if (!error || !isPrecomposedTransactionError(error)) {
            return null;
        }

        const networkDisplaySymbol = networkSymbol ? getNetworkDisplaySymbol(networkSymbol) : '';

        switch (error) {
            case 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE':
            case 'NOT-ENOUGH-FUNDS':
                return (
                    <Translation
                        id="transactionManagement.precomposedTransaction.errors.amountNotEnoughCurrencyFee"
                        values={{ networkDisplaySymbol }}
                    />
                );

            case 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT':
                return (
                    <Translation
                        id="transactionManagement.precomposedTransaction.errors.amountNotEnoughCurrencyFeeWithEthAmount"
                        values={{ networkDisplaySymbol }}
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
    }, [error, networkSymbol]);
