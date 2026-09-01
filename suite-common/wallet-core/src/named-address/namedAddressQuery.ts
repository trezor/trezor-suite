import type { NetworkModuleRepositoryDep, NetworkSymbol } from '@suite-common/networks';
import { commonQueryKeys } from '@suite-common/react-query';

import { type SymbolNamedAddressResolver, getNamedAddressSupport } from './namedAddressResolver';

const STALE_TIME_MS = 10 * 60 * 1000;
const GC_TIME_MS = 60 * 60 * 1000;
// A definitively absent name resolves to `null` rather than throwing, so retries only ever
// cover transport failures. Keep it to one so a flaky backend cannot multiply into a burst.
const RETRY_COUNT = 1;
const RETRY_DELAY_MS = 200;

/**
 * Matches the window `useDebouncedValue` applies inside the hook (see `useDebounce`), so the
 * hook and the form validator settle on the same value and share one fetch.
 */
export const NAMED_ADDRESS_RESOLVE_DEBOUNCE_MS = 300;

export type ResolveMode = 'forward' | 'reverse' | 'idle';

export const getResolveMode = (
    resolver: SymbolNamedAddressResolver | undefined,
    value: string,
): ResolveMode => {
    if (!resolver) return 'idle';
    if (resolver.isNameLike(value)) return 'forward';
    if (resolver.isAddressLike(value)) return 'reverse';

    return 'idle';
};

export type ResolveNamedAddressQueryParams = NetworkModuleRepositoryDep & {
    value: string;
    symbol: NetworkSymbol | null | undefined;
    /** Backend identity the lookup rides on; see `getAccountIdentity`. */
    identity?: string;
};

/**
 * Single source of truth for the resolution query, so every caller — the hook that renders the
 * hint and the form validator that blocks submission — lands on the same cache entry and one
 * network round trip. Defining the key or the policy at a call site is what lets them drift.
 *
 * The value is trimmed here rather than by the caller: an untrimmed key would silently split
 * "vitalik.eth" and " vitalik.eth " into two entries.
 */
export const getResolveNamedAddressQueryOptions = ({
    networkModuleRepository,
    value,
    symbol,
    identity,
}: ResolveNamedAddressQueryParams) => {
    const trimmedValue = value.trim();
    const { resolver } = getNamedAddressSupport(networkModuleRepository, symbol);

    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- cache identity is symbol + value; the resolver is the network module those two select, and a live object never belongs in a key. The backend identity picks the connection, not the answer, so accounts share one entry rather than each paying for the same lookup
    return {
        queryKey: commonQueryKeys.resolveNamedAddress(symbol ?? 'unknown', trimmedValue),
        queryFn: () => {
            const mode = getResolveMode(resolver, trimmedValue);

            // `enabled` keeps the hook off this path; a direct caller reaching it asked to
            // resolve something no resolver on this network can answer.
            if (!resolver || !symbol || mode === 'idle') {
                throw new Error(`Unsupported resolve mode: ${mode}`);
            }

            return mode === 'forward'
                ? resolver.resolveNamedAddress(trimmedValue, symbol, { identity })
                : resolver.reverseResolveAddress(trimmedValue, symbol, { identity });
        },
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        retry: RETRY_COUNT,
        retryDelay: RETRY_DELAY_MS,
        refetchOnWindowFocus: false,
    };
};
