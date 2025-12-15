import type { applyFlags } from './applyFlags';
import type { applySettings } from './applySettings';
import type { authenticateDevice } from './authenticateDevice';
import type { authorizeCoinjoin } from './authorizeCoinjoin';
import type { backupDevice } from './backupDevice';
import type { bleUnpair } from './bleUnpair';
import type { blockchainDisconnect } from './blockchainDisconnect';
import type { blockchainEstimateFee } from './blockchainEstimateFee';
import type { blockchainEvmRpcCall } from './blockchainEvmRpcCall';
import type { blockchainGetAccountBalanceHistory } from './blockchainGetAccountBalanceHistory';
import type { blockchainGetCurrentFiatRates } from './blockchainGetCurrentFiatRates';
import type { blockchainGetFiatRatesForTimestamps } from './blockchainGetFiatRatesForTimestamps';
import type { blockchainGetInfo } from './blockchainGetInfo';
import type { blockchainGetTransactions } from './blockchainGetTransactions';
import type { blockchainSetCustomBackend } from './blockchainSetCustomBackend';
import type { blockchainSubscribe } from './blockchainSubscribe';
import type { blockchainSubscribeFiatRates } from './blockchainSubscribeFiatRates';
import type { blockchainUnsubscribe } from './blockchainUnsubscribe';
import type { blockchainUnsubscribeFiatRates } from './blockchainUnsubscribeFiatRates';
import type { cancel } from './cancel';
import type { cancelCoinjoinAuthorization } from './cancelCoinjoinAuthorization';
import type { cardanoComposeTransaction } from './cardanoComposeTransaction';
import type { cardanoGetAddress } from './cardanoGetAddress';
import type { cardanoGetNativeScriptHash } from './cardanoGetNativeScriptHash';
import type { cardanoGetPublicKey } from './cardanoGetPublicKey';
import type { cardanoSignMessage } from './cardanoSignMessage';
import type { cardanoSignTransaction } from './cardanoSignTransaction';
import type { changeLanguage } from './changeLanguage';
import type { changePin } from './changePin';
import type { changeWipeCode } from './changeWipeCode';
import type { cipherKeyValue } from './cipherKeyValue';
import type { composeTransaction } from './composeTransaction';
import type { discoverAccounts } from './discoverAccounts';
import type { dispose } from './dispose';
import type { eosGetPublicKey } from './eosGetPublicKey';
import type { eosSignTransaction } from './eosSignTransaction';
import type { ethereumGetAddress } from './ethereumGetAddress';
import type { ethereumGetPublicKey } from './ethereumGetPublicKey';
import type { ethereumSignMessage } from './ethereumSignMessage';
import type { ethereumSignTransaction } from './ethereumSignTransaction';
import type { ethereumSignTypedData } from './ethereumSignTypedData';
import type { ethereumVerifyMessage } from './ethereumVerifyMessage';
import type { evoluGetDelegatedIdentityKey } from './evoluGetDelegatedIdentityKey';
import type { evoluGetNode } from './evoluGetNode';
import type { evoluSignRegistrationRequest } from './evoluSignRegistrationRequest';
import type { firmwareUpdate } from './firmwareUpdate';
import type { getAccountDescriptor } from './getAccountDescriptor';
import type { getAccountInfo } from './getAccountInfo';
import type { getAddress } from './getAddress';
import type { getCoinInfo } from './getCoinInfo';
import type { getDeviceState } from './getDeviceState';
import type { getFeatures } from './getFeatures';
import type { getFirmwareHash } from './getFirmwareHash';
import type { getNonce } from './getNonce';
import type { getOwnershipId } from './getOwnershipId';
import type { getOwnershipProof } from './getOwnershipProof';
import type { getPublicKey } from './getPublicKey';
import type { getSettings } from './getSettings';
import type { init } from './init';
import type { loadDevice } from './loadDevice';
import type { manifest } from './manifest';
import type { moneroGetAddress } from './moneroGetAddress';
import type { moneroGetWatchKey } from './moneroGetWatchKey';
import type { moneroKeyImageSync } from './moneroKeyImageSync';
import type { moneroSignTransaction } from './moneroSignTransaction';
import type { nemGetAddress } from './nemGetAddress';
import type { nemSignTransaction } from './nemSignTransaction';
import type { off } from './off';
import type { on } from './on';
import type { pushTransaction } from './pushTransaction';
import type { recoveryDevice } from './recoveryDevice';
import type { removeAllListeners } from './removeAllListeners';
import type { requestLogin } from './requestLogin';
import type { resetDevice } from './resetDevice';
import type { rippleGetAddress } from './rippleGetAddress';
import type { rippleSignTransaction } from './rippleSignTransaction';
import type { setBrightness } from './setBrightness';
import type { setBusy } from './setBusy';
import type { setProxy } from './setProxy';
import type { setTransports } from './setTransports';
import type { showDeviceTutorial } from './showDeviceTutorial';
import type { signMessage } from './signMessage';
import type { signTransaction } from './signTransaction';
import type { solanaComposeTransaction } from './solanaComposeTransaction';
import type { solanaGetAddress } from './solanaGetAddress';
import type { solanaGetPublicKey } from './solanaGetPublicKey';
import type { solanaSignTransaction } from './solanaSignTransaction';
import type { stellarGetAddress } from './stellarGetAddress';
import type { stellarSignTransaction } from './stellarSignTransaction';
import type { tezosGetAddress } from './tezosGetAddress';
import type { tezosGetPublicKey } from './tezosGetPublicKey';
import type { tezosSignTransaction } from './tezosSignTransaction';
import type { thpGetCredentials } from './thpGetCredentials';
import type { thpRemoveCredentials } from './thpRemoveCredentials';
import type { uiResponse } from './uiResponse';
import type { unlockPath } from './unlockPath';
import type { verifyMessage } from './verifyMessage';
import type { wipeDevice } from './wipeDevice';

