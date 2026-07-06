// Monero RingCT signature serialization (RctSigBase + RctSigPrunable).
//
// Ported from ph4r05/monero-serialize (xmrtypes.py serialize_rctsig_base / serialize_rctsig_prunable).
// Scope: RCTTypeBulletproofPlus (6) — the current consensus type and what a Trezor produces. Null
// (0, coinbase / no rct) is also handled. Other historical types throw, because this serializer is
// only ever used to assemble our OWN outgoing transactions, which are always BulletproofPlus.
//
// Critical layout rule (per the reference comments): ecdhInfo, outPk, CLSAGs and pseudoOuts carry
// NO length prefix — their sizes are implied by the prefix (#outputs, #inputs) and the ring size
// (mixin + 1). Only `bulletproofs_plus` and the L/R vectors inside it are length-prefixed.
import { type ByteReader, type ByteWriter, readUVarint, writeUVarint } from './serialize';

const KEY_SIZE = 32;
const ECDH_AMOUNT_SIZE = 8; // Hash8 — encrypted amount for Bulletproof2/CLSAG/BulletproofPlus

export const RctType = {
    Null: 0,
    BulletproofPlus: 6,
} as const;

export interface BulletproofPlus {
    A: Uint8Array;
    A1: Uint8Array;
    B: Uint8Array;
    r1: Uint8Array;
    s1: Uint8Array;
    d1: Uint8Array;
    L: Uint8Array[];
    R: Uint8Array[];
}

export interface Clsag {
    s: Uint8Array[]; // mixin + 1 scalars
    c1: Uint8Array;
    D: Uint8Array;
}

export interface RctSigBase {
    type: number;
    txnFee: bigint;
    ecdhInfo: Uint8Array[]; // per output, 8-byte encrypted amount
    outPk: Uint8Array[]; // per output, 32-byte commitment mask
}

export interface RctSigPrunable {
    bulletproofsPlus: BulletproofPlus[];
    clsags: Clsag[]; // per input
    pseudoOuts: Uint8Array[]; // per input, 32 bytes
}

export interface RctSig {
    base: RctSigBase;
    prunable: RctSigPrunable;
}

/** Sizes implied by the transaction prefix, needed to (de)serialize the prefix-free rct arrays. */
export interface RctDimensions {
    inputs: number;
    outputs: number;
    mixin: number; // ring size - 1
}

const writeKey = (writer: ByteWriter, key: Uint8Array, size = KEY_SIZE): void => {
    if (key.length !== size) {
        throw new Error(`expected ${size}-byte value, got ${key.length}`);
    }
    writer.writeBytes(key);
};

const writeKeyVector = (writer: ByteWriter, keys: Uint8Array[]): void => {
    writeUVarint(writer, BigInt(keys.length));
    for (const key of keys) {
        writeKey(writer, key);
    }
};

const readKeyVector = (reader: ByteReader): Uint8Array[] => {
    const count = Number(readUVarint(reader));
    const keys: Uint8Array[] = [];
    for (let i = 0; i < count; i++) {
        keys.push(reader.readBytes(KEY_SIZE));
    }

    return keys;
};

const assertBulletproofPlusOrNull = (type: number): void => {
    if (type !== RctType.Null && type !== RctType.BulletproofPlus) {
        throw new Error(
            `Unsupported RCT type ${type}; only BulletproofPlus (6) outgoing transactions are serialized`,
        );
    }
};

export const writeRctSigBase = (
    writer: ByteWriter,
    base: RctSigBase,
    { outputs }: RctDimensions,
): void => {
    assertBulletproofPlusOrNull(base.type);
    writer.writeByte(base.type & 0xff);
    if (base.type === RctType.Null) {
        return;
    }
    writeUVarint(writer, base.txnFee);
    // BulletproofPlus keeps pseudoOuts in the prunable part, so the base has none here.
    if (base.ecdhInfo.length !== outputs || base.outPk.length !== outputs) {
        throw new Error('rct base ecdhInfo/outPk size must equal number of outputs');
    }
    for (const amount of base.ecdhInfo) {
        writeKey(writer, amount, ECDH_AMOUNT_SIZE);
    }
    for (const mask of base.outPk) {
        writeKey(writer, mask);
    }
};

export const readRctSigBase = (reader: ByteReader, { outputs }: RctDimensions): RctSigBase => {
    const type = reader.readByte();
    assertBulletproofPlusOrNull(type);
    if (type === RctType.Null) {
        return { type, txnFee: 0n, ecdhInfo: [], outPk: [] };
    }
    const txnFee = readUVarint(reader);
    const ecdhInfo: Uint8Array[] = [];
    for (let i = 0; i < outputs; i++) {
        ecdhInfo.push(reader.readBytes(ECDH_AMOUNT_SIZE));
    }
    const outPk: Uint8Array[] = [];
    for (let i = 0; i < outputs; i++) {
        outPk.push(reader.readBytes(KEY_SIZE));
    }

    return { type, txnFee, ecdhInfo, outPk };
};

