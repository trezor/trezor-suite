import type { Transaction } from '@trezor/blockchain-link-types';

import type { AccountSnapshot } from './accountSnapshot';
import type { SignedSweepRecord } from './sweepLedger';
import { evaluateSweepStatus } from './sweepStatus';
import { mockAccountInfo, mockHistoryTransaction } from '../../mocks/mockAccountInfo';
import { mockBackend, mockFundedAccount } from '../../mocks/mockBackend';
import { mockWallet } from '../../mocks/mockWallet';
import { composeSweep } from '../bitcoin/composeSweep';
import { validateDestination } from '../bitcoin/destinationAddress';
import { getOutpointKey } from '../bitcoin/outpoint';

const DESTINATION = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';

const setup = () => {
    const { account, utxos } = mockFundedAccount({
        chain: mockBackend(),
        wallet: mockWallet(),
        accountType: 'p2pkh',
        amounts: ['100000', '200000'],
    });
    const destination = validateDestination({
        input: DESTINATION,
        firmwareVersion: [1, 6, 3],
        ownScripts: new Set(),
    });
    if (!destination.success) throw new Error('test destination must be valid');

    const plan = composeSweep({
        utxos,
        accountType: 'p2pkh',
        destination: destination.payload,
        firmwareVersion: [1, 6, 3],
        usedAmounts: new Set(),
        getRandomInt: () => 5,
    });
    if (!plan.success) throw new Error('test plan must compose');

    const record: SignedSweepRecord = {
        hex: 'signed-hex',
        txid: '1'.repeat(64),
        account,
        plan: plan.payload,
        outpoints: plan.payload.utxos.map(getOutpointKey),
    };

    return { account, utxos, record };
};

type SpendingTransactionParams = {
    record: SignedSweepRecord;
    txid?: string;
    blockHeight?: number;
    amount?: string;
    address?: string;
    spentCount?: number;
};

const spendingTransaction = ({
    record,
    txid = record.txid,
    blockHeight = -1,
    amount = record.plan.amount,
    address = DESTINATION,
    spentCount = record.plan.utxos.length,
}: SpendingTransactionParams): Transaction =>
    mockHistoryTransaction({
        txid,
        blockHeight,
        details: {
            vin: record.plan.utxos.slice(0, spentCount).map((utxo, n) => ({
                txid: utxo.txid,
                // Blockbook leaves the index out when it is zero.
                vout: utxo.vout === 0 ? undefined : utxo.vout,
                n,
                isAddress: true,
                isAccountOwned: true,
            })),
            vout: [{ n: 0, isAddress: true, addresses: [address], value: amount }],
            size: 0,
            totalInput: '0',
            totalOutput: '0',
        },
    });

const snapshotWith = (transactions: Transaction[], utxos: AccountSnapshot['utxos'] = []) => ({
    info: mockAccountInfo({
        history: { total: transactions.length, unconfirmed: 0, transactions },
    }),
    utxos,
});

describe('evaluateSweepStatus', () => {
    it('is pending while the transfer sits in the mempool', () => {
        const { record } = setup();

        expect(
            evaluateSweepStatus({
                snapshot: snapshotWith([spendingTransaction({ record })]),
                record,
            }),
        ).toBe('pending');
    });

    it('is confirmed once the transfer is mined', () => {
        const { record } = setup();
        const snapshot = snapshotWith([spendingTransaction({ record, blockHeight: 800001 })]);

        expect(evaluateSweepStatus({ snapshot, record })).toBe('confirmed');
    });

    it('follows the inputs, not the transaction id, which a third party may have changed', () => {
        const { record } = setup();
        const snapshot = snapshotWith([
            spendingTransaction({ record, txid: '9'.repeat(64), blockHeight: 800001 }),
        ]);

        expect(evaluateSweepStatus({ snapshot, record })).toBe('confirmed');
    });

    it('notices that the transfer dropped out of the mempool', () => {
        const { record, utxos } = setup();

        // No transaction spends the inputs any more and they are back among the unspent ones.
        expect(evaluateSweepStatus({ snapshot: snapshotWith([], utxos), record })).toBe(
            'not-in-mempool',
        );
    });

    it('stays undecided while the backend shows neither the transfer nor its inputs', () => {
        const { record, utxos } = setup();

        expect(evaluateSweepStatus({ snapshot: snapshotWith([]), record })).toBe('unknown');
        expect(evaluateSweepStatus({ snapshot: snapshotWith([], [utxos[0]!]), record })).toBe(
            'unknown',
        );
    });

    it.each<[string, Partial<SpendingTransactionParams>]>([
        ['another amount', { amount: '1' }],
        ['another address', { address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2' }],
        ['only some of the inputs', { spentCount: 1 }],
    ])('does not mistake a transaction with %s for the transfer', (_description, overrides) => {
        const { record } = setup();
        const snapshot = snapshotWith([
            spendingTransaction({ record, blockHeight: 800001, ...overrides }),
        ]);

        expect(evaluateSweepStatus({ snapshot, record })).toBe('spent-by-another-transaction');
    });

    it('ignores transactions that spend other outputs', () => {
        const { record, utxos } = setup();
        const unrelated = mockHistoryTransaction({
            details: {
                vin: [{ txid: 'e'.repeat(64), n: 0, isAddress: true }],
                vout: [],
                size: 0,
                totalInput: '0',
                totalOutput: '0',
            },
        });

        expect(evaluateSweepStatus({ snapshot: snapshotWith([unrelated], utxos), record })).toBe(
            'not-in-mempool',
        );
    });
});
