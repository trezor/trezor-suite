import * as varuint from 'varuint-bitcoin';

import { verifyTxBytes } from './compose.utils';
import { toOutputScript } from '../src/address';
import { composeTx } from '../src/compose';
import * as NETWORKS from '../src/networks';
import { Transaction } from '../src/transaction';
import { type ComposeRequest } from '../src/types';

const MAGIC = Buffer.from('70736274ff', 'hex');
const UNSIGNED_TX_KEY = Buffer.from([0x00]);

const PAYMENT_ADDRESS = '1BitcoinEaterAddressDontSendf59kuE';
const CHANGE_ADDRESS = '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT';
const SECOND_PAYMENT_ADDRESS = '1LetUsDestroyBitcoinTogether398Nrg';

const UTXO = {
    amount: '102001',
    coinbase: false,
    confirmations: 100,
    own: true,
    txid: 'b4dc0ffeee',
    vout: 0,
};

const UTXO_2 = {
    ...UTXO,
    txid: 'a4dc0ffeee',
    vout: 1,
};

function toVarSlice(buffer: Buffer) {
    const length = varuint.encodingLength(buffer.length);
    const result = Buffer.allocUnsafe(length + buffer.length);

    varuint.encode(buffer.length, result, 0);
    buffer.copy(result, length);

    return result;
}

function getSimplePsbtBuffer(unsignedTxHex: string, inputCount: number, outputCount: number) {
    const unsignedTx = Buffer.from(unsignedTxHex, 'hex');
    const globalUnsignedTx = Buffer.concat([toVarSlice(UNSIGNED_TX_KEY), toVarSlice(unsignedTx)]);

    return Buffer.concat([
        MAGIC,
        globalUnsignedTx,
        Buffer.from([0x00]),
        ...Array.from({ length: inputCount + outputCount }, () => Buffer.from([0x00])),
    ]);
}

function getUnsignedTxHex() {
    const tx = new Transaction({ network: NETWORKS.bitcoin });

    tx.ins.push({
        hash: Buffer.alloc(32, 1),
        index: 0,
        script: Buffer.alloc(0),
        sequence: 0xffffffff,
        witness: [],
    });

    tx.outs.push({
        script: toOutputScript(PAYMENT_ADDRESS, NETWORKS.bitcoin),
        value: '30000',
    });
    tx.outs.push({
        script: toOutputScript(CHANGE_ADDRESS, NETWORKS.bitcoin),
        value: '49401',
    });
    tx.outs.push({
        script: toOutputScript(SECOND_PAYMENT_ADDRESS, NETWORKS.bitcoin),
        value: '20000',
    });

    return tx.toHex();
}

function createUnsignedTxHex(outputs: Array<{ address: string; amount: string }>) {
    const tx = new Transaction({ network: NETWORKS.bitcoin });

    tx.ins.push({
        hash: Buffer.alloc(32, 1),
        index: 0,
        script: Buffer.alloc(0),
        sequence: 0xffffffff,
        witness: [],
    });

    outputs.forEach(output => {
        tx.outs.push({
            script: toOutputScript(output.address, NETWORKS.bitcoin),
            value: output.amount,
        });
    });

    return tx.toHex();
}

function createRequest({
    outputs = [],
    psbtData,
    utxos = [UTXO],
}: {
    outputs?: ComposeRequest<any, any, any>['outputs'];
    psbtData: ComposeRequest<any, any, any>['psbtData'];
    utxos?: ComposeRequest<any, any, any>['utxos'];
}): ComposeRequest<any, any, any> {
    return {
        changeAddress: {
            address: CHANGE_ADDRESS,
            path: [44, 1, 1, 0],
        },
        dustThreshold: 546,
        feeRate: '10',
        network: NETWORKS.bitcoin,
        outputs,
        psbtData,
        sortingStrategy: 'bip69',
        utxos,
    };
}

