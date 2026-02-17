import { Static, Type } from '@trezor/schema-utils';

import { applyFlags } from './applyFlags';
import { applySettings } from './applySettings';
import { authenticateDevice } from './authenticateDevice';
import { authorizeCoinjoin } from './authorizeCoinjoin';
import { backupDevice } from './backupDevice';
import { bleUnpair } from './bleUnpair';
import { blockchainDisconnect } from './blockchainDisconnect';
import { blockchainEstimateFee } from './blockchainEstimateFee';
import { blockchainEvmRpcCall } from './blockchainEvmRpcCall';
import { blockchainGetAccountBalanceHistory } from './blockchainGetAccountBalanceHistory';
import { blockchainGetCurrentFiatRates } from './blockchainGetCurrentFiatRates';
import { blockchainGetFiatRatesForTimestamps } from './blockchainGetFiatRatesForTimestamps';
import { blockchainGetInfo } from './blockchainGetInfo';
import { blockchainGetTransactions } from './blockchainGetTransactions';
import { blockchainSetCustomBackend } from './blockchainSetCustomBackend';
import { blockchainSubscribe } from './blockchainSubscribe';
import { blockchainSubscribeFiatRates } from './blockchainSubscribeFiatRates';
import { blockchainUnsubscribe } from './blockchainUnsubscribe';
import { blockchainUnsubscribeFiatRates } from './blockchainUnsubscribeFiatRates';
import { blockchainValidateEvmRpcUrl } from './blockchainValidateEvmRpcUrl';
import { cancel } from './cancel';
import { cancelCoinjoinAuthorization } from './cancelCoinjoinAuthorization';
import { cardanoComposeTransaction } from './cardanoComposeTransaction';
import { cardanoGetAddress } from './cardanoGetAddress';
import { cardanoGetNativeScriptHash } from './cardanoGetNativeScriptHash';
import { cardanoGetPublicKey } from './cardanoGetPublicKey';
import { cardanoSignMessage } from './cardanoSignMessage';
import { cardanoSignTransaction } from './cardanoSignTransaction';
import { changeLanguage } from './changeLanguage';
import { changePin } from './changePin';
import { changeWipeCode } from './changeWipeCode';
import { cipherKeyValue } from './cipherKeyValue';
import { composeTransaction } from './composeTransaction';
import { discoverAccounts } from './discoverAccounts';
import { dispose } from './dispose';
import { ethereumGetAddress } from './ethereumGetAddress';
import { ethereumGetPublicKey } from './ethereumGetPublicKey';
import { ethereumSignMessage } from './ethereumSignMessage';
import { ethereumSignTransaction } from './ethereumSignTransaction';
import { ethereumSignTypedData } from './ethereumSignTypedData';
import { ethereumVerifyMessage } from './ethereumVerifyMessage';
import { evoluGetDelegatedIdentityKey } from './evoluGetDelegatedIdentityKey';
import { evoluGetNode } from './evoluGetNode';
import { evoluSignRegistrationRequest } from './evoluSignRegistrationRequest';
import { firmwareUpdate } from './firmwareUpdate';
import { getAccountDescriptor } from './getAccountDescriptor';
import { getAccountInfo } from './getAccountInfo';
import { getAddress } from './getAddress';
import { getCoinInfo } from './getCoinInfo';
import { getDeviceState } from './getDeviceState';
import { getFeatures } from './getFeatures';
import { getFirmwareHash } from './getFirmwareHash';
import { getNonce } from './getNonce';
import { getOwnershipId } from './getOwnershipId';
import { getOwnershipProof } from './getOwnershipProof';
import { getPublicKey } from './getPublicKey';
import { getSettings } from './getSettings';
import { loadDevice } from './loadDevice';
import { moneroGetAddress } from './moneroGetAddress';
import { moneroGetWatchKey } from './moneroGetWatchKey';
import { moneroKeyImageSync } from './moneroKeyImageSync';
import { moneroSignTransaction } from './moneroSignTransaction';
import { off } from './off';
import { on } from './on';
import { pushTransaction } from './pushTransaction';
import { recoveryDevice } from './recoveryDevice';
import { removeAllListeners } from './removeAllListeners';
import { requestLogin } from './requestLogin';
import { resetDevice } from './resetDevice';
import { rippleGetAddress } from './rippleGetAddress';
import { rippleSignTransaction } from './rippleSignTransaction';
import { setBrightness } from './setBrightness';
import { setBusy } from './setBusy';
import { showDeviceTutorial } from './showDeviceTutorial';
import { signMessage } from './signMessage';
import { signTransaction } from './signTransaction';
import { solanaComposeTransaction } from './solanaComposeTransaction';
import { solanaGetAddress } from './solanaGetAddress';
import { solanaGetPublicKey } from './solanaGetPublicKey';
import { solanaSignTransaction } from './solanaSignTransaction';
import { stellarGetAddress } from './stellarGetAddress';
import { stellarSignTransaction } from './stellarSignTransaction';
import { telemetryGet } from './telemetryGet';
import { tezosGetAddress } from './tezosGetAddress';
import { tezosGetPublicKey } from './tezosGetPublicKey';
import { tezosSignTransaction } from './tezosSignTransaction';
import { thpGetCredentials } from './thpGetCredentials';
import { thpRemoveCredentials } from './thpRemoveCredentials';
import { tronGetAddress } from './tronGetAddress';
import { tronSignTransaction } from './tronSignTransaction';
import { uiResponse } from './uiResponse';
import { unlockPath } from './unlockPath';
import { updateConnectSettings } from './updateConnectSettings';
import { verifyMessage } from './verifyMessage';
import { wipeDevice } from './wipeDevice';

