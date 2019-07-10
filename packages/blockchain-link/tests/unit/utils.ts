import {
    filterTargets,
    filterTokenTransfers,
    transformTransaction,
} from '../../src/workers/blockbook/utils';

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
        fixtures.transformTransaction.forEach(f => {
            it(f.description, () => {
                // @ts-ignore incorrect params
                const tx = transformTransaction(f.descriptor, f.addresses, f.tx);
                expect(tx).toEqual({
                    txid: undefined,
                    blockTime: undefined,
                    blockHeight: undefined,
                    blockHash: undefined,
                    amount: undefined,
                    fee: undefined,
                    tokens: [],
                    ...f.parsed,
                });
            });
        });
    });
});
