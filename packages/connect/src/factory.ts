import { Type } from '@trezor/schema-utils';

import { UI_REQUEST } from './events';
import type { CallMethod, CallMethodKeys, CallMethodPayload } from './events/call';
import {
    CancelablePromise,
    type Manifest,
    type TrezorConnect,
    TrezorConnectAccount,
    TrezorConnectBitcoin,
    TrezorConnectBlockchain,
    TrezorConnectCardano,
    TrezorConnectDevice,
    TrezorConnectEthereum,
    TrezorConnectEvolu,
    TrezorConnectMonero,
    TrezorConnectRipple,
    TrezorConnectSolana,
    TrezorConnectStellar,
    TrezorConnectTezos,
    TrezorConnectTron,
} from './types';
import type { ConnectEmitter } from './types/emitter';

export type InitType<SettingsType extends Record<string, any>> = (
    settings: { manifest: Manifest } & SettingsType,
) => Promise<void>;

export interface ConnectFactoryDependencies<SettingsType extends Record<string, any>> {
    init: InitType<SettingsType>;
    call: CallMethod;
    eventEmitter: ConnectEmitter;
    updateConnectSettings: TrezorConnect['updateConnectSettings'];
    uiResponse: TrezorConnect['uiResponse'];
    cancel: TrezorConnect['cancel'];
    dispose: TrezorConnect['dispose'];
}

const connectCallables = Type.Composite([
    // Not including `TrezorConnectManagement` as callable methods.
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

export const connectCallableMethods = Object.keys(connectCallables.properties) as CallMethodKeys[];

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
): TrezorConnect & {
    init: InitType<SettingsType>;
    call: CallMethod;
} & ExtraMethodsType => {
    const wrappedCall = (params: CallMethodPayload) => {
        const { method } = params;
        const useEventListener = method?.toLowerCase()?.endsWith('getaddress')
            ? eventEmitter.listenerCount(UI_REQUEST.ADDRESS_VALIDATION) > 0
            : undefined;

        const result = call({
            ...params,
            useEventListener,
        }) as CancelablePromise<any>;
        result.cancel = (reason?: string) => cancel(reason);
        result.setAbortSignal = (signal: AbortSignal) => {
            const handleAbort = () => {
                cancel(signal.reason.toString());
            };
            signal.addEventListener('abort', handleAbort);

            return () => signal.removeEventListener('abort', handleAbort);
        };

        return result;
    };

    const callableMethods = Object.fromEntries(
        connectCallableMethods.map(method => [
            method,
            (params: any) =>
                wrappedCall({
                    ...params,
                    method,
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

        call: wrappedCall,

        dispose,

        cancel,

        ...callableMethods,

        ...extraMethods,
    };
};
