import { connectCallableMethods } from './callableMethods';
import type { CallMethod } from './events/call';
import {
    type Manifest,
    type TrezorConnect,
    type TrezorConnectCallable,
    type TrezorConnectCore,
} from './types';

export interface ConnectFactoryDependencies<
    SettingsType extends Record<string, any>,
> extends TrezorConnectCore {
    init: (settings: { manifest: Manifest } & SettingsType) => Promise<void>;
    call: CallMethod;
}

export const factory = <
    SettingsType extends Record<string, any>,
    ExtraMethodsType extends Record<string, any>,
    CoreType extends ConnectFactoryDependencies<SettingsType>,
>(
    core: CoreType,
    extraMethods: ExtraMethodsType = {} as ExtraMethodsType,
): TrezorConnectCallable & CoreType & ExtraMethodsType => {
    const callableMethods = Object.fromEntries(
        connectCallableMethods.map(method => [
            method,
            (params: any) => core.call({ ...params, method }),
        ]),
    ) as Pick<TrezorConnect, (typeof connectCallableMethods)[number]>;

    return {
        ...core,

        ...callableMethods,

        ...extraMethods,
    };
};
