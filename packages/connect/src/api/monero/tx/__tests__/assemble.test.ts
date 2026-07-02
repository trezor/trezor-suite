import { type SignedTransactionResult, assembleSignedTransaction } from '../assemble';
import { bytesToHex } from '../hex';
import { writeBulletproofPlus, writeClsag } from '../rct';
import { ByteReader, ByteWriter } from '../serialize';
import { readTransaction, writeTxOut } from '../transaction';
import { TX_HF15_HEX } from './fixtures/txHf15';

const hexToBytes = (hex: string) => Uint8Array.from(Buffer.from(hex, 'hex'));
const serialize = (fn: (w: ByteWriter) => void): string => {
    const writer = new ByteWriter();
    fn(writer);

    return bytesToHex(writer.toUint8Array());
};

describe('assembleSignedTransaction', () => {
    // Deconstruct a real signed HF15 transaction into the pieces the device returns. `outPk` maps each
    // serialized commitment to the device's out_pk shape (overridden below to test the 64-byte ctkey).
    const deviceShapedTx = (outPk: (commitment: Uint8Array) => string) => {
        const tx = readTransaction(new ByteReader(hexToBytes(TX_HF15_HEX)));
        const { prefix, rctSig } = tx;
        if (!rctSig) {
            throw new Error('fixture is not a RingCT transaction');
        }

        const ringSize = prefix.vin[0]!.type === 'key' ? prefix.vin[0]!.keyOffsets.length : 0;

        const result: SignedTransactionResult = {
            signatures: rctSig.prunable.clsags.map(clsag => serialize(w => writeClsag(w, clsag))),
            rv: { rv_type: rctSig.base.type, txn_fee: Number(rctSig.base.txnFee) },
            pseudo_outs: rctSig.prunable.pseudoOuts.map(bytesToHex),
            out_pks: rctSig.base.outPk.map(outPk),
            ecdh_infos: rctSig.base.ecdhInfo.map(bytesToHex),
            tx_outs: prefix.vout.map(out => serialize(w => writeTxOut(w, out))),
            rsig_parts: rctSig.prunable.bulletproofsPlus.map(bp =>
                serialize(w => writeBulletproofPlus(w, bp)),
            ),
            extra: bytesToHex(prefix.extra),
        };

        const context = {
            unlockTime: Number(prefix.unlockTime),
            vin: prefix.vin.map(input => {
                if (input.type !== 'key') {
                    throw new Error('unexpected coinbase input');
                }

                return { keyOffsets: input.keyOffsets.map(Number), keyImage: input.keyImage };
            }),
            ringSize,
        };

        return { result, context };
    };

    // Feed the device pieces to the assembler and require it reconstructs the exact original tx. This
    // validates the full assembly + serialization path offline (device/monerod confirm formats live).
    it('reconstructs a real HF15 transaction from device-shaped pieces', () => {
        const { result, context } = deviceShapedTx(bytesToHex);

        expect(assembleSignedTransaction(result, context)).toBe(TX_HF15_HEX);
    });

    // The real device returns out_pk as a 64-byte ctkey (dest || commitment); only the commitment is
    // serialized. Prepending a dummy 32-byte dest must yield the identical tx, proving the assembler
    // drops the dest half and keeps the commitment half.
    it('trims the device’s 64-byte ctkey out_pk to its commitment', () => {
        const { result, context } = deviceShapedTx(
            commitment => '00'.repeat(32) + bytesToHex(commitment),
        );

        expect(assembleSignedTransaction(result, context)).toBe(TX_HF15_HEX);
    });

    const emptyResult = (rv: { rv_type?: number; txn_fee?: number }): SignedTransactionResult => ({
        signatures: [],
        rv,
        pseudo_outs: [],
        out_pks: [],
        ecdh_infos: [],
        tx_outs: [],
        rsig_parts: [],
        extra: '',
    });
    const emptyContext = { unlockTime: 0, ringSize: 16, vin: [] };

    // A missing rv_type used to default to RctType.Null, silently dropping every signature and
    // commitment; it must now fail fast instead.
    it('rejects a device result with a missing/non-BulletproofPlus rv_type', () => {
        expect(() => assembleSignedTransaction(emptyResult({}), emptyContext)).toThrow(
            'unexpected RingCT type',
        );
    });

    it('rejects a device result with no txn_fee', () => {
        expect(() => assembleSignedTransaction(emptyResult({ rv_type: 6 }), emptyContext)).toThrow(
            'no txn_fee',
        );
    });
});
