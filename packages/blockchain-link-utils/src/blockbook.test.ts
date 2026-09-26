import * as fixtures from './__fixtures__/blockbook';
import { filterTokenTransfers, transformTokenInfo, transformTransaction } from './blockbook';

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

    describe('transformTokenInfo', () => {
        fixtures.transformTokenInfo.forEach(f => {
            it(f.description, () => {
                expect(transformTokenInfo(f.tokens)).toEqual(f.parsed);
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
});
