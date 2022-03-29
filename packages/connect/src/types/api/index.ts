import { applyFlags } from './applyFlags';
import { applySettings } from './applySettings';
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
import { customMessage } from './customMessage';
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
import { resetDevice } from './resetDevice';
import { rippleGetAddress } from './rippleGetAddress';
import { rippleSignTransaction } from './rippleSignTransaction';
import { setProxy } from './setProxy';
import { signMessage } from './signMessage';
import { signTransaction } from './signTransaction';
import { stellarGetAddress } from './stellarGetAddress';
import { stellarSignTransaction } from './stellarSignTransaction';
import { tezosGetAddress } from './tezosGetAddress';
import { tezosGetPublicKey } from './tezosGetPublicKey';
import { tezosSignTransaction } from './tezosSignTransaction';
import { uiResponse } from './uiResponse';
import { verifyMessage } from './verifyMessage';
import { wipeDevice } from './wipeDevice';

export interface TrezorConnect {
    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/applyFlags.md
    applyFlags: typeof applyFlags;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/applySettings.md
    applySettings: typeof applySettings;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/backupDevice.md
    backupDevice: typeof backupDevice;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/binanceGetAddress.md
    binanceGetAddress: typeof binanceGetAddress;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/binanceGetPublicKey.md
    binanceGetPublicKey: typeof binanceGetPublicKey;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/binanceSignTransaction.md
    binanceSignTransaction: typeof binanceSignTransaction;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/blockchainDisconnect.md
    blockchainDisconnect: typeof blockchainDisconnect;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/blockchainEstimateFee.md
    blockchainEstimateFee: typeof blockchainEstimateFee;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/blockchainGetAccountBalanceHistory.md
    blockchainGetAccountBalanceHistory: typeof blockchainGetAccountBalanceHistory;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/blockchainGetCurrentFiatRates.md
    blockchainGetCurrentFiatRates: typeof blockchainGetCurrentFiatRates;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/blockchainGetFiatRatesForTimestamps.md
    blockchainGetFiatRatesForTimestamps: typeof blockchainGetFiatRatesForTimestamps;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/blockchainGetTransactions.md
    blockchainGetTransactions: typeof blockchainGetTransactions;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/blockchainSetCustomBackend.md
    blockchainSetCustomBackend: typeof blockchainSetCustomBackend;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/blockchainSubscribe.md
    blockchainSubscribe: typeof blockchainSubscribe;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/blockchainSubscribeFiatRates.md
    blockchainSubscribeFiatRates: typeof blockchainSubscribeFiatRates;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/blockchainUnsubscribe.md
    blockchainUnsubscribe: typeof blockchainUnsubscribe;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/blockchainUnsubscribeFiatRates.md
    blockchainUnsubscribeFiatRates: typeof blockchainUnsubscribeFiatRates;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/cancel.md
    cancel: typeof cancel;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/cardanoGetAddress.md
    cardanoGetAddress: typeof cardanoGetAddress;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/cardanoGetNativeScriptHash.md
    cardanoGetNativeScriptHash: typeof cardanoGetNativeScriptHash;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/cardanoGetPublicKey.md
    cardanoGetPublicKey: typeof cardanoGetPublicKey;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/cardanoSignTransaction.md
    cardanoSignTransaction: typeof cardanoSignTransaction;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/changePin.md
    changePin: typeof changePin;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/cipherKeyValue.md
    cipherKeyValue: typeof cipherKeyValue;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/composeTransaction.md
    composeTransaction: typeof composeTransaction;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/customMessage.md
    customMessage: typeof customMessage;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/disableWebUSB.md
    disableWebUSB: typeof disableWebUSB;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/dispose.md
    dispose: typeof dispose;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/eosGetPublicKey.md
    eosGetPublicKey: typeof eosGetPublicKey;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/eosSignTransaction.md
    eosSignTransaction: typeof eosSignTransaction;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/ethereumGetAddress.md
    ethereumGetAddress: typeof ethereumGetAddress;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/ethereumGetPublicKey.md
    ethereumGetPublicKey: typeof ethereumGetPublicKey;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/ethereumSignMessage.md
    ethereumSignMessage: typeof ethereumSignMessage;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/ethereumSignTransaction.md
    ethereumSignTransaction: typeof ethereumSignTransaction;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/ethereumSignTypedData.md
    ethereumSignTypedData: typeof ethereumSignTypedData;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/ethereumVerifyMessage.md
    ethereumVerifyMessage: typeof ethereumVerifyMessage;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/firmwareUpdate.md
    firmwareUpdate: typeof firmwareUpdate;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/getAccountInfo.md
    getAccountInfo: typeof getAccountInfo;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/getAddress.md
    getAddress: typeof getAddress;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/getCoinInfo.md
    getCoinInfo: typeof getCoinInfo;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/getDeviceState.md
    getDeviceState: typeof getDeviceState;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/getFeatures.md
    getFeatures: typeof getFeatures;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/getPublicKey.md
    getPublicKey: typeof getPublicKey;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/getSettings.md
    getSettings: typeof getSettings;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/init.md
    init: typeof init;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/manifest.md
    manifest: typeof manifest;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/nemGetAddress.md
    nemGetAddress: typeof nemGetAddress;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/nemSignTransaction.md
    nemSignTransaction: typeof nemSignTransaction;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/off.md
    off: typeof off;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/on.md
    on: typeof on;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/pushTransaction.md
    pushTransaction: typeof pushTransaction;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/rebootToBootloader.md
    rebootToBootloader: typeof rebootToBootloader;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/recoveryDevice.md
    recoveryDevice: typeof recoveryDevice;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/removeAllListeners.md
    removeAllListeners: typeof removeAllListeners;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/renderWebUSBButton.md
    renderWebUSBButton: typeof renderWebUSBButton;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/requestLogin.md
    requestLogin: typeof requestLogin;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/resetDevice.md
    resetDevice: typeof resetDevice;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/rippleGetAddress.md
    rippleGetAddress: typeof rippleGetAddress;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/rippleSignTransaction.md
    rippleSignTransaction: typeof rippleSignTransaction;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/setProxy.md
    setProxy: typeof setProxy;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/signMessage.md
    signMessage: typeof signMessage;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/signTransaction.md
    signTransaction: typeof signTransaction;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/stellarGetAddress.md
    stellarGetAddress: typeof stellarGetAddress;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/stellarSignTransaction.md
    stellarSignTransaction: typeof stellarSignTransaction;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/tezosGetAddress.md
    tezosGetAddress: typeof tezosGetAddress;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/tezosGetPublicKey.md
    tezosGetPublicKey: typeof tezosGetPublicKey;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/tezosSignTransaction.md
    tezosSignTransaction: typeof tezosSignTransaction;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/uiResponse.md
    uiResponse: typeof uiResponse;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/verifyMessage.md
    verifyMessage: typeof verifyMessage;

    // https://github.com/trezor/trezor-suite/tree/develop/packages/connect-core/docs/methods/wipeDevice.md
    wipeDevice: typeof wipeDevice;
}
