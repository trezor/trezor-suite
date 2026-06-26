import { connectCallableMethods } from './callableMethods';
import type { CallMethod } from './events/call';
import { type Manifest, type TrezorConnect, type TrezorConnectCore } from './types';
import { type TrezorConnectInternal } from './types/api/internal';

export interface ConnectFactoryDependencies<SettingsType extends Record<string, any>>
    extends TrezorConnectInternal, TrezorConnectCore {
    init: (settings: { manifest: Manifest } & SettingsType) => Promise<void>;
    call: CallMethod;
}

export const factory = <
    SettingsType extends Record<string, any>,
    ExtraMethodsType extends Record<string, any>,
>(
    {
        on,
        off,
        removeAllListeners,
        init,
        call,
        updateConnectSettings,
        uiResponse,
        cancel,
        dispose,
    }: ConnectFactoryDependencies<SettingsType>,
    extraMethods: ExtraMethodsType = {} as ExtraMethodsType,
): TrezorConnect & ConnectFactoryDependencies<SettingsType> & ExtraMethodsType => {
    const callableMethods = Object.fromEntries(
        connectCallableMethods.map(method => [
            method,
            (params: any) => call({ ...params, method }),
        ]),
    ) as Pick<TrezorConnect, (typeof connectCallableMethods)[number]>;

    return {
        init,
        updateConnectSettings,

        on,

        off,

        removeAllListeners,

        uiResponse,

        call,

        dispose,

        cancel,

        ...callableMethods,

        ...extraMethods,
    };
};