// Initialization, lifecycle, events, and settings
export const TrezorConnectManagement = Type.Object({
    // For internal use, no public documentation.
    dispose: Type.Unsafe<typeof dispose>(),

    // For internal use, no public documentation.
    cancel: Type.Unsafe<typeof cancel>(),

    // For internal use, no public documentation.
    on: Type.Unsafe<typeof on>(),

    // For internal use, no public documentation.
    off: Type.Unsafe<typeof off>(),

    // For internal use, no public documentation.
    removeAllListeners: Type.Unsafe<typeof removeAllListeners>(),

    // For internal use, no public documentation.
    uiResponse: Type.Unsafe<typeof uiResponse>(),

    // For internal use, no public documentation.
    updateConnectSettings: Type.Unsafe<typeof updateConnectSettings>(),
});
export type TrezorConnectManagement = Static<typeof TrezorConnectManagement>;

// Device configuration, firmware, security, and hardware control
export const TrezorConnectDevice = Type.Object({
    // https://connect.trezor.io/9/methods/device/getFeatures/
    getFeatures: Type.Unsafe<typeof getFeatures>(),

    // https://connect.trezor.io/9/methods/device/getDeviceState/
    getDeviceState: Type.Unsafe<typeof getDeviceState>(),

    // https://connect.trezor.io/9/methods/device/getFirmwareHash/
    getFirmwareHash: Type.Unsafe<typeof getFirmwareHash>(),

    // https://connect.trezor.io/9/methods/device/firmwareUpdate/
    firmwareUpdate: Type.Unsafe<typeof firmwareUpdate>(),

    // https://connect.trezor.io/9/methods/device/resetDevice/
    resetDevice: Type.Unsafe<typeof resetDevice>(),

    // https://connect.trezor.io/9/methods/device/loadDevice/
    loadDevice: Type.Unsafe<typeof loadDevice>(),

    // todo: link docs
    recoveryDevice: Type.Unsafe<typeof recoveryDevice>(),

    // https://connect.trezor.io/9/methods/device/wipeDevice/
    wipeDevice: Type.Unsafe<typeof wipeDevice>(),

    // https://connect.trezor.io/9/methods/device/backupDevice/
    backupDevice: Type.Unsafe<typeof backupDevice>(),

    // https://connect.trezor.io/9/methods/device/changePin/
    changePin: Type.Unsafe<typeof changePin>(),

    // https://connect.trezor.io/9/methods/device/changeWipeCode/
    changeWipeCode: Type.Unsafe<typeof changeWipeCode>(),

    // https://connect.trezor.io/9/methods/device/changeLanguage/
    changeLanguage: Type.Unsafe<typeof changeLanguage>(),

    // https://connect.trezor.io/9/methods/device/applySettings/
    applySettings: Type.Unsafe<typeof applySettings>(),

    // https://connect.trezor.io/9/methods/device/applyFlags/
    applyFlags: Type.Unsafe<typeof applyFlags>(),

    // https://connect.trezor.io/9/methods/device/authenticateDevice/
    authenticateDevice: Type.Unsafe<typeof authenticateDevice>(),

    // https://connect.trezor.io/9/methods/device/setBusy/
    setBusy: Type.Unsafe<typeof setBusy>(),

    setBrightness: Type.Unsafe<typeof setBrightness>(),

    // https://connect.trezor.io/9/methods/device/showDeviceTutorial/
    showDeviceTutorial: Type.Unsafe<typeof showDeviceTutorial>(),

    // https://connect.trezor.io/9/methods/device/bleUnpair/
    bleUnpair: Type.Unsafe<typeof bleUnpair>(),

    // https://connect.trezor.io/9/methods/other/requestLogin/
    requestLogin: Type.Unsafe<typeof requestLogin>(),

    // https://connect.trezor.io/9/methods/other/cipherKeyValue/
    cipherKeyValue: Type.Unsafe<typeof cipherKeyValue>(),

    // todo: link docs
    unlockPath: Type.Unsafe<typeof unlockPath>(),

    // https://connect.trezor.io/9/methods/other/getOwnershipId/
    getOwnershipId: Type.Unsafe<typeof getOwnershipId>(),

    // https://connect.trezor.io/9/methods/other/getOwnershipProof/
    getOwnershipProof: Type.Unsafe<typeof getOwnershipProof>(),

    // https://connect.trezor.io/9/methods/device/thpGetCredentials/
    thpGetCredentials: Type.Unsafe<typeof thpGetCredentials>(),

    // https://connect.trezor.io/9/methods/device/thpRemoveCredentials/
    thpRemoveCredentials: Type.Unsafe<typeof thpRemoveCredentials>(),

    telemetryGet: Type.Unsafe<typeof telemetryGet>(),
});
export type TrezorConnectDevice = Static<typeof TrezorConnectDevice>;

