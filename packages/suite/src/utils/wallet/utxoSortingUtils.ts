import { UtxoSorting, WalletAccountTransaction } from '@suite-common/wallet-types';
import type { AccountUtxo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

type UtxoSortingFunction = (a: AccountUtxo, b: AccountUtxo) => number;

type UtxoSortingFunctionWithContext = (context: {
    accountTransactions: WalletAccountTransaction[];
}) => UtxoSortingFunction;

const performSecondarySorting: UtxoSortingFunction = (a, b) => {
    const secondaryComparison = b.txid.localeCompare(a.txid);
    if (secondaryComparison === 0) {
        return b.vout - a.vout;
    }

    return secondaryComparison;
};

const wrapSecondarySorting =
    (sortFunction: UtxoSortingFunctionWithContext): UtxoSortingFunctionWithContext =>
    context =>
    (a, b) => {
        const result = sortFunction(context)(a, b);

        if (result !== 0) {
            return result;
        }

        return performSecondarySorting(a, b);
    };

const sortFromLargestToSmallest: UtxoSortingFunctionWithContext = () => (a, b) =>
    new BigNumber(b.amount).comparedTo(new BigNumber(a.amount));

const sortFromNewestToOldest: UtxoSortingFunctionWithContext =
    ({ accountTransactions }) =>
    (a, b) => {
        if (a.blockHeight > 0 && b.blockHeight > 0) {
            return b.blockHeight - a.blockHeight;
        } else {
            // Pending transactions do not have blockHeight, so we must use blockTime of the transaction instead.
            const getBlockTime = (txid: string) => {
                const transaction = accountTransactions.find(
                    transaction => transaction.txid === txid,
                );

                return transaction?.blockTime ?? 0;
            };

            return getBlockTime(b.txid) - getBlockTime(a.txid);
        }
    };

const utxoSortMap: Record<UtxoSorting, UtxoSortingFunctionWithContext> = {
    largestFirst: wrapSecondarySorting(sortFromLargestToSmallest),
    smallestFirst:
        context =>
        (...params) =>
            wrapSecondarySorting(sortFromLargestToSmallest)(context)(...params) * -1,

    newestFirst: wrapSecondarySorting(sortFromNewestToOldest),
    oldestFirst:
        context =>
        (...params) =>
            wrapSecondarySorting(sortFromNewestToOldest)(context)(...params) * -1,
};

export const sortUtxos = (
    utxos: AccountUtxo[],
    utxoSorting: UtxoSorting | undefined,
    accountTransactions: WalletAccountTransaction[],
): AccountUtxo[] => {
    if (utxoSorting === undefined) {
        return utxos;
    }

    return [...utxos].sort(utxoSortMap[utxoSorting]({ accountTransactions }));
};
