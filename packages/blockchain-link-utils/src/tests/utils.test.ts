import { filterTargets, sortTxsFromLatest } from '../utils';
import * as fixtures from './fixtures/utils';

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
});
