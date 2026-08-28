import {
    type InsufficientFundsErrorDetails,
    type InvalidAddressErrorDetails,
    type UnsupportedEip712MessageErrorDetails,
} from './types';

export const TX_SIMULATION_ERROR_CODE = {
    insufficientFunds: 'GENERAL_INSUFFICIENT_FUNDS',
    invalidAddress: 'GENERAL_INVALID_ADDRESS',
    unsupportedEip712Message: 'UNSUPPORTED_EIP712_MESSAGE',
} as const satisfies Record<
    string,
    | InsufficientFundsErrorDetails['code']
    | InvalidAddressErrorDetails['code']
    | UnsupportedEip712MessageErrorDetails['code']
>;