// Blockchain backend operations (no device needed)
export const TrezorConnectBlockchain = Type.Object({
    // For internal use, no public documentation.[]
    blockchainSubscribe: Type.Unsafe<typeof blockchainSubscribe>(),

    // For internal use, no public documentation.
    blockchainUnsubscribe: Type.Unsafe<typeof blockchainUnsubscribe>(),

    // For internal use, no public documentation.
    blockchainDisconnect: Type.Unsafe<typeof blockchainDisconnect>(),

    // For internal use, no public documentation.
    blockchainSetCustomBackend: Type.Unsafe<typeof blockchainSetCustomBackend>(),

    // For internal use, no public documentation.
    blockchainGetInfo: Type.Unsafe<typeof blockchainGetInfo>(),

    // For internal use, no public documentation.
    blockchainValidateEvmRpcUrl: Type.Unsafe<typeof blockchainValidateEvmRpcUrl>(),

    // For internal use, no public documentation.
    blockchainEstimateFee: Type.Unsafe<typeof blockchainEstimateFee>(),

    // For internal use, no public documentation.
    blockchainGetAccountBalanceHistory: Type.Unsafe<typeof blockchainGetAccountBalanceHistory>(),

    // For internal use, no public documentation.
    blockchainGetTransactions: Type.Unsafe<typeof blockchainGetTransactions>(),

    // For internal use, no public documentation.
    blockchainEvmRpcCall: Type.Unsafe<typeof blockchainEvmRpcCall>(),

    // For internal use, no public documentation.
    blockchainGetCurrentFiatRates: Type.Unsafe<typeof blockchainGetCurrentFiatRates>(),

    // For internal use, no public documentation.
    blockchainGetFiatRatesForTimestamps: Type.Unsafe<typeof blockchainGetFiatRatesForTimestamps>(),

    // For internal use, no public documentation.
    blockchainSubscribeFiatRates: Type.Unsafe<typeof blockchainSubscribeFiatRates>(),

    // For internal use, no public documentation.
    blockchainUnsubscribeFiatRates: Type.Unsafe<typeof blockchainUnsubscribeFiatRates>(),

    // https://connect.trezor.io/9/methods/bitcoin/pushTransaction/
    pushTransaction: Type.Unsafe<typeof pushTransaction>(),

    // For internal use, no public documentation.
    getNonce: Type.Unsafe<typeof getNonce>(),
});
export type TrezorConnectBlockchain = Static<typeof TrezorConnectBlockchain>;

