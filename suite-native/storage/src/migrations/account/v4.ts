import { networkSymbolCollection, networks } from '@suite-common/wallet-config';

type AccountLike = {
    symbol: string;
    accountType: string;
    index: number;
};

const getNetworkOrder = (symbol: string) =>
    (networkSymbolCollection as readonly string[]).indexOf(symbol);

const getAccountTypeOrder = ({ symbol, accountType }: AccountLike) => {
    const network = (networks as Record<string, { accountTypes: Record<string, unknown> }>)[symbol];

    return network ? Object.keys(network.accountTypes).indexOf(accountType) : -1;
};

/**
 * Mirrors `compareAccountsByCoin` from @suite-common/wallet-utils, but tolerates accounts
 * of networks missing from the current config because persisted data may predate it.
 */
export const sortAccountsByCoin = <T extends AccountLike>(oldAccounts: T[]): T[] =>
    [...oldAccounts].sort((a, b) => {
        const networkOrder = getNetworkOrder(a.symbol) - getNetworkOrder(b.symbol);
        if (networkOrder !== 0) return networkOrder;

        const accountTypeOrder = getAccountTypeOrder(a) - getAccountTypeOrder(b);
        if (accountTypeOrder !== 0) return accountTypeOrder;

        return a.index - b.index;
    });
