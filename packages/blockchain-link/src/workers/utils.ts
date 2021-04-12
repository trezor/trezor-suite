import BigNumber from 'bignumber.js';
import { Address } from '../types';
import { VinVout } from '../types/blockbook';

export type Addresses = (Address | string)[] | string;

export const filterTargets = (addresses: Addresses, targets: VinVout[]): VinVout[] => {
    if (typeof addresses === 'string') {
        addresses = [addresses];
    }
    // neither addresses or targets are missing
    if (!addresses || !Array.isArray(addresses) || !targets || !Array.isArray(targets)) return [];

    const all: (string | null)[] = addresses.map(a => {
        if (typeof a === 'string') return a;
        if (typeof a === 'object' && typeof a.address === 'string') return a.address;
        return null;
    });

    return targets.filter(t => {
        if (t && Array.isArray(t.addresses)) {
            return t.addresses.filter(a => all.indexOf(a) >= 0).length > 0;
        }
        return false;
    });
};

export const sumVinVout = (
    vinVout: VinVout[],
    initialValue = '0',
    operation: 'sum' | 'reduce' = 'sum'
) => {
    const sum = vinVout.reduce((bn, v) => {
        if (typeof v.value !== 'string') return bn;
        return operation === 'sum' ? bn.plus(v.value) : bn.minus(v.value);
    }, new BigNumber(initialValue));
    return sum.toString();
};

export const transformTarget = (target: VinVout, incoming: VinVout[]) => ({
    n: target.n || 0,
    addresses: target.addresses,
    isAddress: target.isAddress,
    amount: target.value,
    coinbase: target.coinbase,
    isAccountTarget: incoming.includes(target) ? true : undefined,
});
