import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, RequiredDeviceIdentity, Response } from '../params';
import type { TrezorConnectCallable } from './callable';
import type {
    EthereumSignTypedData,
    EthereumSignTypedDataTypes,
    EthereumSignTypedHash,
} from './ethereum/common';

/**
 * Methods that keep `device` optional even on the privileged tier.
 *
 * - `thpRemoveCredentials`: the presence or absence of `device` *is* the switch between removing
 *   credentials on the device and removing them from the host only, so neither is the default.
 * - `getAccountInfo`: the `descriptor` form needs no device at all while the `path` form does; the
 *   split belongs to its own overloads rather than here.
 */
type DeviceOptionalMethod = 'thpRemoveCredentials' | 'getAccountInfo';

/**
 * Intersects the device requirement into a single parameter object, but only for methods that know
 * about `device` in the first place. Methods typed with the device-free common params (the ones
 * whose runtime sets `useDevice = false`) have no `device` key and are left untouched.
 */
type WithRequiredDevice<MethodParams> = 'device' extends keyof MethodParams
    ? MethodParams & { device: RequiredDeviceIdentity }
    : MethodParams;

/**
 * The declared parameters of an API method. For an overloaded method this resolves to the last
 * overload's parameter list, which is enough to tell "declares no parameters" from everything else.
 */
type MethodParameters<Method> = Method extends (...args: infer Args) => any ? Args : never;

/**
 * Rewrites one API method so its parameter object demands a usable `device`.
 *
 * Overloads have to be reproduced explicitly, the same way `OverloadedMethod` in `events/call.ts`
 * does: there is no way to map over `Parameters<Fn>` of an overloaded function. Two call signatures
 * are enough — no Connect method declares more. The result is an overloaded function type (an
 * object with two call signatures) rather than a union of function types, so a call still resolves
 * one overload instead of intersecting both.
 *
 * A parameter object that is declared optional (`wipeDevice`, `getFeatures`, …) becomes mandatory:
 * those methods do use a device, so there is no longer a valid way to call them with no arguments.
 */
type MethodWithRequiredDevice<Method> =
    MethodParameters<Method> extends []
        ? Method // nothing to require: `getSettings()` declares no parameters at all
        : Method extends { (params: infer P1): infer R1; (params: infer P2): infer R2 }
          ? { (params: WithRequiredDevice<P1>): R1; (params: WithRequiredDevice<P2>): R2 }
          : Method extends (...args: infer Args) => infer R
            ? (params: WithRequiredDevice<NonNullable<Args[0]>>) => R
            : Method;

/**
 * `ethereumSignTypedData` is the only generic method in the API, and inferring its overloads
 * through a conditional type instantiates `T` at its constraint — which drops the
 * `primaryType: keyof T` narrowing. Its strict signature is therefore spelled out; the type tests
 * exercise both overloads so a drift from the declared method shows up there.
 */
interface EthereumSignTypedDataWithRequiredDevice {
    <T extends EthereumSignTypedDataTypes>(
        params: Params<EthereumSignTypedData<T>> & { device: RequiredDeviceIdentity },
    ): Response<PROTO.EthereumTypedDataSignature>;
    <T extends EthereumSignTypedDataTypes>(
        params: Params<EthereumSignTypedHash<T>> & { device: RequiredDeviceIdentity },
    ): Response<PROTO.EthereumTypedDataSignature>;
}

/**
 * The callable Connect API with the device requirement applied: every method that talks to a device
 * requires a `device` that identifies one. The per-method signatures stay loose, so the public tier
 * (where the popup host, not the caller, picks the device) and `call()` are unaffected by this view.
 *
 * This is the shape `TrezorConnectPrivilegedAPI` adopts; it is kept separate until the in-repo
 * privileged call sites pass a device, so the switch-over is a reviewable step of its own.
 */
export type TrezorConnectCallableWithRequiredDevice = {
    [K in keyof TrezorConnectCallable]: K extends DeviceOptionalMethod
        ? TrezorConnectCallable[K]
        : K extends 'ethereumSignTypedData'
          ? EthereumSignTypedDataWithRequiredDevice
          : MethodWithRequiredDevice<TrezorConnectCallable[K]>;
};
