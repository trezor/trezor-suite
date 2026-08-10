export type * from './api';
export type * from './account';
export * from './coinInfo';
export * from './definitions';
export * from './device';
export * from './fees';
export type * from './firmware';
export * from './method';
export * from './params';
export * from './settings';

// altcoin related types. these exports should satisfy needs of 3rd party apps
export * from './api/cardano/common';
export * from './api/bitcoin/common';
export * from './api/ripple/common';
export * from './api/ethereum/common';
export * from './api/monero/common';
export * from './api/solana/common';
export * from './api/stellar/common';
export * from './api/tezos/common';
export * from './api/tron/common';
export * from './api/nostr/common';

// types used in @trezor/suite. if you need a type, reexport it from ./api/<method>
export type { ComposePsbtParams } from './api/bitcoin/composePsbt';
export type {
    PrecomposeResultError,
    PrecomposeResultNonFinal,
    PrecomposeResultFinal,
    PrecomposedResult,
} from './api/bitcoin/composeTransaction';
export type {
    PrecomposedTransactionCardano,
    PrecomposedTransactionErrorCardano,
    PrecomposedTransactionFinalCardano,
    PrecomposedTransactionNonFinalCardano,
} from './api/cardano/cardanoComposeTransaction';
export type { RecoveryDevice } from './api/management/recoveryDevice';
export type {
    AuthenticateDeviceParams,
    AuthenticateDeviceResult,
} from './api/management/authenticateDevice';
export { CipherKeyValue } from './api/device/cipherKeyValue';
export { ApplySettings } from './api/management/applySettings';
export { AuthorizeCoinjoin } from './api/bitcoin/authorizeCoinjoin';
export * from './api/internal/uiResponse';
export type {
    ComposeUtxo,
    ComposeResultFinal,
    ComposeResult,
    ComposedInputs,
    PrecomposeParams,
} from './api/bitcoin/composeTransaction';
export { CancelCoinjoinAuthorization } from './api/bitcoin/cancelCoinjoinAuthorization';
export { ChangeLanguage } from './api/management/changeLanguage';
export type { GetAccountInfo } from './api/account/getAccountInfo';
export {
    ACCOUNT_TYPES,
    type AccountTypeItem,
    type AccountTypeKey,
    type AdditionalParams,
    type DiscoverAccountsProgress,
    CARDANO_DERIVATIONS,
} from './api/account/discoverAccounts';
export { type FirmwareUpdateResponse } from './api/device/firmwareUpdate';
export { type UpdateConnectSettings } from './api/internal/updateConnectSettings';
export { GetOwnershipId } from './api/device/getOwnershipId';
export { GetOwnershipProof } from './api/device/getOwnershipProof';
export { PushTransaction } from './api/blockchain/pushTransaction';
export { RequestLoginSchema } from './api/device/requestLogin';
export { UnlockPathParams } from './api/device/unlockPath';
export { FirmwareType } from '@trezor/device-utils';

export type {
    TokenInfo,
    TokenTransfer,
    InternalTransfer,
    FiatRatesBySymbol,
    Target as TransactionTarget,
    AccountBalanceHistory as BlockchainAccountBalanceHistory,
} from '@trezor/blockchain-link';

// direct targeted import, we need to avoid protocol barrel file (#27772)
export { ThpPairingMethod } from '@trezor/protocol/src/protocol-thp/messages';
export type { MessagesSchema as PROTO } from '@trezor/protobuf';
