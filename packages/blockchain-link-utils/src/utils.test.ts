import * as fixtures from './__fixtures__/utils';
import {
    enhanceVinVout,
    filterShadowedPendingTxsByNonce,
    filterTargets,
    filterTargetsBySet,
    isAccountOwned,
    sortTxsFromLatest,
    toAddressSet,
} from './utils';

describe('blockbook/utils', () => {
    describe('isAccountOwned', () => {
        fixtures.isAccountOwned.forEach(f => {
            it(f.description, () => {
                // @ts-expect-error incorrect params
                expect(isAccountOwned(new Set(f.addresses))(f.vinVout)).toBe(f.owned);
            });
        });
    });

    describe('toAddressSet', () => {
        fixtures.toAddressSet.forEach(f => {
            it(f.description, () => {
                // @ts-expect-error incorrect params
                expect(Array.from(toAddressSet(f.addresses))).toEqual(f.parsed);
            });
        });
    });

    describe('filterTargetsBySet', () => {
        fixtures.filterTargetsBySet.forEach(f => {
            it(f.description, () => {
                // @ts-expect-error incorrect params
                expect(filterTargetsBySet(new Set(f.addresses), f.targets)).toEqual(f.parsed);
            });
        });

        it('returns the original target objects', () => {
            const targets = [{ n: 0, isAddress: true, addresses: ['A'] }];

            expect(filterTargetsBySet(new Set(['A']), targets)[0]).toBe(targets[0]);
        });
    });

    describe('filterTargets', () => {
        fixtures.filterTargets.forEach(f => {
            it(f.description, () => {
                // @ts-expect-error incorrect params
                const targets = filterTargets(f.addresses, f.targets);
                expect(targets).toEqual(f.parsed);
            });
        });
    });

    describe('enhanceVinVout', () => {
        fixtures.enhanceVinVout.forEach(f => {
            it(f.description, () => {
                expect(enhanceVinVout(new Set(f.addresses))(f.vinVout)).toStrictEqual(f.enhanced);
            });
        });
    });

    it('sortTxsFromLatest', () => {
        expect(sortTxsFromLatest(fixtures.unsortedTxs as any)).toMatchObject(fixtures.sortedTxs);
    });

    describe('filterShadowedPendingTxsByNonce', () => {
        fixtures.filterShadowedPendingTxsByNonce.forEach(f => {
            it(f.description, () => {
                const out = filterShadowedPendingTxsByNonce(f.input, f.lowerCasedDescriptor);
                expect(out.map(tx => tx.txid).sort()).toEqual(f.expectedTxids.sort());
            });
        });
    });
});
