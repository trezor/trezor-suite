import { composeTx } from '../src/compose';
import type {
    ComposeChangeAddress,
    ComposeInput,
    ComposeOutput,
    ComposeRequest,
} from '../src/compose/types';

const convertAddress = (_address: string) => ({ length: 25 });

const UTXO: ComposeInput = {
    coinbase: false,
    own: true,
    confirmations: 100,
    vout: 0,
    txid: 'b4dc0ffeee',
    amount: '102001',
};

type AnyComposeRequest = ComposeRequest<ComposeInput, ComposeOutput, ComposeChangeAddress>;

const BASE_REQUEST: Omit<AnyComposeRequest, 'outputs'> = {
    utxos: [UTXO],
    feeRate: '10',
    changeAddress: { address: 'change-addr' },
    dustThreshold: 546,
    sortingStrategy: 'bip69',
    convertAddress,
};

describe('composeTx', () => {
    it('builds a simple tx without change', () => {
        const tx = composeTx({
            ...BASE_REQUEST,
            outputs: [
                {
                    type: 'payment',
                    address: 'recipient',
                    amount: '100000',
                },
            ],
        });

        expect(tx.type).toBe('final');
        if (tx.type !== 'final') return;
        expect(tx.fee).toBe('2001');
        expect(tx.inputs).toHaveLength(1);
        expect(tx.outputs).toHaveLength(1);
        expect(tx.outputs[0]).toMatchObject({ type: 'payment', amount: '100000' });
    });

    it('builds a tx with change', () => {
        const tx = composeTx({
            ...BASE_REQUEST,
            utxos: [{ ...UTXO, amount: '200000' }],
            outputs: [
                {
                    type: 'payment',
                    address: 'recipient',
                    amount: '100000',
                },
            ],
        });

        expect(tx.type).toBe('final');
        if (tx.type !== 'final') return;
        expect(tx.inputs).toHaveLength(1);
        expect(tx.outputs).toHaveLength(2);
        const changeOutput = tx.outputs.find(o => o.type === 'change');
        expect(changeOutput).toBeDefined();
    });

    it('returns error for insufficient funds', () => {
        const tx = composeTx({
            ...BASE_REQUEST,
            outputs: [
                {
                    type: 'payment',
                    address: 'recipient',
                    amount: '500000',
                },
            ],
        });

        expect(tx).toEqual({ type: 'error', error: 'NOT-ENOUGH-FUNDS' });
    });

    it('handles send-max output', () => {
        const tx = composeTx({
            ...BASE_REQUEST,
            outputs: [
                {
                    type: 'send-max',
                    address: 'recipient',
                },
            ],
        });

        expect(tx.type).toBe('final');
        if (tx.type !== 'final') return;
        expect(tx.max).toBeDefined();
        expect(tx.outputs).toHaveLength(1);
        expect(tx.outputs[0]).toMatchObject({ type: 'payment' });
    });

    it('handles send-max-noaddress (nonfinal)', () => {
        const tx = composeTx({
            ...BASE_REQUEST,
            outputs: [
                {
                    type: 'send-max-noaddress',
                },
            ],
        });

        expect(tx.type).toBe('nonfinal');
        if (tx.type !== 'nonfinal') return;
        expect(tx.max).toBeDefined();
    });

    it('handles payment-noaddress (nonfinal)', () => {
        const tx = composeTx({
            ...BASE_REQUEST,
            outputs: [
                {
                    type: 'payment-noaddress',
                    amount: '100000',
                },
            ],
        });

        expect(tx.type).toBe('nonfinal');
        if (tx.type !== 'nonfinal') return;
        expect(tx.inputs).toHaveLength(1);
    });

    it('returns error for missing utxos', () => {
        const tx = composeTx({
            ...BASE_REQUEST,
            utxos: [],
            outputs: [
                {
                    type: 'payment',
                    address: 'recipient',
                    amount: '100000',
                },
            ],
        });

        expect(tx).toEqual({ type: 'error', error: 'MISSING-UTXOS' });
    });

    it('returns error for missing outputs', () => {
        const tx = composeTx({
            ...BASE_REQUEST,
            outputs: [],
        });

        expect(tx).toEqual({ type: 'error', error: 'MISSING-OUTPUTS' });
    });

    it('returns error for invalid fee rate', () => {
        const tx = composeTx({
            ...BASE_REQUEST,
            feeRate: '0',
            outputs: [
                {
                    type: 'payment',
                    address: 'recipient',
                    amount: '100000',
                },
            ],
        });

        expect(tx).toEqual({ type: 'error', error: 'INCORRECT-FEE-RATE' });
    });

    it('handles opreturn output', () => {
        const tx = composeTx({
            ...BASE_REQUEST,
            convertOpReturn: (dataHex: string) => ({ length: 2 + dataHex.length / 2 }),
            outputs: [
                {
                    type: 'payment',
                    address: 'recipient',
                    amount: '90000',
                },
                {
                    type: 'opreturn',
                    dataHex: 'deadbeef',
                },
            ],
        });

        expect(tx.type).toBe('final');
        if (tx.type !== 'final') return;
        // 2 requested outputs + 1 change output (remainder > dust)
        expect(tx.outputs).toHaveLength(3);
        expect(tx.outputs.find(o => o.type === 'opreturn')).toBeDefined();
        expect(tx.outputs.find(o => o.type === 'payment')).toBeDefined();
        expect(tx.outputs.find(o => o.type === 'change')).toBeDefined();
    });

    it('handles multiple inputs', () => {
        const tx = composeTx({
            ...BASE_REQUEST,
            utxos: [
                { ...UTXO, amount: '50000' },
                { ...UTXO, txid: 'aabbccddee', amount: '60000' },
            ],
            outputs: [
                {
                    type: 'payment',
                    address: 'recipient',
                    amount: '100000',
                },
            ],
        });

        expect(tx.type).toBe('final');
        if (tx.type !== 'final') return;
        expect(tx.inputs.length).toBeGreaterThanOrEqual(1);
    });

    it('handles feePolicy option', () => {
        const tx = composeTx({
            ...BASE_REQUEST,
            feePolicy: 'bitcoin',
            outputs: [
                {
                    type: 'payment',
                    address: 'recipient',
                    amount: '100000',
                },
            ],
        });

        expect(tx.type).toBe('final');
    });
});
