import * as fixtures from './__fixtures__/utils';
import { filterShadowedPendingTxsByNonce, filterTargets, sortTxsFromLatest } from './utils';

describe('blockbook/utils', () => {
    describe('filterTargets', () => {
        fixtures.filterTargets.forEach(f => {
            it(f.description, () => {
                // @ts-expect-error incorrect params
                const targets = filterTargets(f.addresses, f.targets);
                expect(targets).toEqual(f.parsed);
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
