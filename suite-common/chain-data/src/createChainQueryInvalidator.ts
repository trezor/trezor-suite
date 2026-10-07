import { type QueryClientDep, chainQueryKeys } from '@suite-common/react-query';
import type { BackendType } from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

export type ChainQueryInvalidatorDeps = QueryClientDep;

/**
 * Turns backend events into cache refreshes. Queries refresh on their own interval; these hooks
 * make them refresh as soon as the chain tells us something changed.
 */
export type ChainQueryInvalidator = {
    /** A new block may change any account on the network. */
    onBlock: (symbol: NetworkSymbol, backendType: BackendType) => Promise<void>;

    /** The backend reported activity on one account. */
    onAccountNotification: (
        symbol: NetworkSymbol,
        backendType: BackendType,
        descriptor: string,
    ) => Promise<void>;

    /** The user switched the network's backend; nothing cached for the network is current. */
    onBackendChanged: (symbol: NetworkSymbol) => Promise<void>;
};

export const createChainQueryInvalidator = (
    deps: ChainQueryInvalidatorDeps,
): ChainQueryInvalidator => ({
    onBlock: (symbol, backendType) =>
        deps.queryClient.invalidateQueries({
            queryKey: chainQueryKeys.accounts(symbol, backendType),
        }),
    onAccountNotification: (symbol, backendType, descriptor) =>
        deps.queryClient.invalidateQueries({
            queryKey: chainQueryKeys.account(symbol, backendType, descriptor),
        }),
    onBackendChanged: symbol =>
        deps.queryClient.invalidateQueries({ queryKey: chainQueryKeys.all(symbol) }),
});
