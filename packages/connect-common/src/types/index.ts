export * from './api';
export type * from './account';
export * from './coinInfo';
export * from './device';
export * from './fees';
export type * from './firmware';
export * from './params';
export * from './settings';

// altcoin related types. these exports should satisfy needs of 3rd party apps
export * from './api/cardano';
export * from './api/bitcoin';
export * from './api/ripple';
export * from './api/ethereum';
export * from './api/monero';
export * from './api/solana';
export * from './api/stellar';
export * from './api/tezos';
export * from './api/tron';

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
export { CipherKeyValue } from './api/cipherKeyValue';
export { ApplySettings } from './api/applySettings';
export { AuthenticateDeviceParams } from './api/authenticateDevice';
export { AuthorizeCoinjoin } from './api/authorizeCoinjoin';
export * from './api/uiResponse';
export type {
    ComposeUtxo,
    ComposeResultFinal,
    ComposeResult,
    ComposedInputs,
    PrecomposeParams,
} from './api/composeTransaction';
export { CancelCoinjoinAuthorization } from './api/cancelCoinjoinAuthorization';
export { ChangeLanguage } from './api/changeLanguage';
export type { GetAccountInfo } from './api/getAccountInfo';
export {
    ACCOUNT_TYPES,
    type AccountTypeItem,
    type AccountTypeKey,
    type AdditionalParams,
    type DiscoverAccountsProgress,
    CARDANO_DERIVATIONS,
} from './api/discoverAccounts';
export {
    type GetAccountDescriptorResponse,
    GetAccountDescriptorParams,
} from './api/getAccountDescriptor';
export { type FirmwareUpdateResponse } from './api/firmwareUpdate';
export { type UpdateConnectSettings } from './api/updateConnectSettings';
export { GetOwnershipId } from './api/getOwnershipId';
export { GetOwnershipProof } from './api/getOwnershipProof';
export { PushTransaction } from './api/pushTransaction';
export { RequestLoginSchema } from './api/requestLogin';
export { UnlockPathParams } from './api/unlockPath';
export { FirmwareType } from '@trezor/device-utils';

export type {
    TokenInfo,
    TokenTransfer,
    InternalTransfer,
    FiatRatesBySymbol,
    Target as TransactionTarget,
    AccountBalanceHistory as BlockchainAccountBalanceHistory,
} from '@trezor/blockchain-link-types';

export { ThpPairingMethod } from '@trezor/protocol';
export type { MessagesSchema as PROTO } from '@trezor/protobuf';
