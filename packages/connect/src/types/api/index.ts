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
import { cardanoGetAddress } from './cardanoGetAddress';
import { cardanoGetNativeScriptHash } from './cardanoGetNativeScriptHash';
import { cardanoGetPublicKey } from './cardanoGetPublicKey';
import { cardanoSignTransaction } from './cardanoSignTransaction';
import { changePin } from './changePin';
import { cipherKeyValue } from './cipherKeyValue';
import { composeTransaction } from './composeTransaction';
import { disableWebUSB } from './disableWebUSB';
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
import { renderWebUSBButton } from './renderWebUSBButton';
import { requestLogin } from './requestLogin';
import { requestWebUSBDevice } from './requestWebUSBDevice';
import { resetDevice } from './resetDevice';
import { rippleGetAddress } from './rippleGetAddress';
import { rippleSignTransaction } from './rippleSignTransaction';
import { setBusy } from './setBusy';
import { setProxy } from './setProxy';
import { signMessage } from './signMessage';
import { signTransaction } from './signTransaction';
import { solanaGetPublicKey } from './solanaGetPublicKey';
import { solanaGetAddress } from './solanaGetAddress';
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
import { checkFirmwareAuthenticity } from './checkFirmwareAuthenticity';
import { cancelCoinjoinAuthorization } from './cancelCoinjoinAuthorization';
import { showDeviceTutorial } from './showDeviceTutorial';

export interface TrezorConnect {
    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/applyFlags.md
    applyFlags: typeof applyFlags;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/applySettings.md
    applySettings: typeof applySettings;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/authenticateDevice.md
    authenticateDevice: typeof authenticateDevice;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/authorizeCoinjoin.md
    authorizeCoinjoin: typeof authorizeCoinjoin;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/cancelCoinjoinAuthorization.md
    cancelCoinjoinAuthorization: typeof cancelCoinjoinAuthorization;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/showDeviceTutorial.md
    showDeviceTutorial: typeof showDeviceTutorial;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/backupDevice.md
    backupDevice: typeof backupDevice;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/binanceGetAddress.md
    binanceGetAddress: typeof binanceGetAddress;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/binanceGetPublicKey.md
    binanceGetPublicKey: typeof binanceGetPublicKey;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/binanceSignTransaction.md
    binanceSignTransaction: typeof binanceSignTransaction;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/blockchainDisconnect.md
    blockchainDisconnect: typeof blockchainDisconnect;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/blockchainEstimateFee.md
    blockchainEstimateFee: typeof blockchainEstimateFee;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/blockchainGetAccountBalanceHistory.md
    blockchainGetAccountBalanceHistory: typeof blockchainGetAccountBalanceHistory;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/blockchainGetCurrentFiatRates.md
    blockchainGetCurrentFiatRates: typeof blockchainGetCurrentFiatRates;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/blockchainGetFiatRatesForTimestamps.md
    blockchainGetFiatRatesForTimestamps: typeof blockchainGetFiatRatesForTimestamps;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/blockchainGetTransactions.md
    blockchainGetTransactions: typeof blockchainGetTransactions;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/blockchainSetCustomBackend.md
    blockchainSetCustomBackend: typeof blockchainSetCustomBackend;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/blockchainSubscribe.md
    blockchainSubscribe: typeof blockchainSubscribe;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/blockchainSubscribeFiatRates.md
    blockchainSubscribeFiatRates: typeof blockchainSubscribeFiatRates;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/blockchainUnsubscribe.md
    blockchainUnsubscribe: typeof blockchainUnsubscribe;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/blockchainUnsubscribeFiatRates.md
    blockchainUnsubscribeFiatRates: typeof blockchainUnsubscribeFiatRates;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/cancel.md
    cancel: typeof cancel;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/cardanoGetAddress.md
    cardanoGetAddress: typeof cardanoGetAddress;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/cardanoGetNativeScriptHash.md
    cardanoGetNativeScriptHash: typeof cardanoGetNativeScriptHash;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/cardanoGetPublicKey.md
    cardanoGetPublicKey: typeof cardanoGetPublicKey;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/cardanoSignTransaction.md
    cardanoSignTransaction: typeof cardanoSignTransaction;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/changePin.md
    changePin: typeof changePin;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/cipherKeyValue.md
    cipherKeyValue: typeof cipherKeyValue;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/composeTransaction.md
    composeTransaction: typeof composeTransaction;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/disableWebUSB.md
    disableWebUSB: typeof disableWebUSB;