// Generic account and address operations (multi-coin)
export const TrezorConnectAccount = Type.Object({
    // https://connect.trezor.io/9/methods/bitcoin/getAddress/
    getAddress: Type.Unsafe<typeof getAddress>(),

    // https://connect.trezor.io/9/methods/bitcoin/getPublicKey/
    getPublicKey: Type.Unsafe<typeof getPublicKey>(),

    // https://connect.trezor.io/9/methods/bitcoin/getAccountInfo/
    getAccountInfo: Type.Unsafe<typeof getAccountInfo>(),

    // https://connect.trezor.io/9/methods/other/getAccountDescriptor/
    getAccountDescriptor: Type.Unsafe<typeof getAccountDescriptor>(),

    // todo: link docs
    discoverAccounts: Type.Unsafe<typeof discoverAccounts>(),

    // https://connect.trezor.io/9/methods/bitcoin/signMessage/
    signMessage: Type.Unsafe<typeof signMessage>(),

    // https://connect.trezor.io/9/methods/bitcoin/verifyMessage/
    verifyMessage: Type.Unsafe<typeof verifyMessage>(),

    // todo: link docs
    getSettings: Type.Unsafe<typeof getSettings>(),

    // https://connect.trezor.io/9/methods/other/getCoinInfo/
    getCoinInfo: Type.Unsafe<typeof getCoinInfo>(),
});
export type TrezorConnectAccount = Static<typeof TrezorConnectAccount>;

// Bitcoin-specific operations
export const TrezorConnectBitcoin = Type.Object({
    // https://connect.trezor.io/9/methods/bitcoin/signTransaction/
    signTransaction: Type.Unsafe<typeof signTransaction>(),
    composeTransaction: Type.Unsafe<typeof composeTransaction>(),

    // https://connect.trezor.io/9/methods/bitcoin/authorizeCoinjoin/
    authorizeCoinjoin: Type.Unsafe<typeof authorizeCoinjoin>(),

    // https://connect.trezor.io/9/methods/bitcoin/cancelCoinjoinAuthorization/
    cancelCoinjoinAuthorization: Type.Unsafe<typeof cancelCoinjoinAuthorization>(),
});
export type TrezorConnectBitcoin = Static<typeof TrezorConnectBitcoin>;

