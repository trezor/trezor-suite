import { UI_REQUEST } from './events';
import type { CallMethod, CallMethodKeys } from './events/call';
import type { TrezorConnect } from './types';
import type { InitType } from './types/api/init';
import type { ConnectEmitter } from './types/emitter';

export interface ConnectFactoryDependencies<SettingsType extends Record<string, any>> {
    init: InitType<SettingsType>;
    call: CallMethod;
    eventEmitter: ConnectEmitter;
    updateConnectSettings: TrezorConnect['updateConnectSettings'];
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
    'showDeviceTutorial',
    'signMessage',
    'signTransaction',
    'solanaComposeTransaction',
    'solanaGetAddress',
    'solanaGetPublicKey',
    'solanaSignTransaction',
    'stellarGetAddress',
    'stellarSignTransaction',
    'telemetryGet',
    'tezosGetAddress',
    'tezosGetPublicKey',
    'tezosSignTransaction',
    'thpGetCredentials',
    'thpRemoveCredentials',
    'tronGetAddress',
    'tronSignTransaction',
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
        init,
        call,
        updateConnectSettings,
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
                        ? eventEmitter.listenerCount(UI_REQUEST.ADDRESS_VALIDATION) > 0
                        : undefined,
                }),
        ]),
    ) as Pick<TrezorConnect, (typeof connectCallableMethods)[number]>;

    return {
        init,
        updateConnectSettings,

        on: eventEmitter.on.bind(eventEmitter),

        off: eventEmitter.removeListener.bind(eventEmitter),

        removeAllListeners: eventEmitter.removeAllListeners.bind(eventEmitter),

        uiResponse,

        call,

        dispose,

        cancel,

        ...callableMethods,

        ...extraMethods,
    };
};