    requestWebUSBDevice: typeof requestWebUSBDevice;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/dispose.md
    dispose: typeof dispose;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/eosGetPublicKey.md
    eosGetPublicKey: typeof eosGetPublicKey;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/eosSignTransaction.md
    eosSignTransaction: typeof eosSignTransaction;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/ethereumGetAddress.md
    ethereumGetAddress: typeof ethereumGetAddress;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/ethereumGetPublicKey.md
    ethereumGetPublicKey: typeof ethereumGetPublicKey;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/ethereumSignMessage.md
    ethereumSignMessage: typeof ethereumSignMessage;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/ethereumSignTransaction.md
    ethereumSignTransaction: typeof ethereumSignTransaction;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/ethereumSignTypedData.md
    ethereumSignTypedData: typeof ethereumSignTypedData;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/ethereumVerifyMessage.md
    ethereumVerifyMessage: typeof ethereumVerifyMessage;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/firmwareUpdate.md
    firmwareUpdate: typeof firmwareUpdate;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/getAccountInfo.md
    getAccountInfo: typeof getAccountInfo;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/getAddress.md
    getAddress: typeof getAddress;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/getCoinInfo.md
    getCoinInfo: typeof getCoinInfo;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/getDeviceState.md
    getDeviceState: typeof getDeviceState;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/getFeatures.md
    getFeatures: typeof getFeatures;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/getFirmwareHash.md
    getFirmwareHash: typeof getFirmwareHash;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/getOwnershipId.md
    getOwnershipId: typeof getOwnershipId;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/getOwnershipProof.md
    getOwnershipProof: typeof getOwnershipProof;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/getPublicKey.md
    getPublicKey: typeof getPublicKey;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/getSettings.md
    getSettings: typeof getSettings;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/init.md
    init: typeof init;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/manifest.md
    manifest: typeof manifest;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/nemGetAddress.md
    nemGetAddress: typeof nemGetAddress;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/nemSignTransaction.md
    nemSignTransaction: typeof nemSignTransaction;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/off.md
    off: typeof off;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/on.md
    on: typeof on;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/pushTransaction.md
    pushTransaction: typeof pushTransaction;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/rebootToBootloader.md
    rebootToBootloader: typeof rebootToBootloader;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/recoveryDevice.md
    recoveryDevice: typeof recoveryDevice;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/removeAllListeners.md
    removeAllListeners: typeof removeAllListeners;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/renderWebUSBButton.md
    renderWebUSBButton: typeof renderWebUSBButton;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/requestLogin.md
    requestLogin: typeof requestLogin;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/resetDevice.md
    resetDevice: typeof resetDevice;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/rippleGetAddress.md
    rippleGetAddress: typeof rippleGetAddress;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/rippleSignTransaction.md
    rippleSignTransaction: typeof rippleSignTransaction;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/setBusy.md
    setBusy: typeof setBusy;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/setProxy.md
    setProxy: typeof setProxy;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/signMessage.md
    signMessage: typeof signMessage;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/signTransaction.md
    signTransaction: typeof signTransaction;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/solanaGetPublicKey.md
    solanaGetPublicKey: typeof solanaGetPublicKey;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/solanaGetAddress.md
    solanaGetAddress: typeof solanaGetAddress;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/solanaSignTransaction.md
    solanaSignTransaction: typeof solanaSignTransaction;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/stellarGetAddress.md
    stellarGetAddress: typeof stellarGetAddress;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/stellarSignTransaction.md
    stellarSignTransaction: typeof stellarSignTransaction;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/tezosGetAddress.md
    tezosGetAddress: typeof tezosGetAddress;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/tezosGetPublicKey.md
    tezosGetPublicKey: typeof tezosGetPublicKey;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/tezosSignTransaction.md
    tezosSignTransaction: typeof tezosSignTransaction;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/uiResponse.md
    uiResponse: typeof uiResponse;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/unlockPath.md
    unlockPath: typeof unlockPath;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/verifyMessage.md
    verifyMessage: typeof verifyMessage;

    // https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/methods/wipeDevice.md
    wipeDevice: typeof wipeDevice;

    // todo: link docs
    checkFirmwareAuthenticity: typeof checkFirmwareAuthenticity;
}