export interface TrezorConnect {
    // https://connect.trezor.io/9/methods/device/applyFlags/
    applyFlags: typeof applyFlags;

    // https://connect.trezor.io/9/methods/device/applySettings/
    applySettings: typeof applySettings;

    // https://connect.trezor.io/9/methods/device/authenticateDevice/
    authenticateDevice: typeof authenticateDevice;

    // https://connect.trezor.io/9/methods/bitcoin/authorizeCoinjoin/
    authorizeCoinjoin: typeof authorizeCoinjoin;

    // https://connect.trezor.io/9/methods/bitcoin/cancelCoinjoinAuthorization/
    cancelCoinjoinAuthorization: typeof cancelCoinjoinAuthorization;

    // https://connect.trezor.io/9/methods/device/showDeviceTutorial/
    showDeviceTutorial: typeof showDeviceTutorial;

    // https://connect.trezor.io/9/methods/device/backupDevice/
    backupDevice: typeof backupDevice;

    // https://connect.trezor.io/9/methods/device/bleUnpair/
    bleUnpair: typeof bleUnpair;

    // todo: link docs
    blockchainDisconnect: typeof blockchainDisconnect;

    // todo: link docs
    blockchainEstimateFee: typeof blockchainEstimateFee;

    // todo: link docs
    blockchainGetAccountBalanceHistory: typeof blockchainGetAccountBalanceHistory;

    // todo: link docs
    blockchainGetCurrentFiatRates: typeof blockchainGetCurrentFiatRates;

    // todo: link docs
    blockchainGetInfo: typeof blockchainGetInfo;

    // todo: link docs
    blockchainEvmRpcCall: typeof blockchainEvmRpcCall;

    // todo: link docs
    blockchainGetFiatRatesForTimestamps: typeof blockchainGetFiatRatesForTimestamps;

    // todo: link docs
    blockchainGetTransactions: typeof blockchainGetTransactions;

    // todo: link docs
    blockchainSetCustomBackend: typeof blockchainSetCustomBackend;

    // todo: link docs
    blockchainSubscribe: typeof blockchainSubscribe;

    // todo: link docs
    blockchainSubscribeFiatRates: typeof blockchainSubscribeFiatRates;

    // todo: link docs
    blockchainUnsubscribe: typeof blockchainUnsubscribe;

    // todo: link docs
    blockchainUnsubscribeFiatRates: typeof blockchainUnsubscribeFiatRates;

    // todo: link docs
    cancel: typeof cancel;

    // https://connect.trezor.io/9/methods/cardano/cardanoGetAddress/
    cardanoGetAddress: typeof cardanoGetAddress;

    // https://connect.trezor.io/9/methods/cardano/cardanoGetNativeScriptHash/
    cardanoGetNativeScriptHash: typeof cardanoGetNativeScriptHash;

    // https://connect.trezor.io/9/methods/cardano/cardanoGetPublicKey/
    cardanoGetPublicKey: typeof cardanoGetPublicKey;

