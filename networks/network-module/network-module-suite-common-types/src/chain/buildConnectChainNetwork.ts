import type { ChainNetwork, ChainNetworkParams } from './ChainNetwork';
import { ChainNetworkError } from './ChainNetworkError';
import { getChainSyncPolicy } from './ChainSyncPolicy';
import type { FetchCurrentFiatRate } from './FiatRate';
import type {
    FetchConnectAccountBalance,
    FetchConnectAccountBalanceParams,
} from './createFetchConnectAccountBalance';
import { getDisplayBalanceFiatValue } from './getDisplayBalanceFiatValue';

export type ConnectChainNetworkDefinition = {
    params: ChainNetworkParams;
    decimals: number;
    accountSyncIntervalMs: number;
    displayBalance: FetchConnectAccountBalanceParams['displayBalance'];
    useConnectionIdentity: boolean;
    fetchAccountBalance: FetchConnectAccountBalance;

    /** `null` when the network has no fiat value at all (testnets). */
    fetchFiatRate: FetchCurrentFiatRate | null;
    getAccountFiatBalance?: ChainNetwork['getAccountFiatBalance'];
};

/**
 * Assembles a network whose accounts are read through Connect. Network packages state only what
 * differs between them (decimals, displayed balance, rate source); the wiring is shared.
 */
export const buildConnectChainNetwork = (
    definition: ConnectChainNetworkDefinition,
): ChainNetwork => {
    const { symbol } = definition.params;
    const { fetchFiatRate } = definition;

    return {
        symbol,
        backendType: definition.params.backend.type,
        syncPolicy: getChainSyncPolicy(definition.accountSyncIntervalMs),
        getAccountBalance: async params => {
            if (params.ref.symbol !== symbol) {
                throw new ChainNetworkError('symbol-mismatch', symbol);
            }

            return await definition.fetchAccountBalance({
                ...params,
                decimals: definition.decimals,
                displayBalance: definition.displayBalance,
                useConnectionIdentity: definition.useConnectionIdentity,
                gap: definition.params.gapLimit,
            });
        },
        getNativeFiatRate: async params =>
            fetchFiatRate ? await fetchFiatRate({ ...params, symbol }) : null,
        getAccountFiatBalance: definition.getAccountFiatBalance ?? getDisplayBalanceFiatValue,
    };
};
