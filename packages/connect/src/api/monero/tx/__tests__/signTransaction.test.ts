import { type SignedTransactionResult } from '../assemble';
import { bytesToHex } from '../hex';
import { type BulletproofPlus, type Clsag, writeBulletproofPlus, writeClsag } from '../rct';
import { type RingOutput } from '../ring';
import { ByteReader, ByteWriter } from '../serialize';
import { signMoneroTransaction } from '../signTransaction';
import { type TxOut, readTransaction, writeTxOut } from '../transaction';

const DONATION =
    '44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A';

const key = (fill: number) => new Uint8Array(32).fill(fill);
const ringOutput = (globalIndex: number, fill: number): RingOutput => ({
    globalIndex,
    dest: key(fill),
    commitment: key(fill + 1),
});

const serialize = (fn: (w: ByteWriter) => void): string => {
    const writer = new ByteWriter();
    fn(writer);

    return bytesToHex(writer.toUint8Array());
};

// A device result sized for 1 input / 2 outputs / ring 16, built so the assembler can parse it.
const buildDeviceResult = (): SignedTransactionResult => {
    const txOut: TxOut = { amount: 0n, target: { type: 'key', key: key(0x55) } };
    const bpp: BulletproofPlus = {
        A: key(1),
        A1: key(2),
        B: key(3),
        r1: key(4),
        s1: key(5),
        d1: key(6),
        L: [key(7), key(8)],
        R: [key(9), key(10)],
    };
    const clsag: Clsag = {
        s: Array.from({ length: 16 }, (_, i) => key(0x20 + i)),
        c1: key(0x80),
        D: key(0x81),
    };

    return {
        signatures: [serialize(w => writeClsag(w, clsag))],
        rv: { rv_type: 6, txn_fee: 10_000_000_000 },
        pseudo_outs: [bytesToHex(key(0x90))],
        out_pks: [bytesToHex(key(0x91)), bytesToHex(key(0x92))],
        ecdh_infos: [bytesToHex(new Uint8Array(8).fill(1)), bytesToHex(new Uint8Array(8).fill(2))],
        tx_outs: [serialize(w => writeTxOut(w, txOut)), serialize(w => writeTxOut(w, txOut))],
        rsig_parts: [serialize(w => writeBulletproofPlus(w, bpp))],
        extra: '',
    };
};

// A device result sized for N inputs / M outputs / ring 16.
const buildDeviceResultMulti = (numInputs: number, numOutputs: number): SignedTransactionResult => {
    const txOut: TxOut = { amount: 0n, target: { type: 'key', key: key(0x55) } };
    const bpp: BulletproofPlus = {
        A: key(1),
        A1: key(2),
        B: key(3),
        r1: key(4),
        s1: key(5),
        d1: key(6),
        L: [key(7), key(8)],
        R: [key(9), key(10)],
    };
    const clsag: Clsag = {
        s: Array.from({ length: 16 }, (_, i) => key(0x20 + i)),
        c1: key(0x80),
        D: key(0x81),
    };

    return {
        signatures: Array.from({ length: numInputs }, () => serialize(w => writeClsag(w, clsag))),
        rv: { rv_type: 6, txn_fee: 10_000_000_000 },
        pseudo_outs: Array.from({ length: numInputs }, (_, i) => bytesToHex(key(0x90 + i))),
        out_pks: Array.from({ length: numOutputs }, (_, i) => bytesToHex(key(0x91 + i))),
        ecdh_infos: Array.from({ length: numOutputs }, (_, i) =>
            bytesToHex(new Uint8Array(8).fill(i + 1)),
        ),
        tx_outs: Array.from({ length: numOutputs }, () => serialize(w => writeTxOut(w, txOut))),
        rsig_parts: [serialize(w => writeBulletproofPlus(w, bpp))],
        extra: '',
    };
};

