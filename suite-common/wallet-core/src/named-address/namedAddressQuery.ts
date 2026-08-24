import { commonQueryKeys } from '@suite-common/react-query';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    isSymbolSupportingNamedAddress,
    looksLikeEvmAddress,
    looksLikeNamedAddress,
} from '@suite-common/wallet-utils';

import { resolveNamedAddress, reverseResolveAddress } from './resolveNamedAddress';

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
    value: string,
    symbol: NetworkSymbol | null | undefined,
): ResolveMode => {
    if (!symbol || !isSymbolSupportingNamedAddress(symbol)) return 'idle';
    if (looksLikeNamedAddress(value)) return 'forward';
    if (looksLikeEvmAddress(value)) return 'reverse';

    return 'idle';
};

export const getResolveFn = (mode: ResolveMode) => {
    if (mode === 'forward') return resolveNamedAddress;
    if (mode === 'reverse') return reverseResolveAddress;
    throw new Error(`Unsupported resolve mode: ${mode}`);
};

/**
 * Single source of truth for the resolution query, so every caller — the hook that renders the
 * hint and the form validator that blocks submission — lands on the same cache entry and one
 * network round trip. Defining the key or the policy at a call site is what lets them drift.
 *
 * The value is trimmed here rather than by the caller: an untrimmed key would silently split
 * "vitalik.eth" and " vitalik.eth " into two entries.
 */
export const getResolveNamedAddressQueryOptions = (
    value: string,
    symbol: NetworkSymbol | null | undefined,
) => {
    const trimmedValue = value.trim();

    return {
        queryKey: commonQueryKeys.resolveNamedAddress(symbol ?? 'unknown', trimmedValue),
        queryFn: () =>
            getResolveFn(getResolveMode(trimmedValue, symbol))(
                trimmedValue,
                symbol as NetworkSymbol,
            ),
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        retry: RETRY_COUNT,
        retryDelay: RETRY_DELAY_MS,
        refetchOnWindowFocus: false,
    };
};
