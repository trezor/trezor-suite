import { PrecomposedTransactionError } from '@suite-common/wallet-types';

/**
 * Values that can be provided for precomposed transaction error messages
 */
export type PrecomposedTransactionErrorValues = {
    networkDisplaySymbol?: string;
};

const VALID_PRECOMPOSED_ERRORS: PrecomposedTransactionError['error'][] = [
    'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
    'AMOUNT_IS_NOT_ENOUGH',
    'AMOUNT_IS_TOO_LOW',
    'AMOUNT_IS_LESS_THAN_RESERVE',
    'TR_STAKE_NOT_ENOUGH_FUNDS',
    'REMAINING_BALANCE_LESS_THAN_RENT',
    'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
];

/**
 * Type guard to check if an error is a precomposed transaction error
 */
export const isPrecomposedTransactionError = (
    error: string,
): error is PrecomposedTransactionError['error'] =>
    VALID_PRECOMPOSED_ERRORS.includes(error as PrecomposedTransactionError['error']);
