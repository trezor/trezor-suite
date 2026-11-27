import { type UtxoSorting, type WalletAccountTransaction } from '@suite-common/wallet-types';
import type { AccountUtxo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

type UtxoSortingFunction = (a: AccountUtxo, b: AccountUtxo) => number;

type UtxoSortingContext = {
    utxos: AccountUtxo[];
    accountTransactions: readonly (WalletAccountTransaction | null | undefined)[];
};

type UtxoSortingFunctionWithContext = (context: UtxoSortingContext) => UtxoSortingFunction;

const performSecondarySorting: UtxoSortingFunction = (a, b) => {
    const secondaryComparison = b.txid.localeCompare(a.txid);
    if (secondaryComparison === 0) {
        return b.vout - a.vout;
    }

    return secondaryComparison;
};

const wrapSecondarySorting =
    (sortFunction: UtxoSortingFunctionWithContext): UtxoSortingFunctionWithContext =>
    context => {
        const sortPrimary = sortFunction(context);

        return (a, b) => {
            const result = sortPrimary(a, b);

            if (result !== 0) {
                return result;
            }

            return performSecondarySorting(a, b);
        };
    };

const sortFromLargestToSmallest: UtxoSortingFunctionWithContext = ({ utxos }) => {
    const amountByUtxo = new Map(utxos.map(utxo => [utxo, new BigNumber(utxo.amount)] as const));
    const amountOf = (utxo: AccountUtxo) => amountByUtxo.get(utxo) ?? new BigNumber(utxo.amount);

    return (a, b) => amountOf(b).comparedTo(amountOf(a)) ?? 0;
};

const getBlockTimeByTxid = (accountTransactions: UtxoSortingContext['accountTransactions']) => {
    const blockTimeByTxid = new Map<string, number>();
    // Transactions of pages that are not fetched yet are null placeholders or holes.
    // The first transaction with a given txid wins, as it did with `find`.
    accountTransactions.forEach(transaction => {
        if (transaction != null && !blockTimeByTxid.has(transaction.txid)) {
            blockTimeByTxid.set(transaction.txid, transaction.blockTime ?? 0);
        }
    });

    return blockTimeByTxid;
};

const sortFromNewestToOldest: UtxoSortingFunctionWithContext = ({ accountTransactions }) => {
    // Built on the first comparison with a pending UTXO, so a sort without one does not pay for it.
    let blockTimeByTxid: Map<string, number> | undefined;
    const getBlockTime = (txid: string) => {
        blockTimeByTxid ??= getBlockTimeByTxid(accountTransactions);

        return blockTimeByTxid.get(txid) ?? 0;
    };

    return (a, b) => {
        if (a.blockHeight > 0 && b.blockHeight > 0) {
            return b.blockHeight - a.blockHeight;
        } else {
            // Pending transactions do not have blockHeight, so we must use blockTime of the transaction instead.
            return getBlockTime(b.txid) - getBlockTime(a.txid);
        }
    };
};

const utxoSortMap: Record<UtxoSorting, UtxoSortingFunctionWithContext> = {
    largestFirst: wrapSecondarySorting(sortFromLargestToSmallest),
    smallestFirst: context => {
        const sortLargestFirst = wrapSecondarySorting(sortFromLargestToSmallest)(context);

        return (...params) => sortLargestFirst(...params) * -1;
    },

    newestFirst: wrapSecondarySorting(sortFromNewestToOldest),
    oldestFirst: context => {
        const sortNewestFirst = wrapSecondarySorting(sortFromNewestToOldest)(context);

        return (...params) => sortNewestFirst(...params) * -1;
    },
};

export const sortUtxos = (
    utxos: AccountUtxo[],
    utxoSorting: UtxoSorting | undefined,
    accountTransactions: UtxoSortingContext['accountTransactions'],
): AccountUtxo[] => {
    if (utxoSorting === undefined) {
        return utxos;
    }

    return [...utxos].sort(utxoSortMap[utxoSorting]({ utxos, accountTransactions }));
};
