import { type Getter, asGetter } from '@trezor/dependency-injection';
import type {
    AccountType,
    BackendType,
    BoundNetworkFamily,
    NetworkContext,
    OpenNetwork,
} from '@trezor/network-module-suite-common-types';

import type { NetworkSymbol } from './NetworkModules';

/** The backend serving a network right now: the user's choice, or the network's default. */
export type GetNetworkBackend = Getter<[symbol: NetworkSymbol], BackendType>;

export type GetNetworkBackendDep = {
    getNetworkBackend: GetNetworkBackend;
};

export type GetNetworkParams = {
    readonly symbol: NetworkSymbol;
    /** Resolve for one account type when the caller works with a specific account. */
    readonly accountType?: AccountType;
};

export type GetNetworkDeps = GetNetworkBackendDep & {
    networkFamilies: readonly BoundNetworkFamily[];
};

/** `undefined` for a symbol no registered family serves. */
export type GetNetwork = Getter<[params: GetNetworkParams], OpenNetwork | undefined>;

export type GetNetworkDep = {
    getNetwork: GetNetwork;
};

const getContextKey = (context: NetworkContext) =>
    [context.symbol, context.accountType ?? '', context.backend, context.version ?? ''].join('|');

/**
 * Resolves the network for its current context. The same symbol becomes a different network when
 * its backend changes, and the same context always yields the same network object, so a component
 * reading it through `useGetter` re-renders only when the network really changed.
 */
export const createGetNetwork = (deps: GetNetworkDeps): GetNetwork => {
    const networksByContext = new Map<string, OpenNetwork | undefined>();

    return asGetter(({ symbol, accountType }: GetNetworkParams) => {
        const context: NetworkContext = {
            symbol,
            backend: deps.getNetworkBackend(symbol),
            accountType,
        };
        const contextKey = getContextKey(context);

        if (!networksByContext.has(contextKey)) {
            const family = deps.networkFamilies.find(networkFamily =>
                networkFamily.isSupportedNetwork(symbol),
            );

            networksByContext.set(contextKey, family?.resolveNetwork(context));
        }

        return networksByContext.get(contextKey);
    });
};

export const injectGetNetwork = (services: any): GetNetworkDep => ({
    getNetwork: services.networks.getNetwork,
});
