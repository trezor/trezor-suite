import { connectCallableMethods, connectPublicCallableMethods } from './callableMethods';
import type {
    ConnectSettings,
    TrezorConnectCore,
    TrezorConnectPrivilegedAPI,
    TrezorConnectPublicAPI,
} from './types';
import type { TrezorConnectInternal } from './types/api/internal';

type ExtendedPublicAPI<C> =
    C extends TrezorConnectCore<infer S>
        ? TrezorConnectPublicAPI<S> & Omit<C, keyof TrezorConnectPublicAPI<S>>
        : never;

export const factoryPublic = <C extends TrezorConnectCore<any>>(core: C): ExtendedPublicAPI<C> => {
    for (const method of connectPublicCallableMethods) {
        (core as any)[method] = (params: any) => core.call({ ...params, method });
    }

    return core as unknown as ExtendedPublicAPI<C>;
};

type ExtendedPrivilegedAPI<C> = TrezorConnectPrivilegedAPI &
    Omit<C, keyof TrezorConnectPrivilegedAPI>;

export const factoryPrivileged = <
    C extends TrezorConnectCore<ConnectSettings> & TrezorConnectInternal,
>(
    core: C,
): ExtendedPrivilegedAPI<C> => {
    for (const method of connectCallableMethods) {
        (core as any)[method] = (params: any) => core.call({ ...params, method });
    }

    return core as ExtendedPrivilegedAPI<C>;
};
