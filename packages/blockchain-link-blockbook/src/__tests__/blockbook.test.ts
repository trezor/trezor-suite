import {
    filterShadowedPendingTxsByNonce,
    filterTokenTransfers,
    transformTransaction,
} from '../utils';
import * as fixtures from './fixtures/blockbook';
import * as filterShadowedFixtures from './fixtures/filterShadowedPendingTxsByNonce';

describe('blockbook/utils', () => {
    describe('filterTokenTransfers', () => {
        fixtures.filterTokenTransfers.forEach(f => {
            it(f.description, () => {
                // @ts-expect-error incorrect params
                const transfers = filterTokenTransfers(f.addresses, f.transfers);
                expect(transfers).toEqual(f.parsed);
            });
        });
    });

    describe('transformTransaction', () => {
        fixtures.transformTransaction.forEach(f => {
            it(f.description, () => {
                // @ts-expect-error incorrect params
                const tx = transformTransaction(f.tx, f.addresses ?? f.descriptor);
                expect(tx).toMatchObject(f.parsed);
            });
        });
    });

    describe('filterShadowedPendingTxsByNonce', () => {
        filterShadowedFixtures.filterShadowedPendingTxsByNonce.forEach(f => {
            it(f.description, () => {
                const out = filterShadowedPendingTxsByNonce(f.input, f.lowerCasedDescriptor);
                expect(out.map(tx => tx.txid).sort()).toEqual(f.expectedTxids.sort());
            });
        });
    });
});
