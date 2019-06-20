/* @flow */

import {
    filterTargets,
    filterTokenTransfers,
    transformTransaction,
} from '../../src/workers/blockbook/utils';

import fixtures from './fixtures/utils';

describe('blockbook/utils', () => {
    describe('filterTargets', () => {
        it('addresses as string', async () => {
            const t = filterTargets('A', [{ addresses: ['A'], n: 0 }, { addresses: ['B'], n: 1 }]);
            expect(t).toEqual([{ addresses: ['A'], n: 0 }]);
        });

        it('addresses as array of strings', async () => {
            const t = filterTargets(
                ['A'],
                [{ addresses: ['A'], n: 0 }, { addresses: ['B'], n: 1 }]
            );
            expect(t).toEqual([{ addresses: ['A'], n: 0 }]);
        });

        it('addresses as array of mixed objects', async () => {
            const t = filterTargets(
                // $FlowIssue
                ['A', 1, undefined, 'C', { address: 'B', path: '', transfers: 0, decimal: 0 }],
                [{ addresses: ['A'], n: 0 }, { addresses: ['B'], n: 1 }]
            );
            expect(t).toEqual([{ addresses: ['A'], n: 0 }, { addresses: ['B'], n: 1 }]);
        });

        it('targets not found', async () => {
            const t = filterTargets('A', [{ addresses: ['B'], n: 0 }, { addresses: ['C'], n: 1 }]);
            expect(t).toEqual([]);
        });

        it('addresses as unexpected object', async () => {
            // $FlowIssue
            let t = filterTargets(1, [{ addresses: ['A'], n: 0 }]);
            expect(t).toEqual([]);
            // $FlowIssue
            t = filterTargets(null, [{ addresses: ['A'], n: 0 }]);
            expect(t).toEqual([]);
            // $FlowIssue
            t = filterTargets([1], [{ addresses: ['A'], n: 0 }]);
            expect(t).toEqual([]);
            // $FlowIssue
            t = filterTargets([{ foo: 'bar' }], [{ addresses: ['A'], n: 0 }]);
            expect(t).toEqual([]);
        });

        it('targets as unexpected object', async () => {
            let t = filterTargets('A', 'A');
            expect(t).toEqual([]);

            t = filterTargets('A', ['A', null, 1, {}]);
            expect(t).toEqual([]);

            t = filterTargets('A', null);
            expect(t).toEqual([]);
        });
    });

    describe('filterTokenTransfers', () => {
        const tokens = [{ from: 'A', to: 'B' }, { from: 'C', to: 'D' }, { from: 'X', to: 'X' }];
        it('addresses as string', async () => {
            const t = filterTokenTransfers('A', tokens);
            expect(t).toEqual([tokens[0]]);
        });

        it('addresses as array of strings', async () => {
            const t = filterTokenTransfers(['A'], tokens);
            expect(t).toEqual([tokens[0]]);
        });

        it('addresses as array of mixed objects', async () => {
            const t = filterTokenTransfers(
                // $FlowIssue
                ['A', 1, undefined, 'X', { address: 'D' }, 'NOT_FOUND'],
                tokens
            );
            expect(t).toEqual(tokens);
        });

        it('addresses as Address object', async () => {
            const t = filterTokenTransfers(
                [{ address: 'A', path: '', transfers: 0, decimal: 0 }],
                tokens
            );
            expect(t).toEqual([tokens[0]]);
        });

        it('addresses as unexpected object', async () => {
            // $FlowIssue
            let t = filterTokenTransfers(1, tokens);
            expect(t).toEqual([]);
            // $FlowIssue
            t = filterTokenTransfers(null, tokens);
            expect(t).toEqual([]);
            // $FlowIssue
            t = filterTokenTransfers([1], tokens);
            expect(t).toEqual([]);
            // $FlowIssue
            t = filterTokenTransfers([{ foo: 'bar' }], tokens);
            expect(t).toEqual([]);
        });

        it('transfers sent', async () => {
            let t = filterTokenTransfers('A', tokens);
            expect(t).toEqual([tokens[0]]);

            t = filterTokenTransfers(['C'], tokens);
            expect(t).toEqual([tokens[1]]);
        });

        it('transfers recv', async () => {
            let t = filterTokenTransfers('B', tokens);
            expect(t).toEqual([tokens[0]]);

            t = filterTokenTransfers(['D'], tokens);
            expect(t).toEqual([tokens[1]]);
        });

        it('transfers self', async () => {
            const t = filterTokenTransfers('X', tokens);
            expect(t).toEqual([tokens[2]]);
        });

        it('transfers as unexpected object', async () => {
            let t = filterTokenTransfers('A', 'A');
            expect(t).toEqual([]);

            t = filterTokenTransfers('A', ['A', null, 1, {}]);
            expect(t).toEqual([]);

            t = filterTokenTransfers('A', null);
            expect(t).toEqual([]);

            t = filterTokenTransfers('A', []);
            expect(t).toEqual([]);
        });
    });

    describe('transformTransaction', () => {
        fixtures.transformTransaction.forEach(f => {
            it(f.description, () => {
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
