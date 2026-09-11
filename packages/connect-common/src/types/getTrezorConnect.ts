import type { TrezorConnectCallable, TrezorConnectPrivilegedAPI } from './api';

/**
 * Reads Connect at call time because legacy initialization replaces its methods.
 * The generic limits each consumer to the Connect methods it actually requires.
 */
export type GetTrezorConnect<TMethod extends keyof TrezorConnectCallable> = () => Pick<
    TrezorConnectCallable,
    TMethod
>;

export type GetTrezorConnectDep<TMethod extends keyof TrezorConnectCallable> = {
    getTrezorConnect: GetTrezorConnect<TMethod>;
};

export type GetTrezorConnectPrivileged = () => TrezorConnectPrivilegedAPI;

export type GetTrezorConnectPrivilegedDep = {
    getTrezorConnect: GetTrezorConnectPrivileged;
};