    // https://connect.trezor.io/9/methods/cardano/cardanoSignTransaction/
    cardanoSignTransaction: typeof cardanoSignTransaction;

    // https://connect.trezor.io/9/methods/cardano/cardanoSignMessage/
    cardanoSignMessage: typeof cardanoSignMessage;

    // https://connect.trezor.io/9/methods/cardano/cardanoComposeTransaction/
    cardanoComposeTransaction: typeof cardanoComposeTransaction;

    // https://connect.trezor.io/9/methods/device/changeLanguage/
    changeLanguage: typeof changeLanguage;

    // https://connect.trezor.io/9/methods/device/changePin/
    changePin: typeof changePin;

    // https://connect.trezor.io/9/methods/device/changeWipeCode/
    changeWipeCode: typeof changeWipeCode;

    // https://connect.trezor.io/9/methods/other/cipherKeyValue/
    cipherKeyValue: typeof cipherKeyValue;

    // todo: link docs
    evoluGetNode: typeof evoluGetNode;

    // todo: link docs
    evoluSignRegistrationRequest: typeof evoluSignRegistrationRequest;

    // todo: link docs
    evoluGetDelegatedIdentityKey: typeof evoluGetDelegatedIdentityKey;

    // https://connect.trezor.io/9/methods/bitcoin/composeTransaction/
    composeTransaction: typeof composeTransaction;

    // todo: link docs
    dispose: typeof dispose;

    // https://connect.trezor.io/9/methods/eos/eosGetPublicKey/
    eosGetPublicKey: typeof eosGetPublicKey;

    // https://connect.trezor.io/9/methods/eos/eosSignTransaction/
    eosSignTransaction: typeof eosSignTransaction;

    // https://connect.trezor.io/9/methods/ethereum/ethereumGetAddress/
    ethereumGetAddress: typeof ethereumGetAddress;

    // https://connect.trezor.io/9/methods/ethereum/ethereumGetPublicKey/
    ethereumGetPublicKey: typeof ethereumGetPublicKey;

    // https://connect.trezor.io/9/methods/ethereum/ethereumSignMessage/
    ethereumSignMessage: typeof ethereumSignMessage;

    // https://connect.trezor.io/9/methods/ethereum/ethereumSignTransaction/
    ethereumSignTransaction: typeof ethereumSignTransaction;

    // https://connect.trezor.io/9/methods/ethereum/ethereumSignTypedData/
    ethereumSignTypedData: typeof ethereumSignTypedData;

    // https://connect.trezor.io/9/methods/ethereum/ethereumVerifyMessage/
    ethereumVerifyMessage: typeof ethereumVerifyMessage;

    // https://connect.trezor.io/9/methods/device/firmwareUpdate/
    firmwareUpdate: typeof firmwareUpdate;

    // https://connect.trezor.io/9/methods/other/getAccountDescriptor/
    getAccountDescriptor: typeof getAccountDescriptor;

    // https://connect.trezor.io/9/methods/bitcoin/getAccountInfo/
    getAccountInfo: typeof getAccountInfo;

    discoverAccounts: typeof discoverAccounts;

    // https://connect.trezor.io/9/methods/bitcoin/getAddress/
    getAddress: typeof getAddress;

    // https://connect.trezor.io/9/methods/other/getCoinInfo/
    getCoinInfo: typeof getCoinInfo;

    // https://connect.trezor.io/9/methods/device/getDeviceState/
    getDeviceState: typeof getDeviceState;

    // https://connect.trezor.io/9/methods/device/getFeatures/
    getFeatures: typeof getFeatures;

    // https://connect.trezor.io/9/methods/device/getFirmwareHash/
    getFirmwareHash: typeof getFirmwareHash;

    // https://connect.trezor.io/9/methods/other/getOwnershipId/
    getOwnershipId: typeof getOwnershipId;

    // https://connect.trezor.io/9/methods/other/getOwnershipProof/
    getOwnershipProof: typeof getOwnershipProof;

    // https://connect.trezor.io/9/methods/bitcoin/getPublicKey/
    getPublicKey: typeof getPublicKey;

    // todo: link docs
    getNonce: typeof getNonce;

    // todo: link docs
    getSettings: typeof getSettings;

    // https://connect.trezor.io/9/methods/device/thpGetCredentials/
    thpGetCredentials: typeof thpGetCredentials;