export const writeBulletproofPlus = (writer: ByteWriter, bp: BulletproofPlus): void => {
    writeKey(writer, bp.A);
    writeKey(writer, bp.A1);
    writeKey(writer, bp.B);
    writeKey(writer, bp.r1);
    writeKey(writer, bp.s1);
    writeKey(writer, bp.d1);
    writeKeyVector(writer, bp.L);
    writeKeyVector(writer, bp.R);
};

export const readBulletproofPlus = (reader: ByteReader): BulletproofPlus => ({
    A: reader.readBytes(KEY_SIZE),
    A1: reader.readBytes(KEY_SIZE),
    B: reader.readBytes(KEY_SIZE),
    r1: reader.readBytes(KEY_SIZE),
    s1: reader.readBytes(KEY_SIZE),
    d1: reader.readBytes(KEY_SIZE),
    L: readKeyVector(reader),
    R: readKeyVector(reader),
});

// A single CLSAG signature, serialized as the device emits it: `mixin + 1` (= ring size) scalars
// with NO length prefix, then c1 and D. The ring size is therefore required to parse it.
export const writeClsag = (writer: ByteWriter, clsag: Clsag): void => {
    for (const s of clsag.s) {
        writeKey(writer, s);
    }
    writeKey(writer, clsag.c1);
    writeKey(writer, clsag.D);
};

export const readClsag = (reader: ByteReader, ringSize: number): Clsag => {
    const s: Uint8Array[] = [];
    for (let i = 0; i < ringSize; i++) {
        s.push(reader.readBytes(KEY_SIZE));
    }

    return { s, c1: reader.readBytes(KEY_SIZE), D: reader.readBytes(KEY_SIZE) };
};

export const writeRctSigPrunable = (
    writer: ByteWriter,
    prunable: RctSigPrunable,
    { type, inputs, mixin }: RctDimensions & { type: number },
): void => {
    if (type === RctType.Null) {
        return;
    }
    assertBulletproofPlusOrNull(type);

    // bulletproofs_plus: length-prefixed array.
    writeUVarint(writer, BigInt(prunable.bulletproofsPlus.length));
    for (const bp of prunable.bulletproofsPlus) {
        writeBulletproofPlus(writer, bp);
    }

    // CLSAGs: one per input, NO array length prefix; each `s` has exactly mixin+1 entries (also no
    // prefix), then c1, D.
    if (prunable.clsags.length !== inputs) {
        throw new Error('rct prunable CLSAGs size must equal number of inputs');
    }
    for (const clsag of prunable.clsags) {
        if (clsag.s.length !== mixin + 1) {
            throw new Error('CLSAG.s size must equal ring size (mixin + 1)');
        }
        for (const s of clsag.s) {
            writeKey(writer, s);
        }
        writeKey(writer, clsag.c1);
        writeKey(writer, clsag.D);
    }

    // pseudoOuts: one per input, NO length prefix.
    if (prunable.pseudoOuts.length !== inputs) {
        throw new Error('rct prunable pseudoOuts size must equal number of inputs');
    }
    for (const pseudoOut of prunable.pseudoOuts) {
        writeKey(writer, pseudoOut);
    }
};

export const readRctSigPrunable = (
    reader: ByteReader,
    { type, inputs, mixin }: RctDimensions & { type: number },
): RctSigPrunable => {
    if (type === RctType.Null) {
        return { bulletproofsPlus: [], clsags: [], pseudoOuts: [] };
    }
    assertBulletproofPlusOrNull(type);

    const bppCount = Number(readUVarint(reader));
    const bulletproofsPlus: BulletproofPlus[] = [];
    for (let i = 0; i < bppCount; i++) {
        bulletproofsPlus.push(readBulletproofPlus(reader));
    }

    const clsags: Clsag[] = [];
    for (let i = 0; i < inputs; i++) {
        const s: Uint8Array[] = [];
        for (let j = 0; j < mixin + 1; j++) {
            s.push(reader.readBytes(KEY_SIZE));
        }
        clsags.push({ s, c1: reader.readBytes(KEY_SIZE), D: reader.readBytes(KEY_SIZE) });
    }

    const pseudoOuts: Uint8Array[] = [];
    for (let i = 0; i < inputs; i++) {
        pseudoOuts.push(reader.readBytes(KEY_SIZE));
    }

    return { bulletproofsPlus, clsags, pseudoOuts };
};
