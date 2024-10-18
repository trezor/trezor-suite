import { applyFlags } from './applyFlags';
import { applySettings } from './applySettings';
import { authenticateDevice } from './authenticateDevice';
import { authorizeCoinjoin } from './authorizeCoinjoin';
import { backupDevice } from './backupDevice';
import { binanceGetAddress } from './binanceGetAddress';
import { binanceGetPublicKey } from './binanceGetPublicKey';
import { binanceSignTransaction } from './binanceSignTransaction';
import { blockchainDisconnect } from './blockchainDisconnect';
import { blockchainEstimateFee } from './blockchainEstimateFee';
import { blockchainGetAccountBalanceHistory } from './blockchainGetAccountBalanceHistory';
import { blockchainGetCurrentFiatRates } from './blockchainGetCurrentFiatRates';
import { blockchainGetFiatRatesForTimestamps } from './blockchainGetFiatRatesForTimestamps';
import { blockchainGetTransactions } from './blockchainGetTransactions';
import { blockchainSetCustomBackend } from './blockchainSetCustomBackend';
import { blockchainSubscribe } from './blockchainSubscribe';
import { blockchainSubscribeFiatRates } from './blockchainSubscribeFiatRates';
import { blockchainUnsubscribe } from './blockchainUnsubscribe';
import { blockchainUnsubscribeFiatRates } from './blockchainUnsubscribeFiatRates';
import { cancel } from './cancel';
import { cancelCoinjoinAuthorization } from './cancelCoinjoinAuthorization';
import { cardanoComposeTransaction } from './cardanoComposeTransaction';
import { cardanoGetAddress } from './cardanoGetAddress';
import { cardanoGetNativeScriptHash } from './cardanoGetNativeScriptHash';
import { cardanoGetPublicKey } from './cardanoGetPublicKey';
import { cardanoSignTransaction } from './cardanoSignTransaction';
import { changeLanguage } from './changeLanguage';
import { changePin } from './changePin';
import { changeWipeCode } from './changeWipeCode';
import { checkFirmwareAuthenticity } from './checkFirmwareAuthenticity';
import { cipherKeyValue } from './cipherKeyValue';
import { composeTransaction } from './composeTransaction';
import { dispose } from './dispose';
import { eosGetPublicKey } from './eosGetPublicKey';
import { eosSignTransaction } from './eosSignTransaction';
import { ethereumGetAddress } from './ethereumGetAddress';
import { ethereumGetPublicKey } from './ethereumGetPublicKey';
import { ethereumSignMessage } from './ethereumSignMessage';
import { ethereumSignTransaction } from './ethereumSignTransaction';
import { ethereumSignTypedData } from './ethereumSignTypedData';
import { ethereumVerifyMessage } from './ethereumVerifyMessage';
import { firmwareUpdate } from './firmwareUpdate';
import { getAccountDescriptor } from './getAccountDescriptor';
import { getAccountInfo } from './getAccountInfo';
import { getAddress } from './getAddress';
import { getCoinInfo } from './getCoinInfo';
import { getDeviceState } from './getDeviceState';
import { getFeatures } from './getFeatures';
import { getFirmwareHash } from './getFirmwareHash';
import { getOwnershipId } from './getOwnershipId';
import { getOwnershipProof } from './getOwnershipProof';
import { getPublicKey } from './getPublicKey';
import { getSettings } from './getSettings';
import { init } from './init';
import { manifest } from './manifest';
import { nemGetAddress } from './nemGetAddress';
import { nemSignTransaction } from './nemSignTransaction';
import { off } from './off';
import { on } from './on';
import { pushTransaction } from './pushTransaction';
import { rebootToBootloader } from './rebootToBootloader';
import { recoveryDevice } from './recoveryDevice';
import { removeAllListeners } from './removeAllListeners';
import { requestLogin } from './requestLogin';
import { resetDevice } from './resetDevice';
import { rippleGetAddress } from './rippleGetAddress';
import { rippleSignTransaction } from './rippleSignTransaction';
import { setBrightness } from './setBrightness';
import { setBusy } from './setBusy';
import { setProxy } from './setProxy';
import { showDeviceTutorial } from './showDeviceTutorial';
import { signMessage } from './signMessage';
import { signTransaction } from './signTransaction';
import { solanaGetAddress } from './solanaGetAddress';
import { solanaGetPublicKey } from './solanaGetPublicKey';
import { solanaSignTransaction } from './solanaSignTransaction';
import { stellarGetAddress } from './stellarGetAddress';
import { stellarSignTransaction } from './stellarSignTransaction';
import { tezosGetAddress } from './tezosGetAddress';
import { tezosGetPublicKey } from './tezosGetPublicKey';
import { tezosSignTransaction } from './tezosSignTransaction';
import { uiResponse } from './uiResponse';
import { unlockPath } from './unlockPath';
import { verifyMessage } from './verifyMessage';
import { wipeDevice } from './wipeDevice';

