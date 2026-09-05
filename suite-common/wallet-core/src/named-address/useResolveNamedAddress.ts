import { useServices } from '@suite-common/dependency-injection';
import { type NetworkSymbol, selectGetNamedAddressSupportDep } from '@suite-common/networks';
import { useQuery } from '@suite-common/react-query';
import { useDebouncedValue } from '@trezor/react-utils';

import { getResolveMode, getResolveNamedAddressQueryOptions } from './namedAddressQuery';

export const useResolveNamedAddress = (value: string, symbol: NetworkSymbol | null | undefined) => {
    const { getNamedAddressSupport } = useServices(selectGetNamedAddressSupportDep);
    // Normalize at the entry so the queryKey, debounce comparison and queryable check
    // all agree on a single canonical form — "test.eth" and "test.eth " must share cache.
    const trimmedValue = value.trim();
    const debouncedValue = useDebouncedValue(trimmedValue);
    const isDebouncing = trimmedValue !== debouncedValue;

    const { resolver } = getNamedAddressSupport(symbol);
    const debouncedMode = getResolveMode(resolver, debouncedValue);
    // Live mode follows the un-debounced value so consumers get an immediate "we're going
    // to resolve this" signal even before the debounce window elapses.
    const liveMode = getResolveMode(resolver, trimmedValue);

    const query = useQuery({
        ...getResolveNamedAddressQueryOptions({
            getNamedAddressSupport,
            value: debouncedValue,
            symbol,
        }),
        // `enabled` guarantees a supported symbol whenever the query runs.
        enabled: !isDebouncing && debouncedMode !== 'idle',
    });

    const isFetching = isDebouncing ? liveMode !== 'idle' : query.isFetching;
    const isError = !isDebouncing && query.isError;
    const isSuccess = !isDebouncing && query.isSuccess;
    const data = isDebouncing ? undefined : query.data;
    const hasResolvedString = isSuccess && typeof data === 'string';

    return {
        // Raw query fields, overridden for the debouncing window so consumers that
        // read these directly (mostly tests) see a consistent "resolving" state.
        // We deliberately enumerate fields instead of spreading `query` — spreading
        // observes every property and defeats react-query's per-field render tracking.
        data,
        isFetching,
        isError,
        isSuccess,
        error: query.error,
        // High-level fields — prefer these over the raw query in feature code so a
        // single hook owns the forward/reverse/idle classification.
        mode: liveMode,
        isResolving: liveMode !== 'idle' && isFetching,
        resolvedAddress: liveMode === 'forward' && hasResolvedString ? data : undefined,
        reverseResolvedName: liveMode === 'reverse' && hasResolvedString ? data : undefined,
        // Forward-only error: a successful query that returned `null` (no record) is also
        // an error from the user's POV, since they typed a name expecting a hex address.
        // An address with no primary name is not an error — nothing should block on it.
        isResolveError: liveMode === 'forward' && (isError || (isSuccess && data === null)),
    };
};
