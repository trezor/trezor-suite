import { UI_REQUEST } from './events/ui-request';
import { ConnectEmitter } from './types/emitter';
import type { Manifest } from './types/manifest';

export type ConnectImplSettings = {
    manifest: Manifest;
    version: string;
    env?: 'node' | 'web' | 'webextension' | 'electron' | 'react-native';
    debug?: boolean;
};

export type ConnectImpl = {
    init: (params: ConnectImplSettings) => Promise<void>;
    call: (params: any) => Promise<any>;
    cancel: (error?: string) => void;
    dispose: () => Promise<undefined>;
};

export type InitType<SettingsType extends Record<string, any>> = (
    settings: { manifest: Manifest } & SettingsType,
) => Promise<void>;

export interface ConnectFactoryDependencies<SettingsType extends Record<string, any>> {
    init: InitType<SettingsType>;
    call: (params: any) => Promise<any>;
    eventEmitter: ConnectEmitter;
    updateConnectSettings: (params: any) => Promise<any>;
    uiResponse: (params: any) => void;
    cancel: (error?: string) => void;
    dispose: () => Promise<any>;
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
    callableMethods: string[] = [],
) => {
    const methods = Object.fromEntries(
        callableMethods.map(method => [
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
    );

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

        ...methods,

        ...extraMethods,
    } as any;
};
