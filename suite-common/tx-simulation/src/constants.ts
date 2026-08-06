import {
    type GeneralInsufficientFundsErrorDetails,
    type GeneralInvalidAddressErrorDetails,
    type UnsupportedEip712MessageErrorDetails,
} from './blockaidTypes';

export const TX_SIMULATION_ERROR_CODE = {
    insufficientFunds: 'GENERAL_INSUFFICIENT_FUNDS',
    invalidAddress: 'GENERAL_INVALID_ADDRESS',
    unsupportedEip712Message: 'UNSUPPORTED_EIP712_MESSAGE',
} as const satisfies Record<
    string,
    | GeneralInsufficientFundsErrorDetails['code']
    | GeneralInvalidAddressErrorDetails['code']
    | UnsupportedEip712MessageErrorDetails['code']
>;
