import type { EnhancedVinVout, Transaction, VinVout } from '@trezor/blockchain-link-types';
import { topologicalSort } from '@trezor/utils';
import { BigNumber, type BigNumberValue } from '@trezor/utils/src/bigNumber';

export type Addresses = ({ address: string } | string)[] | string;

export const isAccountOwned = (addresses: ReadonlySet<string>) => (vinVout: VinVout) =>
    Array.isArray(vinVout?.addresses) && vinVout.addresses.some(a => addresses.has(a));

/**
 * Normalises an address list into the membership index `isAccountOwned` queries. Build it once
 * per transaction and reuse it through `filterTargetsBySet` and `enhanceVinVout`.
 */
export const toAddressSet = (addresses: Addresses): Set<string> => {
    if (typeof addresses === 'string') return new Set([addresses]);
    // The list comes straight off the wire, so it is not guaranteed to match its type.
    if (!addresses || !Array.isArray(addresses)) return new Set();

    const set = new Set<string>();
    for (const a of addresses) {
        if (typeof a === 'string') {
            set.add(a);
        } else if (typeof a === 'object' && typeof a.address === 'string') {
            set.add(a.address);
        }
    }

    return set;
};

export const filterTargetsBySet = (
    addresses: ReadonlySet<string>,
    targets: VinVout[],
): VinVout[] => {
    // Targets are not guaranteed to match their type at runtime either.
    if (!targets || !Array.isArray(targets)) return [];

    return targets.filter(isAccountOwned(addresses));
};

export const filterTargets = (addresses: Addresses, targets: VinVout[]): VinVout[] =>
    filterTargetsBySet(toAddressSet(addresses), targets);

export const enhanceVinVout = (addresses: ReadonlySet<string>) => {
    const isOwned = isAccountOwned(addresses);

    return (vinVout: VinVout): EnhancedVinVout => ({
        ...vinVout,
        isAccountOwned: isOwned(vinVout) || undefined,
    });
};

export const sumVinVout = (sum: BigNumberValue, { value }: VinVout): BigNumberValue =>
    typeof value === 'string' ? new BigNumber(value || '0').plus(sum) : sum;

export const transformTarget = (target: VinVout, incoming: VinVout[]) => ({
    n: target.n || 0,
    addresses: target.addresses,
    isAddress: target.isAddress,
    amount: target.value,
    coinbase: target.coinbase,
    isAccountTarget: incoming.includes(target) ? true : undefined,
});

const adjustHeight = ({ blockHeight }: { blockHeight?: number }) =>
    blockHeight === undefined || blockHeight <= 0 ? Number.MAX_SAFE_INTEGER : blockHeight;

export const sortTxsFromLatest = (transactions: Transaction[]) => {
    const txs = transactions.slice().sort((a, b) => adjustHeight(b) - adjustHeight(a));
    let from = 0;
    while (from < txs.length - 1) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const fromTx: Transaction = txs[from];
        const fromHeight = adjustHeight(fromTx);
        let to = from + 1;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const toTx: Transaction = txs[to];
        if (fromHeight === adjustHeight(toTx)) {
            to++;
            while (to < txs.length) {
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const nextTx: Transaction = txs[to];
                if (fromHeight !== adjustHeight(nextTx)) break;
                to++;
            }
            const toposorted = topologicalSort(txs.slice(from, to), (a, b) =>
                a.details.vin.some(({ txid }) => txid === b.txid),
            );
            txs.splice(from, toposorted.length, ...toposorted);
        }
        from = to;
    }

    return txs;
};

const isOutgoing = (lowerCasedDescriptor: string, tx: Transaction) =>
    tx.details?.vin?.[0]?.addresses?.[0]?.toLowerCase() === lowerCasedDescriptor;

export const filterShadowedPendingTxsByNonce = (
    txs: Transaction[],
    lowerCasedDescriptor: string,
) => {
    // txs should come sorted by nonce
    const myLatestMinedTx = txs.find(
        tx =>
            isOutgoing(lowerCasedDescriptor, tx) &&
            tx.ethereumSpecific &&
            (tx.ethereumSpecific.status === 0 || tx.ethereumSpecific.status === 1) &&
            Number.isInteger(tx.ethereumSpecific.nonce),
    );

    if (!myLatestMinedTx?.ethereumSpecific) return txs;

    const latestMinedNonce = myLatestMinedTx.ethereumSpecific.nonce;

    return txs.filter(tx => {
        const es = tx.ethereumSpecific;
        if (!es) return true;

        const isOutgoingTx = isOutgoing(lowerCasedDescriptor, tx);
        const isPending = es.status === -1;

        if (isOutgoingTx && isPending && es.nonce <= latestMinedNonce) {
            return false;
        }

        return true;
    });
};
