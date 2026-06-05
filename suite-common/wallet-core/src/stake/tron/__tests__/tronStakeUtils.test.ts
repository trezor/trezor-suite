import { type TronAccountExtraData } from '@trezor/blockchain-link-types';

import { getResourceGain } from '../tronStakeUtils';

const resources = {
    totalEnergyLimit: 100,
    totalEnergyWeight: 10,
    totalBandwidthLimit: 200,
    totalBandwidthWeight: 50,
} as TronAccountExtraData;

describe(getResourceGain.name, () => {
    it('computes energy gain (amount × limit / weight)', () => {
        expect(getResourceGain('5', 'energy', resources)).toBe(50);
    });

    it('computes bandwidth gain', () => {
        expect(getResourceGain('5', 'bandwidth', resources)).toBe(20);
    });

    it('returns null when resources are missing', () => {
        expect(getResourceGain('5', 'energy', undefined)).toBeNull();
    });

    it('returns null when the relevant global is missing or zero', () => {
        expect(
            getResourceGain('5', 'energy', { totalEnergyWeight: 0 } as TronAccountExtraData),
        ).toBeNull();
        expect(getResourceGain('5', 'energy', {} as TronAccountExtraData)).toBeNull();
        expect(
            getResourceGain('5', 'energy', { totalEnergyWeight: 10 } as TronAccountExtraData),
        ).toBeNull();
    });

    it.each(['', '0', '-1', 'abc'])('returns null for invalid amount %p', amount => {
        expect(getResourceGain(amount, 'energy', resources)).toBeNull();
    });
});