describe('signMoneroTransaction driver', () => {
    it('composes, signs and assembles into a parseable transaction', async () => {
        let receivedNumInputs = -1;
        const signer = (tsxData: any, inputs: any[]) => {
            receivedNumInputs = tsxData.num_inputs;
            expect(inputs).toHaveLength(1);
            expect(inputs[0].outputs).toHaveLength(16);

            return Promise.resolve(buildDeviceResult());
        };

        const { txHex, tsxData } = await signMoneroTransaction({
            inputs: [
                {
                    amount: 2_000_000_000_000,
                    real: ringOutput(100, 0xaa),
                    decoys: Array.from({ length: 15 }, (_, i) => ringOutput(1000 + i, i + 1)),
                    mask: 'cc'.repeat(32),
                    realOutTxKey: 'dd'.repeat(32),
                    realOutputInTxIndex: 1,
                    subaddrMinor: 0,
                },
            ],
            destinations: [{ address: DONATION, amount: 1_000_000_000_000 }],
            changeAddress: DONATION,
            fee: 10_000_000_000,
            keyImages: [key(0x77)],
            signer,
        });

        expect(receivedNumInputs).toBe(1);
        expect(tsxData.num_inputs).toBe(1);

        // The assembled hex must parse back into a consistent RingCT BulletproofPlus transaction.
        const tx = readTransaction(new ByteReader(Uint8Array.from(Buffer.from(txHex, 'hex'))));
        expect(tx.prefix.vin).toHaveLength(1);
        expect(tx.prefix.vout).toHaveLength(2); // recipient + change
        expect(tx.prefix.vin[0]?.type).toBe('key');
        expect(tx.rctSig?.base.type).toBe(6);
        expect(tx.rctSig?.prunable.clsags[0]?.s).toHaveLength(16);
        expect(tx.rctSig?.prunable.pseudoOuts).toHaveLength(1);
        expect(tx.rctSig?.base.outPk).toHaveLength(2);
    });

    it('requires one key image per input', async () => {
        await expect(
            signMoneroTransaction({
                inputs: [
                    {
                        amount: 2_000_000_000_000,
                        real: ringOutput(100, 0xaa),
                        decoys: Array.from({ length: 15 }, (_, i) => ringOutput(1000 + i, i + 1)),
                        mask: 'cc'.repeat(32),
                        realOutTxKey: 'dd'.repeat(32),
                        realOutputInTxIndex: 1,
                        subaddrMinor: 0,
                    },
                ],
                destinations: [{ address: DONATION, amount: 1_000_000_000_000 }],
                changeAddress: DONATION,
                fee: 10_000_000_000,
                keyImages: [], // mismatch
                signer: () => Promise.resolve(buildDeviceResult()),
            }),
        ).rejects.toThrow('one key image per input');
    });

    it('orders transaction inputs by key image, descending (Monero consensus)', async () => {
        const makeInput = (real: number, fill: number) => ({
            amount: 1_000_000_000_000,
            real: ringOutput(real, fill),
            decoys: Array.from({ length: 15 }, (_, i) => ringOutput(2000 + real + i, fill + i + 1)),
            mask: 'cc'.repeat(32),
            realOutTxKey: 'dd'.repeat(32),
            realOutputInTxIndex: 1,
            subaddrMinor: 0,
        });

        const { txHex } = await signMoneroTransaction({
            inputs: [makeInput(100, 0xaa), makeInput(200, 0x40)],
            destinations: [{ address: DONATION, amount: 1_000_000_000_000 }],
            changeAddress: DONATION,
            fee: 10_000_000_000,
            // Key images deliberately supplied in ASCENDING order; the driver must sort them.
            keyImages: [key(0x10), key(0x90)],
            signer: (_tsxData, inputs) => Promise.resolve(buildDeviceResultMulti(inputs.length, 2)),
        });

        const tx = readTransaction(new ByteReader(Uint8Array.from(Buffer.from(txHex, 'hex'))));
        expect(tx.prefix.vin).toHaveLength(2);
        const keyImageOf = (i: number) => {
            const input = tx.prefix.vin[i];

            return input?.type === 'key' ? input.keyImage[0] : undefined;
        };
        expect(keyImageOf(0)).toBe(0x90);
        expect(keyImageOf(1)).toBe(0x10);
    });
});
