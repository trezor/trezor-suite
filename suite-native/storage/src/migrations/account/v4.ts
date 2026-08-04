import { type NetworkConfigDeps, getNetworks, isNetworkSymbol } from '@suite-common/wallet-config';

type AccountLike = {
    symbol: string;
    accountType: string;
    index: number;
};

const getNetworkOrder = (deps: NetworkConfigDeps, symbol: string) =>
    getNetworks(deps).findIndex(network => network.symbol === symbol);

const getAccountTypeOrder = (deps: NetworkConfigDeps, { symbol, accountType }: AccountLike) => {
    if (!isNetworkSymbol(deps, symbol)) return -1;

    const network = deps.getNetworkConfig(symbol);

    return network ? Object.keys(network.accountTypes).indexOf(accountType) : -1;
};

/**
 * Mirrors `compareAccountsByCoin` from @suite-common/wallet-utils, but tolerates accounts
 * of networks missing from the current config because persisted data may predate it.
 */
export const sortAccountsByCoin = <T extends AccountLike>(
    deps: NetworkConfigDeps,
    oldAccounts: T[],
): T[] =>
    [...oldAccounts].sort((a, b) => {
        const networkOrder = getNetworkOrder(deps, a.symbol) - getNetworkOrder(deps, b.symbol);
        if (networkOrder !== 0) return networkOrder;

        const accountTypeOrder = getAccountTypeOrder(deps, a) - getAccountTypeOrder(deps, b);
        if (accountTypeOrder !== 0) return accountTypeOrder;

        return a.index - b.index;
    });