    // https://connect.trezor.io/9/methods/device/thpRemoveCredentials/
    thpRemoveCredentials: typeof thpRemoveCredentials;

    // https://connect.trezor.io/9/methods/other/init/
    init: typeof init;

    // https://connect.trezor.io/9/methods/other/manifest/
    manifest: typeof manifest;

    // https://connect.trezor.io/9/methods/monero/moneroGetAddress/
    moneroGetAddress: typeof moneroGetAddress;
    // https://connect.trezor.io/9/methods/monero/moneroGetWatchKey/
    moneroGetWatchKey: typeof moneroGetWatchKey;
    // https://connect.trezor.io/9/methods/monero/moneroKeyImageSync/
    moneroKeyImageSync: typeof moneroKeyImageSync;
    // https://connect.trezor.io/9/methods/monero/moneroSignTransaction/
    moneroSignTransaction: typeof moneroSignTransaction;

    // https://connect.trezor.io/9/methods/nem/nemGetAddress/
    nemGetAddress: typeof nemGetAddress;

    // https://connect.trezor.io/9/methods/nem/nemSignTransaction/
    nemSignTransaction: typeof nemSignTransaction;

    // todo: link docs
    off: typeof off;

    // todo: link docs
    on: typeof on;

    // https://connect.trezor.io/9/methods/bitcoin/pushTransaction/
    pushTransaction: typeof pushTransaction;

    // todo: link docs
    recoveryDevice: typeof recoveryDevice;

    // todo link docs
    removeAllListeners: typeof removeAllListeners;

    // https://connect.trezor.io/9/methods/other/requestLogin/
    requestLogin: typeof requestLogin;

    // https://connect.trezor.io/9/methods/device/resetDevice/
    resetDevice: typeof resetDevice;

    // https://connect.trezor.io/9/methods/device/loadDevice/
    loadDevice: typeof loadDevice;

    // https://connect.trezor.io/9/methods/ripple/rippleGetAddress/
    rippleGetAddress: typeof rippleGetAddress;

    // https://connect.trezor.io/9/methods/ripple/rippleSignTransaction/
    rippleSignTransaction: typeof rippleSignTransaction;

    // todo: link docs
    setBrightness: typeof setBrightness;

    // https://connect.trezor.io/9/methods/device/setBusy/
    setBusy: typeof setBusy;

    // todo: link docs
    setProxy: typeof setProxy;

    // todo: link docs
    setTransports: typeof setTransports;

    // https://connect.trezor.io/9/methods/bitcoin/signMessage/
    signMessage: typeof signMessage;

    // https://connect.trezor.io/9/methods/bitcoin/signTransaction/
    signTransaction: typeof signTransaction;

    // https://connect.trezor.io/9/methods/solana/solanaComposeTransaction/
    solanaComposeTransaction: typeof solanaComposeTransaction;

    // https://connect.trezor.io/9/methods/solana/solanaGetPublicKey/
    solanaGetPublicKey: typeof solanaGetPublicKey;

    // https://connect.trezor.io/9/methods/solana/solanaGetAddress/
    solanaGetAddress: typeof solanaGetAddress;

    // https://connect.trezor.io/9/methods/solana/solanaSignTransaction/
    solanaSignTransaction: typeof solanaSignTransaction;

    // https://connect.trezor.io/9/methods/stellar/stellarGetAddress/
    stellarGetAddress: typeof stellarGetAddress;

    // https://connect.trezor.io/9/methods/stellar/stellarSignTransaction/
    stellarSignTransaction: typeof stellarSignTransaction;

    // https://connect.trezor.io/9/methods/tezos/tezosGetAddress/
    tezosGetAddress: typeof tezosGetAddress;

    // https://connect.trezor.io/9/methods/tezos/tezosGetPublicKey/
    tezosGetPublicKey: typeof tezosGetPublicKey;

    // https://connect.trezor.io/9/methods/tezos/tezosSignTransaction/
    tezosSignTransaction: typeof tezosSignTransaction;

    // todo: link docs
    uiResponse: typeof uiResponse;

    // https://connect.trezor.io/9/methods/other/unlockPath/
    unlockPath: typeof unlockPath;

    // https://connect.trezor.io/9/methods/bitcoin/verifyMessage/
    verifyMessage: typeof verifyMessage;

    // https://connect.trezor.io/9/methods/device/wipeDevice/
    wipeDevice: typeof wipeDevice;
}
