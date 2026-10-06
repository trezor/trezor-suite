import { getNetworkOptional } from '@suite-common/wallet-config';

type AccountLike = {
    symbol: string;
    accountType: string;
    index: number;
};

const getAccountTypeOrder = ({ symbol, accountType }: AccountLike) => {
    const network = getNetworkOptional(symbol);

    return network ? Object.keys(network.accountTypes).indexOf(accountType) : -1;
};

/**
 * Mirrors `compareAccountsByCoin` from @suite-common/wallet-utils, but tolerates accounts
 * of networks missing from the current config because persisted data may predate it.
 */
export const sortAccountsByCoin = <T extends AccountLike>(
    oldAccounts: T[],
    supportedNetworks: readonly string[],
): T[] =>
    [...oldAccounts].sort((a, b) => {
        const networkOrder =
            supportedNetworks.indexOf(a.symbol) - supportedNetworks.indexOf(b.symbol);
        if (networkOrder !== 0) return networkOrder;

        const accountTypeOrder = getAccountTypeOrder(a) - getAccountTypeOrder(b);
        if (accountTypeOrder !== 0) return accountTypeOrder;

        return a.index - b.index;
    });
