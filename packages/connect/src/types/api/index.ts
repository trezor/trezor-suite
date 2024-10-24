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
import { blockchainEvmRpcCall } from './blockchainEvmRpcCall';
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
import { renderWebUSBButton } from './renderWebUSBButton';
import { requestLogin } from './requestLogin';
import { requestWebUSBDevice } from './requestWebUSBDevice';
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

    // https://connect.trezor.io/9/methods/binance/binanceGetAddress/
    binanceGetAddress: typeof binanceGetAddress;

    // https://connect.trezor.io/9/methods/binance/binanceGetPublicKey/
    binanceGetPublicKey: typeof binanceGetPublicKey;

    // https://connect.trezor.io/9/methods/binance/binanceSignTransaction/
    binanceSignTransaction: typeof binanceSignTransaction;

    // todo: link docs
    blockchainDisconnect: typeof blockchainDisconnect;

    // todo: link docs
    blockchainEstimateFee: typeof blockchainEstimateFee;

    // todo: link docs
    blockchainGetAccountBalanceHistory: typeof blockchainGetAccountBalanceHistory;

    // todo: link docs
    blockchainGetCurrentFiatRates: typeof blockchainGetCurrentFiatRates;

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

    // todo: link docs
    cardanoComposeTransaction: typeof cardanoComposeTransaction;

    // https://connect.trezor.io/9/methods/device/changeLanguage/
    changeLanguage: typeof changeLanguage;

    // https://connect.trezor.io/9/methods/device/changePin/
    changePin: typeof changePin;

    // https://connect.trezor.io/9/methods/device/changeWipeCode/
    changeWipeCode: typeof changeWipeCode;

    // https://connect.trezor.io/9/methods/other/cipherKeyValue/
    cipherKeyValue: typeof cipherKeyValue;

    // https://connect.trezor.io/9/methods/bitcoin/composeTransaction/
    composeTransaction: typeof composeTransaction;

    // todo: link docs
    disableWebUSB: typeof disableWebUSB;

    // todo: link docs
    requestWebUSBDevice: typeof requestWebUSBDevice;

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
    getSettings: typeof getSettings;

    // https://connect.trezor.io/9/methods/other/init/
    init: typeof init;

    // https://connect.trezor.io/9/methods/other/manifest/
    manifest: typeof manifest;

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
    rebootToBootloader: typeof rebootToBootloader;

    // todo: link docs
    recoveryDevice: typeof recoveryDevice;

    // todo link docs
    removeAllListeners: typeof removeAllListeners;

    // todo link docs
    renderWebUSBButton: typeof renderWebUSBButton;

    // https://connect.trezor.io/9/methods/other/requestLogin/
    requestLogin: typeof requestLogin;

    // https://connect.trezor.io/9/methods/device/resetDevice/
    resetDevice: typeof resetDevice;

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

    // https://connect.trezor.io/9/methods/bitcoin/signMessage/
    signMessage: typeof signMessage;

    // https://connect.trezor.io/9/methods/bitcoin/signTransaction/
    signTransaction: typeof signTransaction;

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
