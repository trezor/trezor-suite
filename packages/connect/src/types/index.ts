export * from './api';
export * from './account';
export * from './coinInfo';
export * from './device';
export * from './fees';
export * from './firmware';
export * from './params';
export * from './settings';

// altcoin related types. these exports should satisfy needs of 3rd party apps
export * from './api/cardano';
export * from './api/binance';
export * from './api/bitcoin';
export * from './api/eos';
export * from './api/ripple';
export * from './api/ethereum';
export * from './api/solana';
export * from './api/stellar';
export * from './api/tezos';

// types used in @trezor/suite. if you need a type, reexport it from ./api/<method>
export type {
    ComposeOutput,
    PrecomposeResultError,
    PrecomposeResultNonFinal,
    PrecomposeResultFinal,
    PrecomposedResult,
} from './api/composeTransaction';
export type {
    PrecomposedTransactionCardano,
    PrecomposedTransactionErrorCardano,
    PrecomposedTransactionFinalCardano,
    PrecomposedTransactionNonFinalCardano,
} from './api/cardanoComposeTransaction';
export type { RecoveryDevice } from './api/recoveryDevice';
export type { AuthenticateDeviceResult } from './api/authenticateDevice';
export type {
    TokenInfo,
    TokenTransfer,
    InternalTransfer,
    FiatRates,
    Target as TransactionTarget,
    AccountBalanceHistory as BlockchainAccountBalanceHistory,
} from '@trezor/blockchain-link';
