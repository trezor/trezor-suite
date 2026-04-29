import { commonQueryKeys, useQuery } from '@suite-common/react-query';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isSymbolSupportingNamedAddress, looksLikeNamedAddress } from '@suite-common/wallet-utils';
import { useDebouncedValue } from '@trezor/react-utils';

import { resolveViaBlockbook } from './resolveNamedAddresBB';

const STALE_TIME_MS = 10 * 60 * 1000;
const GC_TIME_MS = 60 * 60 * 1000;

type ResolveMode = 'forward' | 'idle'; // | 'reverse'

const getResolveMode = (value: string, symbol: NetworkSymbol | null | undefined): ResolveMode => {
    if (!symbol || !isSymbolSupportingNamedAddress(symbol)) return 'idle';
    if (looksLikeNamedAddress(value)) return 'forward';
    // if (isAddressValid(value, symbol)) return 'reverse';

    return 'idle';
};

export const getResolveFn = (debouncedMode: ResolveMode) => {
    if (debouncedMode === 'forward') return resolveViaBlockbook;
    throw new Error(`Unsupported resolve mode: ${debouncedMode}`);
};

/**
 * As blockbook API only works in forward mode, we return 'forward' for now.
 */
export const useResolveNamedAddress = (value: string, symbol: NetworkSymbol | null | undefined) => {
    // Normalize at the entry so the queryKey, debounce comparison and queryable check
    // all agree on a single canonical form — "test.eth" and "test.eth " must share cache.
    const trimmedValue = value.trim();
    const debouncedValue = useDebouncedValue(trimmedValue);
    const isDebouncing = trimmedValue !== debouncedValue;

    const debouncedMode = getResolveMode(debouncedValue, symbol);
    // Live mode follows the un-debounced value so consumers get an immediate "we're going
    // to resolve this" signal even before the debounce window elapses.
    const liveMode = getResolveMode(trimmedValue, symbol);

    const query = useQuery({
        queryKey: commonQueryKeys.resolveNamedAddress(symbol ?? 'unknown', debouncedValue),
        queryFn: () => getResolveFn(debouncedMode)!(debouncedValue),
        enabled: !isDebouncing && debouncedMode !== 'idle',
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        retry: 3,
        retryDelay: 200,
        refetchOnWindowFocus: false,
    });

    const isFetching = isDebouncing ? liveMode !== 'idle' : query.isFetching;
    const isError = !isDebouncing && query.isError;
    const isSuccess = !isDebouncing && query.isSuccess;
    const data = isDebouncing ? undefined : query.data;
    const hasResolvedString = isSuccess && typeof data === 'string';

    return {
        ...query,
        // Override the raw query flags for the debouncing window so consumers that
        // read these directly (mostly tests) see a consistent "resolving" state.
        data,
        isFetching,
        isError,
        isSuccess,
        // High-level fields — prefer these over the raw query in feature code so a
        // single hook owns the forward/reverse/idle classification.
        mode: liveMode,
        isResolving: liveMode !== 'idle' && isFetching,
        resolvedAddress: liveMode === 'forward' && hasResolvedString ? (data as string) : undefined,
        // reverseResolvedName:
        //     liveMode === 'reverse' && hasResolvedString ? (data as string) : undefined,
        // Forward-only error: a successful query that returned `null` (no record) is also
        // an error from the user's POV, since they typed a name expecting a hex address.
        isResolveError: liveMode === 'forward' && (isError || (isSuccess && data === null)),
    };
};
