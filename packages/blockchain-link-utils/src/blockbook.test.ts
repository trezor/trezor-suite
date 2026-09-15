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
        // [btc-unknown-tx-debug] transformTransaction emits a temporary console.error when it classifies
        // a tx as 'unknown' with account context. Silence the JestCustomEnv console.error trap for these
        // classification fixtures (the only console.error in transformTransaction is that diagnostic).
        beforeEach(() => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
        });
        afterEach(() => {
            jest.restoreAllMocks();
        });
        fixtures.transformTransaction.forEach(f => {
            it(f.description, () => {
                // @ts-expect-error incorrect params
                const tx = transformTransaction(f.tx, f.addresses ?? f.descriptor);
                expect(tx).toMatchObject(f.parsed);
            });
        });
    });
});
