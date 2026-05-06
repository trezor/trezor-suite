import { connectCallableMethods } from './callableMethods';
import { UI_REQUEST } from './events';
import type { CallMethod } from './events/call';
import { type Manifest, type TrezorConnect } from './types';
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
    // Some host environments (notably the suite-desktop renderer's IPC proxy)
    // expose a partial EventEmitter without `listenerCount`. Treat the
    // missing method as "nobody is listening" — same default the non-getaddress
    // path uses — instead of throwing on every getAddress call.
    const hasListenerForAddressValidation = () =>
        typeof eventEmitter.listenerCount === 'function' &&
        eventEmitter.listenerCount(UI_REQUEST.ADDRESS_VALIDATION) > 0;

    const callableMethods = Object.fromEntries(
        connectCallableMethods.map(method => [
            method,
            (params: any) =>
                call({
                    ...params,
                    method,
                    useEventListener: method.toLowerCase().endsWith('getaddress')
                        ? hasListenerForAddressValidation()
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
