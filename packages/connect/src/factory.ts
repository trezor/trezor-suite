import { UI } from './events';
import type { EventEmitter } from 'events';
import type { TrezorConnect } from './types';
import type { Call } from './events/call';

interface Dependencies {
    call: Call;
    eventEmitter: EventEmitter;
    manifest: TrezorConnect['manifest'];
    init: TrezorConnect['init'];
    getSettings: TrezorConnect['getSettings'];
    customMessage: TrezorConnect['customMessage'];
    requestLogin: TrezorConnect['requestLogin'];
    uiResponse: TrezorConnect['uiResponse'];
    renderWebUSBButton: TrezorConnect['renderWebUSBButton'];
    disableWebUSB: TrezorConnect['disableWebUSB'];
    cancel: TrezorConnect['cancel'];
    dispose: TrezorConnect['dispose'];
}

export const factory = ({
    eventEmitter,
    manifest,
    init,
    call,
    getSettings,
    customMessage,
    requestLogin,
    uiResponse,
    renderWebUSBButton,
    disableWebUSB,
    cancel,
    dispose,
}: Dependencies): TrezorConnect => {
    const api: TrezorConnect = {
        manifest,
        init,
        getSettings,

        on: <T extends string, P extends (...args: any[]) => any>(type: T, fn: P) => {
            eventEmitter.on(type, fn);
        },

        off: (type, fn) => {
            eventEmitter.removeListener(type, fn);
        },

        removeAllListeners: type => {
            eventEmitter.removeAllListeners(type);
        },

        uiResponse,

        // methods

        blockchainGetAccountBalanceHistory: params =>
            call({ method: 'blockchainGetAccountBalanceHistory', ...params }),

        blockchainGetCurrentFiatRates: params =>
            call({ method: 'blockchainGetCurrentFiatRates', ...params }),

        blockchainGetFiatRatesForTimestamps: params =>
            call({ method: 'blockchainGetFiatRatesForTimestamps', ...params }),

        blockchainDisconnect: params => call({ method: 'blockchainDisconnect', ...params }),

        blockchainEstimateFee: params => call({ method: 'blockchainEstimateFee', ...params }),

        blockchainGetTransactions: params =>
            call({ method: 'blockchainGetTransactions', ...params }),

        blockchainSetCustomBackend: params =>
            call({ method: 'blockchainSetCustomBackend', ...params }),

        blockchainSubscribe: params => call({ method: 'blockchainSubscribe', ...params }),

        blockchainSubscribeFiatRates: params =>
            call({ method: 'blockchainSubscribeFiatRates', ...params }),

        blockchainUnsubscribe: params => call({ method: 'blockchainUnsubscribe', ...params }),

        blockchainUnsubscribeFiatRates: params =>
            call({ method: 'blockchainUnsubscribeFiatRates', ...params }),

        customMessage: params => customMessage(params),

        requestLogin: params => requestLogin(params),

        cardanoGetAddress: params => {
            const useEventListener = eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
            return call({ method: 'cardanoGetAddress', ...params, useEventListener });
        },

        cardanoGetNativeScriptHash: params =>
            call({ method: 'cardanoGetNativeScriptHash', ...params }),

        cardanoGetPublicKey: params => call({ method: 'cardanoGetPublicKey', ...params }),

        cardanoSignTransaction: params => call({ method: 'cardanoSignTransaction', ...params }),

        cipherKeyValue: params => call({ method: 'cipherKeyValue', ...params }),

        composeTransaction: params => call({ method: 'composeTransaction', ...params }),

        ethereumGetAddress: params => {
            const useEventListener = eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
            return call({ method: 'ethereumGetAddress', ...params, useEventListener });
        },

        ethereumGetPublicKey: params => call({ method: 'ethereumGetPublicKey', ...params }),

        ethereumSignMessage: params => call({ method: 'ethereumSignMessage', ...params }),

        ethereumSignTransaction: params => call({ method: 'ethereumSignTransaction', ...params }),

        // @ts-ignore REF-TODO
        ethereumSignTypedData: params => call({ method: 'ethereumSignTypedData', ...params }),

        ethereumVerifyMessage: params => call({ method: 'ethereumVerifyMessage', ...params }),

        getAccountInfo: params => call({ method: 'getAccountInfo', ...params }),

        getAddress: params => {
            const useEventListener = eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
            return call({ method: 'getAddress', ...params, useEventListener });
        },

        getDeviceState: params => call({ method: 'getDeviceState', ...params }),

        getFeatures: params => call({ method: 'getFeatures', ...params }),

        getPublicKey: params => call({ method: 'getPublicKey', ...params }),

        nemGetAddress: params => {
            const useEventListener = eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
            return call({ method: 'nemGetAddress', ...params, useEventListener });
        },

        nemSignTransaction: params => call({ method: 'nemSignTransaction', ...params }),

        pushTransaction: params => call({ method: 'pushTransaction', ...params }),

        rippleGetAddress: params => {
            const useEventListener = eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
            return call({ method: 'rippleGetAddress', ...params, useEventListener });
        },

        rippleSignTransaction: params => call({ method: 'rippleSignTransaction', ...params }),

        signMessage: params => call({ method: 'signMessage', ...params }),

        signTransaction: params => call({ method: 'signTransaction', ...params }),

        stellarGetAddress: params => {
            const useEventListener = eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
            return call({ method: 'stellarGetAddress', ...params, useEventListener });
        },

        stellarSignTransaction: params => call({ method: 'stellarSignTransaction', ...params }),

        tezosGetAddress: params => {
            const useEventListener = eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
            return call({ method: 'tezosGetAddress', ...params, useEventListener });
        },

        tezosGetPublicKey: params => call({ method: 'tezosGetPublicKey', ...params }),

        tezosSignTransaction: params => call({ method: 'tezosSignTransaction', ...params }),

        eosGetPublicKey: params => call({ method: 'eosGetPublicKey', ...params }),

        eosSignTransaction: params => call({ method: 'eosSignTransaction', ...params }),

        binanceGetAddress: params => {
            const useEventListener = eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
            return call({ method: 'binanceGetAddress', ...params, useEventListener });
        },

        binanceGetPublicKey: params => call({ method: 'binanceGetPublicKey', ...params }),

        binanceSignTransaction: params => call({ method: 'binanceSignTransaction', ...params }),

        verifyMessage: params => call({ method: 'verifyMessage', ...params }),

        resetDevice: params => call({ method: 'resetDevice', ...params }),

        wipeDevice: params => call({ method: 'wipeDevice', ...params }),

        applyFlags: params => call({ method: 'applyFlags', ...params }),

        applySettings: params => call({ method: 'applySettings', ...params }),

        backupDevice: params => call({ method: 'backupDevice', ...params }),

        changePin: params => call({ method: 'changePin', ...params }),

        firmwareUpdate: params => call({ method: 'firmwareUpdate', ...params }),

        recoveryDevice: params => call({ method: 'recoveryDevice', ...params }),

        getCoinInfo: params => call({ method: 'getCoinInfo', ...params }),

        rebootToBootloader: params => call({ method: 'rebootToBootloader', ...params }),

        setProxy: params => call({ method: 'setProxy', ...params }),

        dispose,

        cancel,

        renderWebUSBButton,

        disableWebUSB,
    };
    return api;
};
