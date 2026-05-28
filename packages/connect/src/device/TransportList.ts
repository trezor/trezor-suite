import { ERRORS } from '@trezor/connect-common/src/constants';
import type {
    ConnectSettingsTransport,
    TransportClass,
} from '@trezor/connect-common/src/types/settings';
import {
    type AbstractTransportParams,
    type Transport,
    isTransportInstance,
} from '@trezor/transport-common';

type Params = AbstractTransportParams & { sessionsBackgroundUrl?: string | null };

const isTransportClass = (arg: ConnectSettingsTransport): arg is TransportClass =>
    typeof arg === 'function';

// TODO(reconfigure): dedupe-by-name silently ignores a same-name candidate
// with different construction params (e.g. BridgeTransport on a different
// port supplied via updateConnectSettings). Pre-existing behavior, not part
// of this DI refactor — keep until reconfiguration semantics are designed.
const reuseOrUse = (existing: Transport[], candidate: Transport): Transport =>
    existing.find(t => t.name === candidate.name) ?? candidate;

const resolveOne = (
    existing: Transport[],
    arg: ConnectSettingsTransport,
    params: Params,
): Transport => {
    if (typeof arg === 'object' && arg !== null) {
        if (!isTransportInstance(arg)) {
            throw ERRORS.TypedError(
                'Runtime',
                `init({ transports }) entry is not a valid Transport instance`,
            );
        }

        return reuseOrUse(existing, arg);
    }
    if (isTransportClass(arg)) {
        let instance: Transport;
        try {
            instance = new arg(params);
        } catch (e) {
            // Arrow / non-constructable functions raise a native TypeError with
            // an "is not a constructor" message on `new` (consistent across
            // V8/SpiderMonkey/JSC). Convert only THAT to the controlled Runtime
            // error so JS callers (non-TS, `any`-typed) get a uniform diagnostic.
            // A TypeError thrown from inside a valid constructor is a real bug
            // and must propagate with its original message intact.
            if (e instanceof TypeError && /is not a constructor/i.test(e.message)) {
                throw ERRORS.TypedError(
                    'Runtime',
                    `Provided value is not a constructable Transport class`,
                );
            }
            throw e;
        }
        if (!isTransportInstance(instance)) {
            throw ERRORS.TypedError(
                'Runtime',
                `Provided class did not produce a valid Transport instance`,
            );
        }

        return reuseOrUse(existing, instance);
    }

    throw ERRORS.TypedError(
        'Runtime',
        `init({ transports }) entry is not a Transport instance or class`,
    );
};

export const createTransportList =
    (params: Params) =>
    (existing: Transport[], transports?: ConnectSettingsTransport[]): Transport[] => {
        // Thin wrappers (connect-web, connect-webextension, connect-mobile) propagate
        // host-supplied settings as-is and never inject a default; the Suite app is
        // expected to provide its own transports list. Returning an empty array here
        // is intentional — no transports means no devices, but it must not crash.
        if (!transports?.length) return [];

        return transports.map(transport => resolveOne(existing, transport, params));
    };
