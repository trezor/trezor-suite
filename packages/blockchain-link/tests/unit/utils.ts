import {
    filterTargets,
    filterTokenTransfers,
    transformTransaction,
} from '../../src/workers/blockbook/utils';

import * as workersUtils from '../../src/utils/workers';

import fixtures from './fixtures/utils';

describe('blockbook/utils', () => {
    describe('filterTargets', () => {
        fixtures.filterTargets.forEach(f => {
            it(f.description, () => {
                // @ts-ignore incorrect params
                const targets = filterTargets(f.addresses, f.targets);
                expect(targets).toEqual(f.parsed);
            });
        });
    });

    describe('filterTokenTransfers', () => {
        fixtures.filterTokenTransfers.forEach(f => {
            it(f.description, () => {
                // @ts-ignore incorrect params
                const transfers = filterTokenTransfers(f.addresses, f.transfers);
                expect(transfers).toEqual(f.parsed);
            });
        });
    });

    describe('transformTransaction', () => {
        // fixtures.transformTransaction = fixtures.transformTransaction.slice(3, 6);
        fixtures.transformTransaction.forEach(f => {
            it(f.description, () => {
                // @ts-ignore incorrect params
                const tx = transformTransaction(f.descriptor, f.addresses, f.tx);
                expect(tx).toMatchObject(f.parsed);
            });
        });
    });

    describe('worker utils', () => {
        expect(workersUtils.removeEmpty({ a: 1, b: 2, c: 3 }).equals({ a: 1, b: 2, c: 3 }));
        expect(workersUtils.removeEmpty({ a: undefined, b: 2, c: 3 }).equals({ b: 2, c: 3 }));
        expect(workersUtils.removeEmpty({ a: undefined, b: undefined, c: 3 }).equals({ c: 3 }));
        expect(workersUtils.removeEmpty({ a: { b: 1, c: 2 } }).equals({ a: { b: 1, c: 2 } }));
        expect(workersUtils.removeEmpty({ a: { b: undefined, c: 2 } }).equals({ a: { c: 2 } }));
        expect(
            workersUtils
                .removeEmpty({ a: { b: { c: 1, d: undefined } } })
                .equals({ a: { b: { c: 1 } } })
        );
        expect(
            workersUtils
                .removeEmpty([{ a: { b: { c: 1, d: undefined } } }])
                .equals([{ a: { b: { c: 1 } } }])
        );
    });
});
