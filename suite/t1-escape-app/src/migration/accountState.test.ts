import type { Utxo } from '@trezor/blockchain-link-types';

import { evaluateAccountState } from './accountState';
import { mockAccountInfo, mockHistoryTransaction } from '../../mocks/mockAccountInfo';
import { mockUtxo } from '../../mocks/mockUtxo';
import { getOutpointKey } from '../bitcoin/outpoint';

const TXID_A = 'a'.repeat(64);
const TXID_B = 'b'.repeat(64);
const TXID_C = 'c'.repeat(64);

const pendingTransaction = (txid: string, vin: { txid: string; vout?: number }[]) =>
    mockHistoryTransaction({
        txid,
        blockHeight: -1,
        details: {
            vin: vin.map((input, n) => ({ ...input, n, isAddress: true, isAccountOwned: true })),
            vout: [],
            size: 0,
            totalInput: '0',
            totalOutput: '0',
        },
    });

describe('evaluateAccountState', () => {
    it('lists confirmed outputs as spendable when nothing is pending', () => {
        const utxos = [mockUtxo({ txid: TXID_A }), mockUtxo({ txid: TXID_B, vout: 1 })];

        expect(evaluateAccountState({ info: mockAccountInfo(), utxos })).toEqual({
            spendable: utxos,
            unconfirmed: [],
            inFlight: [],
            ambiguities: [],
        });
    });

    it('rebuilds a transfer in flight from the pending transaction after a reload', () => {
        // The earlier transfer spent A:0 and B:1. The backend no longer lists them as unspent.
        const remaining = mockUtxo({ txid: TXID_C });
        const info = mockAccountInfo({
            history: {
                total: 3,
                unconfirmed: 1,
                transactions: [
                    pendingTransaction('e'.repeat(64), [
                        { txid: TXID_A },
                        { txid: TXID_B, vout: 1 },
                    ]),
                    mockHistoryTransaction({ txid: TXID_A }),
                ],
            },
        });

        expect(evaluateAccountState({ info, utxos: [remaining] })).toEqual({
            spendable: [remaining],
            unconfirmed: [],
            inFlight: [
                {
                    txid: 'e'.repeat(64),
                    spentOutpoints: [
                        getOutpointKey({ txid: TXID_A, vout: 0 }),
                        getOutpointKey({ txid: TXID_B, vout: 1 }),
                    ],
                },
            ],
            ambiguities: [],
        });
    });

    it('treats a missing or non-positive block height as pending', () => {
        const info = mockAccountInfo({
            history: {
                total: 2,
                unconfirmed: 2,
                transactions: [
                    { ...pendingTransaction(TXID_A, [{ txid: TXID_C }]), blockHeight: undefined },
                    { ...pendingTransaction(TXID_B, [{ txid: TXID_C, vout: 1 }]), blockHeight: 0 },
                ],
            },
        });

        expect(evaluateAccountState({ info, utxos: [] }).inFlight).toHaveLength(2);
    });

    it('does not count a pending incoming transaction as a transfer in flight', () => {
        const incoming = mockHistoryTransaction({
            txid: TXID_A,
            blockHeight: -1,
            details: {
                vin: [{ txid: TXID_B, n: 0, isAddress: true }],
                vout: [],
                size: 0,
                totalInput: '0',
                totalOutput: '0',
            },
        });
        const info = mockAccountInfo({
            history: { total: 1, unconfirmed: 1, transactions: [incoming] },
        });
        const unconfirmed = mockUtxo({ txid: TXID_A, confirmations: 0, blockHeight: -1 });

        expect(evaluateAccountState({ info, utxos: [unconfirmed] })).toEqual({
            spendable: [],
            unconfirmed: [unconfirmed],
            inFlight: [],
            ambiguities: [],
        });
    });

    it('never offers an unconfirmed output for spending', () => {
        const utxos = [
            mockUtxo({ txid: TXID_A, confirmations: 0, blockHeight: -1 }),
            mockUtxo({ txid: TXID_B, confirmations: 0, blockHeight: 0 }),
            mockUtxo({ txid: TXID_C, confirmations: 1, blockHeight: 800000 }),
        ];

        const state = evaluateAccountState({ info: mockAccountInfo(), utxos });

        expect(state.spendable).toEqual([utxos[2]]);
        expect(state.unconfirmed).toEqual([utxos[0], utxos[1]]);
    });

    it('flags an output the backend lists as unspent although the mempool spends it', () => {
        const listed = mockUtxo({ txid: TXID_A });
        const info = mockAccountInfo({
            history: {
                total: 1,
                unconfirmed: 1,
                transactions: [pendingTransaction(TXID_B, [{ txid: TXID_A }])],
            },
        });

        expect(evaluateAccountState({ info, utxos: [listed] })).toMatchObject({
            spendable: [],
            ambiguities: ['utxo-spent-in-mempool'],
        });
    });

    it('flags a history that hides some of the pending transactions', () => {
        const info = mockAccountInfo({
            history: { total: 5, unconfirmed: 2, transactions: [pendingTransaction(TXID_A, [])] },
        });

        expect(evaluateAccountState({ info, utxos: [] }).ambiguities).toEqual([
            'pending-history-incomplete',
        ]);
    });

    it.each([
        ['an unusable path', { path: 'm/44/0/0/0/0' }],
        ['an amount that is not a number', { amount: 'lots' }],
        ['a broken transaction id', { txid: 'abc' }],
    ])('flags an output with %s and does not offer it for spending', (_description, overrides) => {
        const good = mockUtxo({ txid: TXID_A });

        expect(
            evaluateAccountState({
                info: mockAccountInfo(),
                utxos: [good, mockUtxo({ txid: TXID_B, ...overrides })],
            }),
        ).toMatchObject({ spendable: [good], ambiguities: ['malformed-utxo'] });
    });

    it('treats an output without a confirmation count as unconfirmed', () => {
        const utxo = { ...mockUtxo(), confirmations: undefined } as unknown as Utxo;

        expect(evaluateAccountState({ info: mockAccountInfo(), utxos: [utxo] })).toMatchObject({
            spendable: [],
            unconfirmed: [utxo],
        });
    });

    it('flags an outpoint that is listed twice', () => {
        const utxo = mockUtxo({ txid: TXID_A });

        expect(
            evaluateAccountState({ info: mockAccountInfo(), utxos: [utxo, utxo] }),
        ).toMatchObject({ spendable: [utxo], ambiguities: ['duplicate-utxo'] });
    });
});
