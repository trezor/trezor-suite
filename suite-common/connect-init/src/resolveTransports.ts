import { type TransportRegistryEntry } from '@suite-common/redux-utils';
import { type ConnectSettingsTransport } from '@trezor/connect';

type ResolveParams = {
    /**
     * Transport instances/constructors directly from a debug selector.
     * Native uses this path (selector returns ready-to-use instances).
     */
    debugTransports?: ConnectSettingsTransport[];
    /**
     * Stable ids selected through the debug UI (web/desktop). Resolved
     * to instances via {@link registry}.
     */
    transportIds?: string[];
    registry?: TransportRegistryEntry[];
    /** Composition-root defaults applied when no debug override is present. */
    defaults?: ConnectSettingsTransport[];
};

const resolveFromIds = (
    ids: string[],
    registry: TransportRegistryEntry[] | undefined,
): ConnectSettingsTransport[] => {
    if (!registry?.length) return [];

    return ids.flatMap(id => {
        const entry = registry.find(r => r.id === id);
        if (!entry) return [];
        const result = entry.factory();

        return Array.isArray(result) ? result : [result];
    });
};

/**
 * Resolves the final {@link ConnectSettingsTransport}[] passed to
 * `TrezorConnect.init` / `updateConnectSettings`. Precedence:
 *   1. `debugTransports` if non-empty (used by suite-native today).
 *   2. `transportIds` resolved via `registry` if non-empty (web / desktop debug toggle).
 *   3. `defaults` from `connectInitSettings.transports` (composition-root baseline).
 */
export const resolveTransports = ({
    debugTransports,
    transportIds,
    registry,
    defaults,
}: ResolveParams): ConnectSettingsTransport[] => {
    if (debugTransports?.length) return debugTransports;
    const fromIds = transportIds ? resolveFromIds(transportIds, registry) : [];
    if (fromIds.length) return fromIds;

    return defaults ?? [];
};
