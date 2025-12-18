import type { EventEmitter } from 'events';

import { UI } from './events';
import type { CallMethod, CallMethodKeys } from './events/call';
import type { TrezorConnect } from './types';
import type { InitType } from './types/api/init';

export interface ConnectFactoryDependencies<SettingsType extends Record<string, any>> {
    init: InitType<SettingsType>;
    call: CallMethod;
    eventEmitter: EventEmitter;
    manifest: TrezorConnect['manifest'];
    setTransports: TrezorConnect['setTransports'];
    uiResponse: TrezorConnect['uiResponse'];
    cancel: TrezorConnect['cancel'];
    dispose: TrezorConnect['dispose'];
}

export const connectCallableMethods = [
    'applyFlags',
    'applySettings',
    'authenticateDevice',
    'authorizeCoinjoin',
    'backupDevice',
    'bleUnpair',
    'blockchainDisconnect',
    'blockchainEstimateFee',
    'blockchainEvmRpcCall',
    'blockchainGetAccountBalanceHistory',
    'blockchainGetCurrentFiatRates',
    'blockchainGetFiatRatesForTimestamps',
    'blockchainGetInfo',
    'blockchainGetTransactions',
    'blockchainSetCustomBackend',
    'blockchainSubscribe',
    'blockchainSubscribeFiatRates',
    'blockchainUnsubscribe',
    'blockchainUnsubscribeFiatRates',
    'blockchainValidateEvmRpcUrl',
    'cancelCoinjoinAuthorization',
    'cardanoComposeTransaction',
    'cardanoGetAddress',
    'cardanoGetNativeScriptHash',
    'cardanoGetPublicKey',
    'cardanoSignMessage',
    'cardanoSignTransaction',
    'changeLanguage',
    'changePin',
    'changeWipeCode',
    'cipherKeyValue',
    'composeTransaction',
    'discoverAccounts',
    'eosGetPublicKey',
    'eosSignTransaction',
    'ethereumGetAddress',
    'ethereumGetPublicKey',
    'ethereumSignMessage',
    'ethereumSignTransaction',
    'ethereumSignTypedData',
    'ethereumVerifyMessage',
    'evoluGetDelegatedIdentityKey',
    'evoluGetNode',
    'evoluSignRegistrationRequest',
    'firmwareUpdate',
    'getAccountDescriptor',
    'getAccountInfo',
    'getAddress',
    'getCoinInfo',
    'getDeviceState',
    'getFeatures',
    'getFirmwareHash',
    'getNonce',
    'getOwnershipId',
    'getOwnershipProof',
    'getPublicKey',
    'getSettings',
    'loadDevice',
    'moneroGetAddress',
    'moneroGetWatchKey',
    'moneroKeyImageSync',
    'moneroSignTransaction',
    'pushTransaction',
    'recoveryDevice',
    'requestLogin',
    'resetDevice',
    'rippleGetAddress',
    'rippleSignTransaction',
    'setBrightness',
    'setBusy',
    'setProxy',
    'showDeviceTutorial',
    'signMessage',
    'signTransaction',
    'solanaComposeTransaction',
    'solanaGetAddress',
    'solanaGetPublicKey',
    'solanaSignTransaction',
    'stellarGetAddress',
    'stellarSignTransaction',
    'tezosGetAddress',
    'tezosGetPublicKey',
    'tezosSignTransaction',
    'thpGetCredentials',
    'thpRemoveCredentials',
    'unlockPath',
    'verifyMessage',
    'wipeDevice',
] as const satisfies readonly CallMethodKeys[];

export const factory = <
    SettingsType extends Record<string, any>,
    ExtraMethodsType extends Record<string, any>,
>(
    {
        eventEmitter,
        manifest,
        init,
        call,
        setTransports,
        uiResponse,
        cancel,
        dispose,
    }: ConnectFactoryDependencies<SettingsType>,
    extraMethods: ExtraMethodsType = {} as ExtraMethodsType,
): Omit<TrezorConnect, 'init'> & {
    init: InitType<SettingsType>;
    call: CallMethod;
} & ExtraMethodsType => {
    const callableMethods = Object.fromEntries(
        connectCallableMethods.map(method => [
            method,
            (params: any) =>
                call({
                    ...params,
                    method,
                    useEventListener: method.toLowerCase().endsWith('getaddress')
                        ? eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0
                        : undefined,
                }),
        ]),
    ) as Pick<TrezorConnect, (typeof connectCallableMethods)[number]>;

    return {
        manifest,
        init,
        setTransports,

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

        call,

        dispose,

        cancel,

        ...callableMethods,

        ...extraMethods,
    };
};
