import { UI } from './events';
import type { EventEmitter } from 'events';
import type { TrezorConnect } from './types';
import type { CallMethod } from './events/call';

export interface ConnectFactoryDependencies {
    call: CallMethod;
    eventEmitter: EventEmitter;
    manifest: TrezorConnect['manifest'];
    init: TrezorConnect['init'];
    requestLogin: TrezorConnect['requestLogin'];
    uiResponse: TrezorConnect['uiResponse'];
    renderWebUSBButton: TrezorConnect['renderWebUSBButton'];
    disableWebUSB: TrezorConnect['disableWebUSB'];
    requestWebUSBDevice: TrezorConnect['requestWebUSBDevice'];
    cancel: TrezorConnect['cancel'];
    dispose: TrezorConnect['dispose'];
}

export const factory = ({
    eventEmitter,
    manifest,
    init,
    call,
    requestLogin,
    uiResponse,
    renderWebUSBButton,
    disableWebUSB,
    requestWebUSBDevice,
    cancel,
    dispose,
}: ConnectFactoryDependencies): TrezorConnect => {
    const api: TrezorConnect = {
        manifest,
        init,
        getSettings: () => call({ method: 'getSettings' }),

        on: <T extends string, P extends (...args: any[]) => any>(type: T, fn: P) => {
            eventEmitter.on(type, fn);
        },

        off: (type, fn) => {
            eventEmitter.removeListener(type, fn);
        },

        removeAllListeners: type => {
            if (typeof type === 'string') {
                eventEmitter.removeAllListeners(type);
            } else {
                eventEmitter.removeAllListeners();
            }
        },

        uiResponse,

        // methods

        blockchainGetAccountBalanceHistory: params =>
            call({ ...params, method: 'blockchainGetAccountBalanceHistory' }),

        blockchainGetCurrentFiatRates: params =>
            call({ ...params, method: 'blockchainGetCurrentFiatRates' }),

        blockchainEvmRpcCall: params => call({ ...params, method: 'blockchainEvmRpcCall' }),

        blockchainGetFiatRatesForTimestamps: params =>
            call({ ...params, method: 'blockchainGetFiatRatesForTimestamps' }),

        blockchainDisconnect: params => call({ ...params, method: 'blockchainDisconnect' }),

        blockchainEstimateFee: params => call({ ...params, method: 'blockchainEstimateFee' }),

        blockchainGetTransactions: params =>
            call({ ...params, method: 'blockchainGetTransactions' }),

        blockchainSetCustomBackend: params =>
            call({ ...params, method: 'blockchainSetCustomBackend' }),

        blockchainSubscribe: params => call({ ...params, method: 'blockchainSubscribe' }),

        blockchainSubscribeFiatRates: params =>
            call({ ...params, method: 'blockchainSubscribeFiatRates' }),

        blockchainUnsubscribe: params => call({ ...params, method: 'blockchainUnsubscribe' }),

        blockchainUnsubscribeFiatRates: params =>
            call({ ...params, method: 'blockchainUnsubscribeFiatRates' }),

        requestLogin: params => requestLogin(params),

        cardanoGetAddress: params =>
            call({
                ...params,
                method: 'cardanoGetAddress',
                useEventListener: eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0,
            }),

        cardanoGetNativeScriptHash: params =>
            call({ ...params, method: 'cardanoGetNativeScriptHash' }),

        cardanoGetPublicKey: params => call({ ...params, method: 'cardanoGetPublicKey' }),

        cardanoSignTransaction: params => call({ ...params, method: 'cardanoSignTransaction' }),

        cardanoComposeTransaction: params =>
            call({ ...params, method: 'cardanoComposeTransaction' }),

        cipherKeyValue: params => call({ ...params, method: 'cipherKeyValue' }),

        composeTransaction: params => call({ ...params, method: 'composeTransaction' }),

        ethereumGetAddress: params =>
            call({
                ...params,
                method: 'ethereumGetAddress',
                useEventListener: eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0,
            }),

        ethereumGetPublicKey: params => call({ ...params, method: 'ethereumGetPublicKey' }),

        ethereumSignMessage: params => call({ ...params, method: 'ethereumSignMessage' }),

        ethereumSignTransaction: params => call({ ...params, method: 'ethereumSignTransaction' }),

        // @ts-expect-error generic param
        ethereumSignTypedData: params => call({ ...params, method: 'ethereumSignTypedData' }),

        ethereumVerifyMessage: params => call({ ...params, method: 'ethereumVerifyMessage' }),

        getAccountDescriptor: params => call({ ...params, method: 'getAccountDescriptor' }),

        getAccountInfo: params => call({ ...params, method: 'getAccountInfo' }),

        getAddress: params =>
            call({
                ...params,
                method: 'getAddress',
                useEventListener: eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0,
            }),

        getDeviceState: params => call({ ...params, method: 'getDeviceState' }),

        getFeatures: params => call({ ...params, method: 'getFeatures' }),

        getFirmwareHash: params => call({ ...params, method: 'getFirmwareHash' }),

        getOwnershipId: params => call({ ...params, method: 'getOwnershipId' }),

        getOwnershipProof: params => call({ ...params, method: 'getOwnershipProof' }),

        getPublicKey: params => call({ ...params, method: 'getPublicKey' }),

        nemGetAddress: params =>
            call({
                ...params,
                method: 'nemGetAddress',
                useEventListener: eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0,
            }),

        nemSignTransaction: params => call({ ...params, method: 'nemSignTransaction' }),

        pushTransaction: params => call({ ...params, method: 'pushTransaction' }),

        rippleGetAddress: params =>
            call({
                ...params,
                method: 'rippleGetAddress',
                useEventListener: eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0,
            }),

        rippleSignTransaction: params => call({ ...params, method: 'rippleSignTransaction' }),

        signMessage: params => call({ ...params, method: 'signMessage' }),

        signTransaction: params => call({ ...params, method: 'signTransaction' }),

        solanaGetPublicKey: params => call({ ...params, method: 'solanaGetPublicKey' }),

        solanaGetAddress: params => call({ ...params, method: 'solanaGetAddress' }),

        solanaSignTransaction: params => call({ ...params, method: 'solanaSignTransaction' }),

        stellarGetAddress: params =>
            call({
                ...params,
                method: 'stellarGetAddress',
                useEventListener: eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0,
            }),

        stellarSignTransaction: params => call({ ...params, method: 'stellarSignTransaction' }),

        tezosGetAddress: params =>
            call({
                ...params,
                method: 'tezosGetAddress',
                useEventListener: eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0,
            }),

        tezosGetPublicKey: params => call({ ...params, method: 'tezosGetPublicKey' }),

        tezosSignTransaction: params => call({ ...params, method: 'tezosSignTransaction' }),

        unlockPath: params => call({ ...params, method: 'unlockPath' }),

        eosGetPublicKey: params => call({ ...params, method: 'eosGetPublicKey' }),

        eosSignTransaction: params => call({ ...params, method: 'eosSignTransaction' }),

        binanceGetAddress: params =>
            call({
                ...params,
                method: 'binanceGetAddress',
                useEventListener: eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0,
            }),

        binanceGetPublicKey: params => call({ ...params, method: 'binanceGetPublicKey' }),

        binanceSignTransaction: params => call({ ...params, method: 'binanceSignTransaction' }),

        verifyMessage: params => call({ ...params, method: 'verifyMessage' }),

        resetDevice: params => call({ ...params, method: 'resetDevice' }),

        wipeDevice: params => call({ ...params, method: 'wipeDevice' }),

        applyFlags: params => call({ ...params, method: 'applyFlags' }),

        applySettings: params => call({ ...params, method: 'applySettings' }),

        authenticateDevice: params => call({ ...params, method: 'authenticateDevice' }),

        authorizeCoinjoin: params => call({ ...params, method: 'authorizeCoinjoin' }),

        cancelCoinjoinAuthorization: params =>
            call({ ...params, method: 'cancelCoinjoinAuthorization' }),

        showDeviceTutorial: params => call({ ...params, method: 'showDeviceTutorial' }),

        backupDevice: params => call({ ...params, method: 'backupDevice' }),

        changeLanguage: params => call({ ...params, method: 'changeLanguage' }),

        changePin: params => call({ ...params, method: 'changePin' }),

        changeWipeCode: params => call({ ...params, method: 'changeWipeCode' }),

        firmwareUpdate: params => call({ ...params, method: 'firmwareUpdate' }),

        recoveryDevice: params => call({ ...params, method: 'recoveryDevice' }),

        getCoinInfo: params => call({ ...params, method: 'getCoinInfo' }),

        rebootToBootloader: params => call({ ...params, method: 'rebootToBootloader' }),

        setBrightness: params => call({ ...params, method: 'setBrightness' }),

        setBusy: params => call({ ...params, method: 'setBusy' }),

        setProxy: params => call({ ...params, method: 'setProxy' }),

        dispose,

        cancel,

        renderWebUSBButton,

        disableWebUSB,

        requestWebUSBDevice,
    };

    return api;
};
