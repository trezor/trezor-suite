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
import { init } from './init';
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
    init: Type.Unsafe<typeof init>(),
    dispose: Type.Unsafe<typeof dispose>(),
    cancel: Type.Unsafe<typeof cancel>(),
    on: Type.Unsafe<typeof on>(),
    off: Type.Unsafe<typeof off>(),
    removeAllListeners: Type.Unsafe<typeof removeAllListeners>(),
    uiResponse: Type.Unsafe<typeof uiResponse>(),
    updateConnectSettings: Type.Unsafe<typeof updateConnectSettings>(),
});
export type TrezorConnectManagement = Static<typeof TrezorConnectManagement>;

// Device configuration, firmware, security, and hardware control
export const TrezorConnectDevice = Type.Object({
    getFeatures: Type.Unsafe<typeof getFeatures>(),
    getDeviceState: Type.Unsafe<typeof getDeviceState>(),
    getFirmwareHash: Type.Unsafe<typeof getFirmwareHash>(),
    firmwareUpdate: Type.Unsafe<typeof firmwareUpdate>(),
    resetDevice: Type.Unsafe<typeof resetDevice>(),
    loadDevice: Type.Unsafe<typeof loadDevice>(),
    recoveryDevice: Type.Unsafe<typeof recoveryDevice>(),
    wipeDevice: Type.Unsafe<typeof wipeDevice>(),
    backupDevice: Type.Unsafe<typeof backupDevice>(),
    changePin: Type.Unsafe<typeof changePin>(),
    changeWipeCode: Type.Unsafe<typeof changeWipeCode>(),
    changeLanguage: Type.Unsafe<typeof changeLanguage>(),
    applySettings: Type.Unsafe<typeof applySettings>(),
    applyFlags: Type.Unsafe<typeof applyFlags>(),
    authenticateDevice: Type.Unsafe<typeof authenticateDevice>(),
    setBusy: Type.Unsafe<typeof setBusy>(),
    setBrightness: Type.Unsafe<typeof setBrightness>(),
    showDeviceTutorial: Type.Unsafe<typeof showDeviceTutorial>(),
    bleUnpair: Type.Unsafe<typeof bleUnpair>(),
    requestLogin: Type.Unsafe<typeof requestLogin>(),
    cipherKeyValue: Type.Unsafe<typeof cipherKeyValue>(),
    unlockPath: Type.Unsafe<typeof unlockPath>(),
    getOwnershipId: Type.Unsafe<typeof getOwnershipId>(),
    getOwnershipProof: Type.Unsafe<typeof getOwnershipProof>(),
    thpGetCredentials: Type.Unsafe<typeof thpGetCredentials>(),
    thpRemoveCredentials: Type.Unsafe<typeof thpRemoveCredentials>(),
});
export type TrezorConnectDevice = Static<typeof TrezorConnectDevice>;

// Blockchain backend operations (no device needed)
export const TrezorConnectBlockchain = Type.Object({
    blockchainSubscribe: Type.Unsafe<typeof blockchainSubscribe>(),
    blockchainUnsubscribe: Type.Unsafe<typeof blockchainUnsubscribe>(),
    blockchainDisconnect: Type.Unsafe<typeof blockchainDisconnect>(),
    blockchainSetCustomBackend: Type.Unsafe<typeof blockchainSetCustomBackend>(),
    blockchainGetInfo: Type.Unsafe<typeof blockchainGetInfo>(),
    blockchainValidateEvmRpcUrl: Type.Unsafe<typeof blockchainValidateEvmRpcUrl>(),
    blockchainEstimateFee: Type.Unsafe<typeof blockchainEstimateFee>(),
    blockchainGetAccountBalanceHistory: Type.Unsafe<typeof blockchainGetAccountBalanceHistory>(),
    blockchainGetTransactions: Type.Unsafe<typeof blockchainGetTransactions>(),
    blockchainEvmRpcCall: Type.Unsafe<typeof blockchainEvmRpcCall>(),
    blockchainGetCurrentFiatRates: Type.Unsafe<typeof blockchainGetCurrentFiatRates>(),
    blockchainGetFiatRatesForTimestamps: Type.Unsafe<typeof blockchainGetFiatRatesForTimestamps>(),
    blockchainSubscribeFiatRates: Type.Unsafe<typeof blockchainSubscribeFiatRates>(),
    blockchainUnsubscribeFiatRates: Type.Unsafe<typeof blockchainUnsubscribeFiatRates>(),
    pushTransaction: Type.Unsafe<typeof pushTransaction>(),
    getNonce: Type.Unsafe<typeof getNonce>(),
});
export type TrezorConnectBlockchain = Static<typeof TrezorConnectBlockchain>;

// Generic account and address operations (multi-coin)
export const TrezorConnectAccount = Type.Object({
    getAddress: Type.Unsafe<typeof getAddress>(),
    getPublicKey: Type.Unsafe<typeof getPublicKey>(),
    getAccountInfo: Type.Unsafe<typeof getAccountInfo>(),
    getAccountDescriptor: Type.Unsafe<typeof getAccountDescriptor>(),
    discoverAccounts: Type.Unsafe<typeof discoverAccounts>(),
    signMessage: Type.Unsafe<typeof signMessage>(),
    verifyMessage: Type.Unsafe<typeof verifyMessage>(),
    getSettings: Type.Unsafe<typeof getSettings>(),
    getCoinInfo: Type.Unsafe<typeof getCoinInfo>(),
});
export type TrezorConnectAccount = Static<typeof TrezorConnectAccount>;

