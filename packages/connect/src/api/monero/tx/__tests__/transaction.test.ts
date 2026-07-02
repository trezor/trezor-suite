import { ByteReader, ByteWriter } from '../serialize';
import {
    readTransaction,
    readTransactionPrefix,
    writeTransaction,
    writeTransactionPrefix,
} from '../transaction';
import { TX_HF15_HEX } from './fixtures/txHf15';

const hexToBytes = (hex: string) => Uint8Array.from(Buffer.from(hex, 'hex'));
const bytesToHex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');

describe('monero TransactionPrefix serialization', () => {
    // The golden tx_hex is a full HF15 transaction (prefix + RingCT). We parse only the prefix and
    // re-serialize it; the bytes the reader consumed must match the bytes the writer produces.
    const full = hexToBytes(TX_HF15_HEX);

    it('round-trips the prefix of a real HF15 transaction byte-for-byte', () => {
        const reader = new ByteReader(full);
        const before = reader.remaining;
        const prefix = readTransactionPrefix(reader);
        const consumed = before - reader.remaining;

        const writer = new ByteWriter();
        writeTransactionPrefix(writer, prefix);

        expect(bytesToHex(writer.toUint8Array())).toBe(bytesToHex(full.subarray(0, consumed)));
    });

    it('decodes the expected prefix shape', () => {
        const prefix = readTransactionPrefix(new ByteReader(full));

        expect(prefix.version).toBe(2n); // RingCT v2
        expect(prefix.unlockTime).toBe(0n);
        // Real HF15 tx: 4 ring inputs, ring size 16, view-tagged-key outputs.
        expect(prefix.vin).toHaveLength(4);
        expect(prefix.vout.length).toBeGreaterThanOrEqual(2);

        for (const input of prefix.vin) {
            expect(input.type).toBe('key');
            if (input.type === 'key') {
                expect(input.amount).toBe(0n); // RingCT hides the amount
                expect(input.keyOffsets).toHaveLength(16);
                expect(input.keyImage).toHaveLength(32);
            }
        }

        // This particular capture uses plain txout_to_key (the tagged-key path is covered by the
        // synthetic round-trip below).
        for (const output of prefix.vout) {
            expect(output.amount).toBe(0n);
            expect(output.target.type).toBe('key');
            expect(output.target.key).toHaveLength(32);
        }
    });

    it('round-trips tagged-key outputs and txin_gen (synthetic)', () => {
        const key = (fill: number) => new Uint8Array(32).fill(fill);
        const prefix = {
            version: 2n,
            unlockTime: 123n,
            vin: [
                { type: 'gen' as const, height: 1_000_000n },
                {
                    type: 'key' as const,
                    amount: 0n,
                    keyOffsets: [5n, 200n, 16_384n],
                    keyImage: key(0xab),
                },
            ],
            vout: [
                {
                    amount: 0n,
                    target: { type: 'taggedKey' as const, key: key(0xcd), viewTag: 0x7f },
                },
                { amount: 7n, target: { type: 'key' as const, key: key(0xef) } },
            ],
            extra: Uint8Array.from([0x01, 0x02, 0x03]),
        };

        const writer = new ByteWriter();
        writeTransactionPrefix(writer, prefix);
        const decoded = readTransactionPrefix(new ByteReader(writer.toUint8Array()));

        const reWriter = new ByteWriter();
        writeTransactionPrefix(reWriter, decoded);
        expect(bytesToHex(reWriter.toUint8Array())).toBe(bytesToHex(writer.toUint8Array()));
        expect(decoded.vout[0]?.target.type).toBe('taggedKey');
        expect(decoded.vin[0]?.type).toBe('gen');
    });
});

describe('monero full Transaction serialization (prefix + RingCT BulletproofPlus)', () => {
    const full = hexToBytes(TX_HF15_HEX);

    it('round-trips a complete HF15 transaction byte-for-byte', () => {
        const tx = readTransaction(new ByteReader(full));

        const writer = new ByteWriter();
        writeTransaction(writer, tx);

        // The whole 3712-byte transaction must re-serialize identically.
        expect(bytesToHex(writer.toUint8Array())).toBe(bytesToHex(full));
    });

    it('decodes the RingCT BulletproofPlus structure', () => {
        const { rctSig } = readTransaction(new ByteReader(full));

        expect(rctSig).toBeDefined();
        expect(rctSig?.base.type).toBe(6); // BulletproofPlus
        expect(rctSig?.base.txnFee).toBeGreaterThan(0n);
        expect(rctSig?.base.ecdhInfo).toHaveLength(3); // per output
        expect(rctSig?.base.outPk).toHaveLength(3);
        expect(rctSig?.prunable.bulletproofsPlus).toHaveLength(1);
        expect(rctSig?.prunable.clsags).toHaveLength(4); // per input
        expect(rctSig?.prunable.pseudoOuts).toHaveLength(4);
        // Each CLSAG has ring-size (16) scalars.
        expect(rctSig?.prunable.clsags[0]?.s).toHaveLength(16);
    });
});
