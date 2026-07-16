import { type TransactionSimulationError } from '@blockaid/client/resources/evm';

export const TX_SIMULATION_ERROR_CODE = {
    insufficientFunds: 'GENERAL_INSUFFICIENT_FUNDS',
    invalidAddress: 'GENERAL_INVALID_ADDRESS',
    unsupportedEip712Message: 'UNSUPPORTED_EIP712_MESSAGE',
} as const satisfies Record<
    string,
    | TransactionSimulationError.GeneralInsufficientFundsErrorDetails['code']
    | TransactionSimulationError.GeneralInvalidAddressErrorDetails['code']
    | TransactionSimulationError.UnsupportedEip712MessageErrorDetails['code']
>;
