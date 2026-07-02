// Assemble a relayable transaction from the device's moneroSignTransaction result.
//
// The device returns the signed pieces (CLSAG signatures, BulletproofPlus range proofs, output
// commitments, ECDH amounts, serialized outputs, pseudo-outs, extra) plus the RingCT base. The
// host owns the transaction prefix inputs (key offsets from the ring + the key image per input),
// so it stitches everything into a canonical Monero transaction and serializes it for relay.
//
// NOTE: the exact wire format of each device-returned field (e.g. CLSAG / BP+ serialization) is
// confirmed against the device + monerod at runtime (slice 7). The assembly/serialization logic
// itself is validated offline by round-tripping a real signed transaction (see assemble.test.ts).
import { bytesToHex, hexToBytes } from './hex';
import {
    type Clsag,
    type RctSigBase,
    type RctSigPrunable,
    RctType,
    readBulletproofPlus,
    readClsag,
} from './rct';
import { ByteReader, ByteWriter } from './serialize';
import {
    type TransactionPrefix,
    type TxIn,
    type TxOut,
    readTxOut,
    writeTransaction,
} from './transaction';

/** Subset of moneroSignTransaction's result needed to build the transaction. */
export interface SignedTransactionResult {
    signatures: string[]; // serialized CLSAG per input
    rv: { rv_type?: number; txn_fee?: number };
    pseudo_outs: string[];
    out_pks: string[];
    ecdh_infos: string[];
    tx_outs: string[]; // serialized TxOut per output
    rsig_parts: string[]; // serialized BulletproofPlus
    extra?: string;
    tx_prefix_hash?: string; // device's tx prefix hash — diagnostics only, not used in assembly
}

export interface AssembleContext {
    unlockTime: number;
    /** Per input: the ring's relative key offsets and the spent output's key image. */
    vin: { keyOffsets: number[]; keyImage: Uint8Array }[];
    /** Ring size (mixin + 1) — needed to parse the prefix-free CLSAG scalars. */
    ringSize: number;
}

// The device returns each out_pk as a 64-byte ctkey (dest || commitment); the RingCT base serializes
// only the 32-byte commitment (the second half — the dest is the output's one-time key, already in
// vout). Tolerate an already-trimmed 32-byte value so a round-tripped tx assembles unchanged.
const outPkCommitment = (hex: string): Uint8Array => {
    const bytes = hexToBytes(hex);
    if (bytes.length === 64) {
        return bytes.slice(32);
    }
    if (bytes.length === 32) {
        return bytes;
    }
    throw new Error(`assembleSignedTransaction: unexpected out_pk length ${bytes.length}`);
};

export const assembleSignedTransaction = (
    result: SignedTransactionResult,
    context: AssembleContext,
): string => {
    const vin: TxIn[] = context.vin.map(input => ({
        type: 'key',
        amount: 0n, // RingCT inputs always have a zero amount in the prefix
        keyOffsets: input.keyOffsets.map(BigInt),
        keyImage: input.keyImage,
    }));

    // A spend transaction is always BulletproofPlus with a real fee. Defaulting a missing rv_type
    // to 0 (RctType.Null) would silently drop every signature/commitment and serialize a broken
    // tx, so fail fast on a malformed device response instead.
    if (result.rv.rv_type !== RctType.BulletproofPlus) {
        throw new Error(
            `assembleSignedTransaction: unexpected RingCT type ${result.rv.rv_type}; expected BulletproofPlus (${RctType.BulletproofPlus})`,
        );
    }
    if (result.rv.txn_fee === undefined) {
        throw new Error('assembleSignedTransaction: device returned no txn_fee');
    }

    const vout: TxOut[] = result.tx_outs.map(hex => readTxOut(new ByteReader(hexToBytes(hex))));

    const prefix: TransactionPrefix = {
        version: 2n,
        unlockTime: BigInt(context.unlockTime),
        vin,
        vout,
        extra: result.extra ? hexToBytes(result.extra) : new Uint8Array(0),
    };

    const base: RctSigBase = {
        type: result.rv.rv_type,
        txnFee: BigInt(result.rv.txn_fee),
        ecdhInfo: result.ecdh_infos.map(hexToBytes),
        outPk: result.out_pks.map(outPkCommitment),
    };

    const clsags: Clsag[] = result.signatures.map(hex =>
        readClsag(new ByteReader(hexToBytes(hex)), context.ringSize),
    );

    const prunable: RctSigPrunable = {
        bulletproofsPlus: result.rsig_parts.map(hex =>
            readBulletproofPlus(new ByteReader(hexToBytes(hex))),
        ),
        clsags,
        pseudoOuts: result.pseudo_outs.map(hexToBytes),
    };

    const writer = new ByteWriter();
    writeTransaction(writer, { prefix, rctSig: { base, prunable } });

    return bytesToHex(writer.toUint8Array());
};
