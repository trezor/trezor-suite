import BigNumber from 'bignumber.js';
import { isNotUndefined, parseHostname, topologicalSort } from '@trezor/utils';
import type { Transaction, EnhancedVinVout } from '../types';
import type { VinVout } from '../types/blockbook';

export type Addresses = ({ address: string } | string)[] | string;

export const isAccountOwned = (addresses: string[]) => (vinVout: VinVout) =>
    Array.isArray(vinVout?.addresses) && vinVout.addresses.some(a => addresses.includes(a));

export const filterTargets = (addresses: Addresses, targets: VinVout[]): VinVout[] => {
    if (typeof addresses === 'string') {
        addresses = [addresses];
    }
    // neither addresses or targets are missing
    if (!addresses || !Array.isArray(addresses) || !targets || !Array.isArray(targets)) return [];

    const all = addresses
        .map(a => {
            if (typeof a === 'string') return a;
            if (typeof a === 'object' && typeof a.address === 'string') return a.address;
            return undefined;
        })
        .filter(isNotUndefined);

    return targets.filter(isAccountOwned(all));
};

export const enhanceVinVout =
    (addresses: string[]) =>
    (vinVout: VinVout): EnhancedVinVout => ({
        ...vinVout,
        isAccountOwned: isAccountOwned(addresses)(vinVout) || undefined,
    });

export const sumVinVout = (sum: BigNumber.Value, { value }: VinVout): BigNumber.Value =>
    typeof value === 'string' ? new BigNumber(value || '0').plus(sum) : sum;

export const transformTarget = (target: VinVout, incoming: VinVout[]) => ({
    n: target.n || 0,
    addresses: target.addresses,
    isAddress: target.isAddress,
    amount: target.value,
    coinbase: target.coinbase,
    isAccountTarget: incoming.includes(target) ? true : undefined,
});

/**
 * Sorts array of backend urls so the localhost addresses are first,
 * then onion addresses and then the rest. Apart from that it will
 * be shuffled randomly.
 */
export const prioritizeEndpoints = (urls: string[]) =>
    urls
        .map((url): [string, number] => {
            const hostname = parseHostname(url);
            let priority = Math.random();
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                priority += 2;
            } else if (hostname?.endsWith('.onion')) {
                priority += 1;
            }
            return [url, priority];
        })
        .sort(([, a], [, b]) => b - a)
        .map(([url]) => url);

const adjustHeight = ({ blockHeight }: { blockHeight?: number }) =>
    blockHeight === undefined || blockHeight <= 0 ? Number.MAX_SAFE_INTEGER : blockHeight;

export const sortTxsFromLatest = (transactions: Transaction[]) => {
    const txs = transactions.slice().sort((a, b) => adjustHeight(b) - adjustHeight(a));
    let from = 0;
    while (from < txs.length - 1) {
        const fromHeight = adjustHeight(txs[from]);
        let to = from + 1;
        if (fromHeight === adjustHeight(txs[to])) {
            do {
                to++;
            } while (to < txs.length && fromHeight === adjustHeight(txs[to]));
            const toposorted = topologicalSort(txs.slice(from, to), (a, b) =>
                a.details.vin.some(({ txid }) => txid === b.txid),
            );
            txs.splice(from, toposorted.length, ...toposorted);
        }
        from = to;
    }
    return txs;
};