// Ethereum-specific operations
export const TrezorConnectEthereum = Type.Object({
    // https://connect.trezor.io/9/methods/ethereum/ethereumGetAddress/
    ethereumGetAddress: Type.Unsafe<typeof ethereumGetAddress>(),

    // https://connect.trezor.io/9/methods/ethereum/ethereumGetPublicKey/
    ethereumGetPublicKey: Type.Unsafe<typeof ethereumGetPublicKey>(),

    // https://connect.trezor.io/9/methods/ethereum/ethereumSignTransaction/
    ethereumSignTransaction: Type.Unsafe<typeof ethereumSignTransaction>(),

    // https://connect.trezor.io/9/methods/ethereum/ethereumSignMessage/
    ethereumSignMessage: Type.Unsafe<typeof ethereumSignMessage>(),

    // https://connect.trezor.io/9/methods/ethereum/ethereumSignTypedData/
    ethereumSignTypedData: Type.Unsafe<typeof ethereumSignTypedData>(),

    // https://connect.trezor.io/9/methods/ethereum/ethereumVerifyMessage/
    ethereumVerifyMessage: Type.Unsafe<typeof ethereumVerifyMessage>(),
});
export type TrezorConnectEthereum = Static<typeof TrezorConnectEthereum>;

// Cardano-specific operations
export const TrezorConnectCardano = Type.Object({
    // https://connect.trezor.io/9/methods/cardano/cardanoGetAddress/
    cardanoGetAddress: Type.Unsafe<typeof cardanoGetAddress>(),

    // https://connect.trezor.io/9/methods/cardano/cardanoGetPublicKey/
    cardanoGetPublicKey: Type.Unsafe<typeof cardanoGetPublicKey>(),

    // https://connect.trezor.io/9/methods/cardano/cardanoGetNativeScriptHash
    cardanoGetNativeScriptHash: Type.Unsafe<typeof cardanoGetNativeScriptHash>(),

    // https://connect.trezor.io/9/methods/cardano/cardanoSignTransaction/
    cardanoSignTransaction: Type.Unsafe<typeof cardanoSignTransaction>(),

    // https://connect.trezor.io/9/methods/cardano/cardanoSignMessage/
    cardanoSignMessage: Type.Unsafe<typeof cardanoSignMessage>(),

    // https://connect.trezor.io/9/methods/cardano/cardanoComposeTransaction/
    cardanoComposeTransaction: Type.Unsafe<typeof cardanoComposeTransaction>(),
});
export type TrezorConnectCardano = Static<typeof TrezorConnectCardano>;

// Monero-specific operations
export const TrezorConnectMonero = Type.Object({
    // https://connect.trezor.io/9/methods/monero/moneroGetAddress/
    moneroGetAddress: Type.Unsafe<typeof moneroGetAddress>(),

    // https://connect.trezor.io/9/methods/monero/moneroGetWatchKey/
    moneroGetWatchKey: Type.Unsafe<typeof moneroGetWatchKey>(),

    // https://connect.trezor.io/9/methods/monero/moneroKeyImageSync/
    moneroKeyImageSync: Type.Unsafe<typeof moneroKeyImageSync>(),

    // https://connect.trezor.io/9/methods/monero/moneroSignTransaction/
    moneroSignTransaction: Type.Unsafe<typeof moneroSignTransaction>(),
});
export type TrezorConnectMonero = Static<typeof TrezorConnectMonero>;

// Ripple-specific operations
export const TrezorConnectRipple = Type.Object({
    // https://connect.trezor.io/9/methods/ripple/rippleGetAddress/
    rippleGetAddress: Type.Unsafe<typeof rippleGetAddress>(),

    // https://connect.trezor.io/9/methods/ripple/rippleSignTransaction/
    rippleSignTransaction: Type.Unsafe<typeof rippleSignTransaction>(),
});
export type TrezorConnectRipple = Static<typeof TrezorConnectRipple>;

