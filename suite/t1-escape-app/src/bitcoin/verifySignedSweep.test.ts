import { bufferUtils } from '@trezor/utils';
import { Transaction } from '@trezor/utxo-lib';

import { BITCOIN_NETWORK } from './bitcoinNetwork';
import { type SweepPlan, composeSweep } from './composeSweep';
import { validateDestination } from './destinationAddress';
import { verifySignedSweep } from './verifySignedSweep';
import { mockUtxo } from '../../mocks/mockUtxo';
import { mockWallet } from '../../mocks/mockWallet';

const wallet = mockWallet();

const DESTINATION = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy';

const composePlan = (): SweepPlan => {
    const destination = validateDestination({
        input: DESTINATION,
        firmwareVersion: [1, 4, 2],
        ownScripts: new Set(),
    });
    if (!destination.success) throw new Error('test destination must be valid');

    const plan = composeSweep({
        utxos: [0, 1].map(addressIndex =>
            mockUtxo({
                txid: (addressIndex + 1).toString(16).padStart(64, '0'),
                amount: '200000',
                path: wallet.getAddressPath({ accountType: 'p2pkh', addressIndex }),
            }),
        ),
        accountType: 'p2pkh',
        destination: destination.payload,
        firmwareVersion: [1, 4, 2],
        usedAmounts: new Set(),
        getRandomInt: () => 3,
    });
    if (!plan.success) throw new Error('test plan must compose');

    return plan.payload;
};

// The transaction a device would return for the plan, open to tampering by the test.
const signedTransaction = (
    plan: SweepPlan,
    tamper: (transaction: Transaction) => void = () => {},
) => {
    const transaction = new Transaction({ network: BITCOIN_NETWORK });
    plan.inputs.forEach(input => {
        transaction.ins.push({
            hash: bufferUtils.reverseBuffer(Buffer.from(input.prev_hash, 'hex')),
            index: input.prev_index,
            script: Buffer.alloc(107, 0x30),
            sequence: 0xffffffff,
            witness: [],
        });
    });
    transaction.outs.push({ script: plan.destination.script, value: plan.amount });
    tamper(transaction);

    return transaction.toHex();
};

describe('verifySignedSweep', () => {
    it('accepts the transaction that was composed', () => {
        const plan = composePlan();
        const serializedTx = signedTransaction(plan);

        expect(verifySignedSweep({ serializedTx, plan })).toEqual({
            success: true,
            payload: {
                hex: serializedTx,
                txid: Transaction.fromHex(serializedTx, { network: BITCOIN_NETWORK }).getId(),
            },
        });
    });

    it('accepts a plan whose output is typed PAYTOSCRIPTHASH for old firmware', () => {
        const plan = composePlan();

        expect(plan.output.script_type).toBe('PAYTOSCRIPTHASH');
        expect(verifySignedSweep({ serializedTx: signedTransaction(plan), plan }).success).toBe(
            true,
        );
    });

    it.each<[string, (transaction: Transaction) => void]>([
        [
            'a second output',
            transaction => {
                transaction.outs.push({ script: Buffer.from('6a', 'hex'), value: '0' });
            },
        ],
        [
            'an output paying another script',
            transaction => {
                transaction.outs[0]!.script = wallet.getScript({ accountType: 'p2pkh' });
            },
        ],
        [
            'an output with another amount',
            transaction => {
                transaction.outs[0]!.value = '1';
            },
        ],
        [
            'no output at all',
            transaction => {
                transaction.outs.length = 0;
            },
        ],
        [
            'a missing input',
            transaction => {
                transaction.ins.pop();
            },
        ],
        [
            'an input spending another outpoint',
            transaction => {
                transaction.ins[0]!.index = 5;
            },
        ],
        [
            'inputs in another order',
            transaction => {
                transaction.ins.reverse();
            },
        ],
        [
            'an input with a non-final sequence',
            transaction => {
                transaction.ins[1]!.sequence = 0xfffffffd;
            },
        ],
        [
            'an input without a signature',
            transaction => {
                transaction.ins[0]!.script = Buffer.alloc(0);
            },
        ],
        [
            'another version',
            transaction => {
                transaction.version = 2;
            },
        ],
        [
            'a lock time',
            transaction => {
                transaction.locktime = 800000;
            },
        ],
    ])('rejects a transaction with %s', (_description, tamper) => {
        const plan = composePlan();

        expect(
            verifySignedSweep({ serializedTx: signedTransaction(plan, tamper), plan }),
        ).toMatchObject({ success: false, error: { type: 'signed-transaction-invalid' } });
    });

    it('rejects bytes that are not a transaction', () => {
        expect(verifySignedSweep({ serializedTx: 'deadbeef', plan: composePlan() })).toMatchObject({
            success: false,
            error: { type: 'signed-transaction-invalid' },
        });
    });
});
