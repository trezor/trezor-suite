import BigNumber from 'bignumber.js';
import { isNotUndefined, parseHostname } from '@trezor/utils';
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

const adjustHeight = (n: number | undefined) =>
    n === undefined || n <= 0 ? Number.MAX_SAFE_INTEGER : n;

export const sortTxsFromLatest = (txA: Transaction, txB: Transaction) => {
    const a = adjustHeight(txA.blockHeight);
    const b = adjustHeight(txB.blockHeight);
    if (a === b) {
        if (txA.details.vin.some(({ txid }) => txid === txB.txid)) return -1;
        if (txB.details.vin.some(({ txid }) => txid === txA.txid)) return 1;
    }
    return b - a;
};
