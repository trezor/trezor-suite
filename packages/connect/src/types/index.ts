export * from './api';
export * from './account';
export * from './coinInfo';
export * from './device';
export * from './params';
export * from './settings';

// REF-TODO: added for backwards compatibility with imports in @trezor/suite
// should it be here? clever utility type, something like Parameters<T> ?
export type { RipplePayment } from './api/rippleSignTransaction';
export type { ComposeOutput, PrecomposedTransaction } from './api/composeTransaction';
export type { SignTransaction } from './api/signTransaction';
export type { EthereumTransaction } from './api/ethereumSignTransaction';
export type { CardanoOutput, CardanoInput, CardanoCertificate } from './api/cardanoSignTransaction';
export type { RecoveryDevice } from './api/recoveryDevice';
export type {
    TokenInfo,
    Transaction as AccountTransaction,
    Target as TransactionTarget,
    AccountBalanceHistory as BlockchainAccountBalanceHistory,
} from '@trezor/blockchain-link';