// Bitcoin-specific operations
export const TrezorConnectBitcoin = Type.Object({
    signTransaction: Type.Unsafe<typeof signTransaction>(),
    composeTransaction: Type.Unsafe<typeof composeTransaction>(),
    authorizeCoinjoin: Type.Unsafe<typeof authorizeCoinjoin>(),
    cancelCoinjoinAuthorization: Type.Unsafe<typeof cancelCoinjoinAuthorization>(),
});
export type TrezorConnectBitcoin = Static<typeof TrezorConnectBitcoin>;

// Ethereum-specific operations
export const TrezorConnectEthereum = Type.Object({
    ethereumGetAddress: Type.Unsafe<typeof ethereumGetAddress>(),
    ethereumGetPublicKey: Type.Unsafe<typeof ethereumGetPublicKey>(),
    ethereumSignTransaction: Type.Unsafe<typeof ethereumSignTransaction>(),
    ethereumSignMessage: Type.Unsafe<typeof ethereumSignMessage>(),
    ethereumSignTypedData: Type.Unsafe<typeof ethereumSignTypedData>(),
    ethereumVerifyMessage: Type.Unsafe<typeof ethereumVerifyMessage>(),
});
export type TrezorConnectEthereum = Static<typeof TrezorConnectEthereum>;

// Cardano-specific operations
export const TrezorConnectCardano = Type.Object({
    cardanoGetAddress: Type.Unsafe<typeof cardanoGetAddress>(),
    cardanoGetPublicKey: Type.Unsafe<typeof cardanoGetPublicKey>(),
    cardanoGetNativeScriptHash: Type.Unsafe<typeof cardanoGetNativeScriptHash>(),
    cardanoSignTransaction: Type.Unsafe<typeof cardanoSignTransaction>(),
    cardanoSignMessage: Type.Unsafe<typeof cardanoSignMessage>(),
    cardanoComposeTransaction: Type.Unsafe<typeof cardanoComposeTransaction>(),
});
export type TrezorConnectCardano = Static<typeof TrezorConnectCardano>;

// Monero-specific operations
export const TrezorConnectMonero = Type.Object({
    moneroGetAddress: Type.Unsafe<typeof moneroGetAddress>(),
    moneroGetWatchKey: Type.Unsafe<typeof moneroGetWatchKey>(),
    moneroKeyImageSync: Type.Unsafe<typeof moneroKeyImageSync>(),
    moneroSignTransaction: Type.Unsafe<typeof moneroSignTransaction>(),
});
export type TrezorConnectMonero = Static<typeof TrezorConnectMonero>;

// Ripple-specific operations
export const TrezorConnectRipple = Type.Object({
    rippleGetAddress: Type.Unsafe<typeof rippleGetAddress>(),
    rippleSignTransaction: Type.Unsafe<typeof rippleSignTransaction>(),
});
export type TrezorConnectRipple = Static<typeof TrezorConnectRipple>;

// Solana-specific operations
export const TrezorConnectSolana = Type.Object({
    solanaGetAddress: Type.Unsafe<typeof solanaGetAddress>(),
    solanaGetPublicKey: Type.Unsafe<typeof solanaGetPublicKey>(),
    solanaSignTransaction: Type.Unsafe<typeof solanaSignTransaction>(),
    solanaComposeTransaction: Type.Unsafe<typeof solanaComposeTransaction>(),
});
export type TrezorConnectSolana = Static<typeof TrezorConnectSolana>;

// Stellar-specific operations
export const TrezorConnectStellar = Type.Object({
    stellarGetAddress: Type.Unsafe<typeof stellarGetAddress>(),
    stellarSignTransaction: Type.Unsafe<typeof stellarSignTransaction>(),
});
export type TrezorConnectStellar = Static<typeof TrezorConnectStellar>;

// Tezos-specific operations
export const TrezorConnectTezos = Type.Object({
    tezosGetAddress: Type.Unsafe<typeof tezosGetAddress>(),
    tezosGetPublicKey: Type.Unsafe<typeof tezosGetPublicKey>(),
    tezosSignTransaction: Type.Unsafe<typeof tezosSignTransaction>(),
});
export type TrezorConnectTezos = Static<typeof TrezorConnectTezos>;

// Tron-specific operations
export const TrezorConnectTron = Type.Object({
    tronGetAddress: Type.Unsafe<typeof tronGetAddress>(),
    tronSignTransaction: Type.Unsafe<typeof tronSignTransaction>(),
});
export type TrezorConnectTron = Static<typeof TrezorConnectTron>;

// Evolu identity protocol operations
export const TrezorConnectEvolu = Type.Object({
    evoluGetNode: Type.Unsafe<typeof evoluGetNode>(),
    evoluSignRegistrationRequest: Type.Unsafe<typeof evoluSignRegistrationRequest>(),
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