export interface TrezorConnect {
    applyFlags: typeof applyFlags;

    applySettings: typeof applySettings;

    authenticateDevice: typeof authenticateDevice;

    authorizeCoinjoin: typeof authorizeCoinjoin;

    cancelCoinjoinAuthorization: typeof cancelCoinjoinAuthorization;

    showDeviceTutorial: typeof showDeviceTutorial;

    backupDevice: typeof backupDevice;

    binanceGetAddress: typeof binanceGetAddress;

    binanceGetPublicKey: typeof binanceGetPublicKey;

    binanceSignTransaction: typeof binanceSignTransaction;

    blockchainDisconnect: typeof blockchainDisconnect;

    blockchainEstimateFee: typeof blockchainEstimateFee;

    blockchainGetAccountBalanceHistory: typeof blockchainGetAccountBalanceHistory;

    blockchainGetCurrentFiatRates: typeof blockchainGetCurrentFiatRates;

    blockchainGetFiatRatesForTimestamps: typeof blockchainGetFiatRatesForTimestamps;

    blockchainGetTransactions: typeof blockchainGetTransactions;

    blockchainSetCustomBackend: typeof blockchainSetCustomBackend;

    blockchainSubscribe: typeof blockchainSubscribe;

    blockchainSubscribeFiatRates: typeof blockchainSubscribeFiatRates;

    blockchainUnsubscribe: typeof blockchainUnsubscribe;

    blockchainUnsubscribeFiatRates: typeof blockchainUnsubscribeFiatRates;

    cancel: typeof cancel;

    cardanoGetAddress: typeof cardanoGetAddress;

    cardanoGetNativeScriptHash: typeof cardanoGetNativeScriptHash;

    cardanoGetPublicKey: typeof cardanoGetPublicKey;

    cardanoSignTransaction: typeof cardanoSignTransaction;

    cardanoComposeTransaction: typeof cardanoComposeTransaction;

    changeLanguage: typeof changeLanguage;

    changePin: typeof changePin;

    changeWipeCode: typeof changeWipeCode;

    cipherKeyValue: typeof cipherKeyValue;

    composeTransaction: typeof composeTransaction;

    dispose: typeof dispose;

    eosGetPublicKey: typeof eosGetPublicKey;

    eosSignTransaction: typeof eosSignTransaction;

    ethereumGetAddress: typeof ethereumGetAddress;

    ethereumGetPublicKey: typeof ethereumGetPublicKey;

    ethereumSignMessage: typeof ethereumSignMessage;

    ethereumSignTransaction: typeof ethereumSignTransaction;

    ethereumSignTypedData: typeof ethereumSignTypedData;

    ethereumVerifyMessage: typeof ethereumVerifyMessage;

    firmwareUpdate: typeof firmwareUpdate;

    getAccountDescriptor: typeof getAccountDescriptor;

    getAccountInfo: typeof getAccountInfo;

    getAddress: typeof getAddress;

    getCoinInfo: typeof getCoinInfo;

    getDeviceState: typeof getDeviceState;

    getFeatures: typeof getFeatures;

    getFirmwareHash: typeof getFirmwareHash;

    getOwnershipId: typeof getOwnershipId;

    getOwnershipProof: typeof getOwnershipProof;

    getPublicKey: typeof getPublicKey;

    getSettings: typeof getSettings;

    init: typeof init;

    manifest: typeof manifest;

    nemGetAddress: typeof nemGetAddress;

    nemSignTransaction: typeof nemSignTransaction;

    off: typeof off;

    on: typeof on;

    pushTransaction: typeof pushTransaction;

    rebootToBootloader: typeof rebootToBootloader;

    recoveryDevice: typeof recoveryDevice;

    removeAllListeners: typeof removeAllListeners;

    requestLogin: typeof requestLogin;

    resetDevice: typeof resetDevice;

    rippleGetAddress: typeof rippleGetAddress;

    rippleSignTransaction: typeof rippleSignTransaction;

    setBrightness: typeof setBrightness;

    setBusy: typeof setBusy;

    setProxy: typeof setProxy;

    signMessage: typeof signMessage;

    signTransaction: typeof signTransaction;

    solanaGetPublicKey: typeof solanaGetPublicKey;

    solanaGetAddress: typeof solanaGetAddress;

    solanaSignTransaction: typeof solanaSignTransaction;

    stellarGetAddress: typeof stellarGetAddress;

    stellarSignTransaction: typeof stellarSignTransaction;

    tezosGetAddress: typeof tezosGetAddress;

    tezosGetPublicKey: typeof tezosGetPublicKey;

    tezosSignTransaction: typeof tezosSignTransaction;

    uiResponse: typeof uiResponse;

    unlockPath: typeof unlockPath;

    verifyMessage: typeof verifyMessage;

    wipeDevice: typeof wipeDevice;

    checkFirmwareAuthenticity: typeof checkFirmwareAuthenticity;
}
