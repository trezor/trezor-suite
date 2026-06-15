import { ERRORS } from '@trezor/connect-common/src/constants';
import type { ConnectSettingsTransport } from '@trezor/connect-common/src/types/settings';
import { type Transport, isTransportInstance } from '@trezor/transport-common';

// TODO(reconfigure): dedupe-by-name silently ignores a same-name candidate
// with different construction params (e.g. BridgeTransport on a different
// port supplied via updateConnectSettings). Pre-existing behavior, not part
// of this DI refactor — keep until reconfiguration semantics are designed.
const reuseOrUse = (existing: Transport[], candidate: Transport): Transport =>
    existing.find(t => t.name === candidate.name) ?? candidate;

const resolveOne = (existing: Transport[], arg: ConnectSettingsTransport): Transport => {
    // Pure DI: every entry must already be a constructed Transport instance.
    // `arg` is typed as Transport, but JS callers (non-TS, `any`-typed) can still
    // pass a class, a string, or a plain object — reject all of those uniformly.
    if (!isTransportInstance(arg)) {
        throw ERRORS.TypedError(
            'Runtime',
            `init({ transports }) entry is not a valid Transport instance`,
        );
    }

    return reuseOrUse(existing, arg);
};

export const createTransportList = (
    existing: Transport[],
    transports?: ConnectSettingsTransport[],
): Transport[] => {
    // Thin wrappers (connect-web, connect-webextension, connect-mobile) propagate
    // host-supplied settings as-is and never inject a default; the Suite app is
    // expected to provide its own transports list. Returning an empty array here
    // is intentional — no transports means no devices, but it must not crash.
    if (!transports?.length) return [];

    return transports.map(transport => resolveOne(existing, transport));
};