describe('composeTx with PSBT data', () => {
    it('replaces excluded PSBT change output and keeps PSBT output order', () => {
        const unsignedTxHex = getUnsignedTxHex();
        const psbtData = {
            addresses: [],
            transactionData: getSimplePsbtBuffer(unsignedTxHex, 1, 3).toString('hex'),
        };

        const request = createRequest({
            psbtData,
        });

        const tx = composeTx(request);

        expect(tx).toMatchObject({
            bytes: 260,
            fee: '2600',
            feePerByte: '10',
            inputs: [UTXO],
            outputs: [
                {
                    address: PAYMENT_ADDRESS,
                    amount: '30000',
                    type: 'payment',
                },
                {
                    address: CHANGE_ADDRESS,
                    amount: '49401',
                    path: [44, 1, 1, 0],
                    type: 'change',
                },
                {
                    address: SECOND_PAYMENT_ADDRESS,
                    amount: '20000',
                    type: 'payment',
                },
            ],
            outputsPermutation: [0, 1, 2],
            totalSpent: '52600',
            type: 'final',
        });

        if (tx.type !== 'final') {
            throw new Error('Expected a final compose result.');
        }

        verifyTxBytes(tx, 'p2pkh', NETWORKS.bitcoin);
    });

    it('recalculates fee and change when multiple inputs exceed unsigned transaction amount', () => {
        const unsignedTxHex = createUnsignedTxHex([
            { address: PAYMENT_ADDRESS, amount: '100000' },
            { address: CHANGE_ADDRESS, amount: '1000' },
            { address: SECOND_PAYMENT_ADDRESS, amount: '20000' },
        ]);
        const psbtData = {
            addresses: [],
            transactionData: getSimplePsbtBuffer(unsignedTxHex, 1, 3).toString('hex'),
        };

        const tx = composeTx(
            createRequest({
                psbtData,
                utxos: [UTXO, UTXO_2],
            }),
        );

        expect(tx).toMatchObject({
            bytes: 408,
            fee: '4080',
            feePerByte: '10',
            inputs: [UTXO_2, UTXO],
            outputs: [
                {
                    address: PAYMENT_ADDRESS,
                    amount: '100000',
                    type: 'payment',
                },
                {
                    address: CHANGE_ADDRESS,
                    amount: '79922',
                    path: [44, 1, 1, 0],
                    type: 'change',
                },
                {
                    address: SECOND_PAYMENT_ADDRESS,
                    amount: '20000',
                    type: 'payment',
                },
            ],
            outputsPermutation: [0, 1, 2],
            totalSpent: '124080',
            type: 'final',
        });

        if (tx.type !== 'final') {
            throw new Error('Expected a final compose result.');
        }

        verifyTxBytes(tx, 'p2pkh', NETWORKS.bitcoin);
    });

    it('returns not-enough-funds when PSBT-backed outputs exceed available inputs', () => {
        const unsignedTxHex = createUnsignedTxHex([
            { address: PAYMENT_ADDRESS, amount: '100000' },
            { address: CHANGE_ADDRESS, amount: '1000' },
            { address: SECOND_PAYMENT_ADDRESS, amount: '20000' },
        ]);
        const psbtData = {
            addresses: [],
            transactionData: getSimplePsbtBuffer(unsignedTxHex, 1, 3).toString('hex'),
        };

        expect(
            composeTx(
                createRequest({
                    psbtData,
                }),
            ),
        ).toEqual({
            error: 'NOT-ENOUGH-FUNDS',
            type: 'error',
        });
    });

    it('returns error for invalid PSBT data', () => {
        expect(
            composeTx(
                createRequest({
                    psbtData: {
                        addresses: [],
                        transactionData: '00',
                    },
                }),
            ),
        ).toEqual({
            error: 'COINSELECT',
            message: 'Cannot read slice out of bounds',
            type: 'error',
        });
    });

    it('returns error when multiple PSBT change outputs match the request', () => {
        const unsignedTxHex = createUnsignedTxHex([
            { address: PAYMENT_ADDRESS, amount: '30000' },
            { address: CHANGE_ADDRESS, amount: '1000' },
            { address: CHANGE_ADDRESS, amount: '2000' },
        ]);
        const psbtData = {
            addresses: [],
            transactionData: getSimplePsbtBuffer(unsignedTxHex, 1, 3).toString('hex'),
        };

        expect(
            composeTx(
                createRequest({
                    psbtData,
                }),
            ),
        ).toEqual({
            error: 'INCORRECT-OUTPUT',
            message: 'Multiple PSBT change outputs are not supported.',
            type: 'error',
        });
    });

    it('excludes a PSBT account-owned output even when it is not the selected change address', () => {
        const unsignedTxHex = createUnsignedTxHex([
            { address: PAYMENT_ADDRESS, amount: '30000' },
            { address: SECOND_PAYMENT_ADDRESS, amount: '1000' },
        ]);
        const psbtData = {
            addresses: [{ address: SECOND_PAYMENT_ADDRESS }],
            transactionData: getSimplePsbtBuffer(unsignedTxHex, 1, 2).toString('hex'),
        };

        const result = composeTx(
            createRequest({
                psbtData,
            }),
        );

        expect(result.type).toBe('final');
        if (result.type !== 'final') {
            throw new Error('Expected a final compose result.');
        }

        expect(result.outputs).toMatchObject([
            {
                address: PAYMENT_ADDRESS,
                amount: '30000',
                type: 'payment',
            },
            {
                address: CHANGE_ADDRESS,
                type: 'change',
            },
        ]);
    });
});
