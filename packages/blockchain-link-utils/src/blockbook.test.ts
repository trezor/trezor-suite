import * as fixtures from './__fixtures__/blockbook';
import {
    createTransactionTransformer,
    filterTokenTransfers,
    transformTokenInfo,
    transformTransaction,
} from './blockbook';

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

    describe('createTransactionTransformer', () => {
        fixtures.transformTransaction.forEach(f => {
            it(f.description, () => {
                // @ts-expect-error incorrect params
                const tx = createTransactionTransformer(f.addresses ?? f.descriptor)(f.tx);
                expect(tx).toMatchObject(f.parsed);
            });
        });
    });
});
