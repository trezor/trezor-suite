import { NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { PrecomposedTransactionError } from '@suite-common/wallet-types';
import { TxKeyPath } from '@suite-native/intl';

/**
 * Values that can be provided for precomposed transaction error messages
 */
export type PrecomposedTransactionErrorValues = {
    networkDisplaySymbol?: string;
};

/**
 * Context information needed to generate error message values
 */
export type PrecomposedTransactionErrorContext = {
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
];

/**
 * Type guard to check if an error is a precomposed transaction error
 */
export const isPrecomposedTransactionError = (
    error: string,
): error is PrecomposedTransactionError['error'] =>
    VALID_PRECOMPOSED_ERRORS.includes(error as PrecomposedTransactionError['error']);

/**
 * Generates the translation key and values for a precomposed transaction error message
 */
const generateErrorData = (
    error: string | undefined | null,
    context: PrecomposedTransactionErrorContext,
): {
    txKeyPath: TxKeyPath;
    values: PrecomposedTransactionErrorValues;
} | null => {
    const { networkSymbol } = context;

    if (!error || !isPrecomposedTransactionError(error)) {
        return null;
    }

    switch (error) {
        case 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE':
            return {
                txKeyPath:
                    'transactionManagement.precomposedTransaction.errors.amountNotEnoughCurrencyFee',
                values: {
                    networkDisplaySymbol: networkSymbol
                        ? getNetworkDisplaySymbol(networkSymbol)
                        : '',
                },
            };

        case 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT':
            return {
                txKeyPath:
                    'transactionManagement.precomposedTransaction.errors.amountNotEnoughCurrencyFeeWithEthAmount',
                values: {
                    networkDisplaySymbol: networkSymbol
                        ? getNetworkDisplaySymbol(networkSymbol)
                        : '',
                },
            };

        case 'AMOUNT_IS_LESS_THAN_RESERVE':
            return {
                txKeyPath:
                    'transactionManagement.precomposedTransaction.errors.amountIsLessThanReserve',
                values: {},
            };

        case 'REMAINING_BALANCE_LESS_THAN_RENT':
            return {
                txKeyPath:
                    'transactionManagement.precomposedTransaction.errors.remainingBalanceLessThanRent',
                values: {},
            };

        case 'AMOUNT_IS_NOT_ENOUGH':
            return {
                txKeyPath: 'transactionManagement.precomposedTransaction.errors.amountIsNotEnough',
                values: {},
            };

        case 'AMOUNT_IS_TOO_LOW':
            return {
                txKeyPath: 'transactionManagement.precomposedTransaction.errors.amountIsTooLow',
                values: {},
            };

        case 'TR_STAKE_NOT_ENOUGH_FUNDS':
            return {
                txKeyPath:
                    'transactionManagement.precomposedTransaction.errors.stakeNotEnoughFunds',
                values: {},
            };

        default:
            return {
                txKeyPath: 'transactionManagement.precomposedTransaction.errors.amountIsNotEnough',
                values: {},
            };
    }
};

/**
 * Returns the translation key and values for a precomposed transaction error
 */
export const getPrecomposedTransactionErrorTranslation = (
    error: string | undefined | null,
    context: PrecomposedTransactionErrorContext,
): {
    txKeyPath: TxKeyPath;
    values: PrecomposedTransactionErrorValues;
} | null => generateErrorData(error, context);
