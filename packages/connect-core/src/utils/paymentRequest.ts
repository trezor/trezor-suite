import { ERRORS } from '@trezor/connect-common/src/constants';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { formatBigUintToLE } from '@trezor/utils/src/formatBigUintToLE';

/**
 * SLIP-24 `PaymentRequest.amount` byte length per chain family.
 *   - `DEFAULT` covers Bitcoin, Cardano, Solana, Stellar, Ripple
 *   - `EVM` covers Ethereum and all EVM chains
 */
export const PAYMENT_REQUEST_AMOUNT_BYTES = {
    DEFAULT: 8,
    EVM: 32,
} as const;

/**
 * Encodes `PaymentRequest.amount` from a decimal string to a SLIP-24
 * little-endian hex byte string of the correct length for the chain.
 *
 * Returns the payment request unchanged when `amount` is absent.
 */
export const encodePaymentRequestAmount = <T extends { amount?: PROTO.PaymentRequest['amount'] }>(
    paymentRequest: T,
    bytesLength: number,
): T => {
    if (paymentRequest.amount === undefined) {
        return paymentRequest;
    }

    if (typeof paymentRequest.amount !== 'string' || !/^\d+$/.test(paymentRequest.amount)) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            'Invalid PaymentRequest.amount: expected a decimal string in subunits',
        );
    }

    try {
        return {
            ...paymentRequest,
            amount: formatBigUintToLE({ value: paymentRequest.amount, bytesLength }),
        };
    } catch (error) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            `Invalid PaymentRequest.amount: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
};