// Solana-specific operations
export const TrezorConnectSolana = Type.Object({
    // https://connect.trezor.io/9/methods/solana/solanaGetAddress/
    solanaGetAddress: Type.Unsafe<typeof solanaGetAddress>(),

    // https://connect.trezor.io/9/methods/solana/solanaGetPublicKey/
    solanaGetPublicKey: Type.Unsafe<typeof solanaGetPublicKey>(),

    // https://connect.trezor.io/9/methods/solana/solanaSignTransaction/
    solanaSignTransaction: Type.Unsafe<typeof solanaSignTransaction>(),

    // https://connect.trezor.io/9/methods/solana/solanaComposeTransaction/
    solanaComposeTransaction: Type.Unsafe<typeof solanaComposeTransaction>(),
});
export type TrezorConnectSolana = Static<typeof TrezorConnectSolana>;

// Stellar-specific operations
export const TrezorConnectStellar = Type.Object({
    // https://connect.trezor.io/9/methods/stellar/stellarGetAddress/
    stellarGetAddress: Type.Unsafe<typeof stellarGetAddress>(),

    // https://connect.trezor.io/9/methods/stellar/stellarSignTransaction/
    stellarSignTransaction: Type.Unsafe<typeof stellarSignTransaction>(),
});
export type TrezorConnectStellar = Static<typeof TrezorConnectStellar>;

// Tezos-specific operations
export const TrezorConnectTezos = Type.Object({
    // https://connect.trezor.io/9/methods/tezos/tezosGetAddress/
    tezosGetAddress: Type.Unsafe<typeof tezosGetAddress>(),

    // https://connect.trezor.io/9/methods/tezos/tezosGetPublicKey/
    tezosGetPublicKey: Type.Unsafe<typeof tezosGetPublicKey>(),

    // https://connect.trezor.io/9/methods/tezos/tezosSignTransaction/
    tezosSignTransaction: Type.Unsafe<typeof tezosSignTransaction>(),
});
export type TrezorConnectTezos = Static<typeof TrezorConnectTezos>;

// Tron-specific operations
export const TrezorConnectTron = Type.Object({
    // https://connect.trezor.io/9/methods/tron/tronGetAddress/
    tronGetAddress: Type.Unsafe<typeof tronGetAddress>(),

    // https://connect.trezor.io/9/methods/tron/tronSignTransaction/
    tronSignTransaction: Type.Unsafe<typeof tronSignTransaction>(),
});
export type TrezorConnectTron = Static<typeof TrezorConnectTron>;

// Evolu identity protocol operations
export const TrezorConnectEvolu = Type.Object({
    // For internal use, no public documentation.
    evoluGetNode: Type.Unsafe<typeof evoluGetNode>(),

    // For internal use, no public documentation.
    evoluSignRegistrationRequest: Type.Unsafe<typeof evoluSignRegistrationRequest>(),

    // For internal use, no public documentation.
    evoluGetDelegatedIdentityKey: Type.Unsafe<typeof evoluGetDelegatedIdentityKey>(),
});
export type TrezorConnectEvolu = Static<typeof TrezorConnectEvolu>;

// Runtime schema for key access
export const TrezorConnectSchema = Type.Composite([
    TrezorConnectManagement,
    TrezorConnectDevice,
    TrezorConnectBlockchain,
    TrezorConnectAccount,
    TrezorConnectBitcoin,
    TrezorConnectEthereum,
    TrezorConnectCardano,
    TrezorConnectMonero,
    TrezorConnectRipple,
    TrezorConnectSolana,
    TrezorConnectStellar,
    TrezorConnectTezos,
    TrezorConnectTron,
    TrezorConnectEvolu,
]);

// Type-level interface for precise function types.
export interface TrezorConnect
    extends
        TrezorConnectManagement,
        TrezorConnectDevice,
        TrezorConnectBlockchain,
        TrezorConnectAccount,
        TrezorConnectBitcoin,
        TrezorConnectEthereum,
        TrezorConnectCardano,
        TrezorConnectMonero,
        TrezorConnectRipple,
        TrezorConnectSolana,
        TrezorConnectStellar,
        TrezorConnectTezos,
        TrezorConnectTron,
        TrezorConnectEvolu {}
