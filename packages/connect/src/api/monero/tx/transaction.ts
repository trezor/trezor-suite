// Monero transaction structures + serialization.
//
// Ported from ph4r05/monero-serialize (xmrtypes.py) using the binary model confirmed in
// xmrserialize.py:
//   - MessageType  -> fields serialized in declared order
//   - UVarintType  -> uvarint
//   - ContainerType-> uvarint(count) followed by each element (unless fixed-size)
//   - VariantType  -> 1-byte tag (the variant's VARIANT_CODE) followed by the variant body
//   - ECKey / KeyImage / Hash -> 32 raw bytes, ViewTag -> 1 byte
//
// This module currently covers the TransactionPrefix (version, unlock_time, vin, vout, extra).
// The RingCT signature part (RctSigBase + RctSigPrunable) is added on top of these primitives.
import {
    type RctDimensions,
    type RctSig,
    readRctSigBase,
    readRctSigPrunable,
    writeRctSigBase,
    writeRctSigPrunable,
} from './rct';
import { type ByteReader, type ByteWriter, readUVarint, writeUVarint } from './serialize';

const KEY_SIZE = 32;

// Variant tags (VARIANT_CODE in xmrtypes.py).
const TXIN_GEN_TAG = 0xff;
const TXIN_TO_KEY_TAG = 0x02;
const TXOUT_TO_KEY_TAG = 0x02;
const TXOUT_TO_TAGGED_KEY_TAG = 0x03;

export interface TxinToKey {
    type: 'key';
    amount: bigint;
    keyOffsets: bigint[]; // relative output offsets (the ring)
    keyImage: Uint8Array; // 32 bytes
}

export interface TxinGen {
    type: 'gen';
    height: bigint;
}

export type TxIn = TxinToKey | TxinGen;

export interface TxoutToKey {
    type: 'key';
    key: Uint8Array; // 32 bytes
}

export interface TxoutToTaggedKey {
    type: 'taggedKey';
    key: Uint8Array; // 32 bytes
    viewTag: number; // 1 byte
}

export type TxoutTarget = TxoutToKey | TxoutToTaggedKey;

export interface TxOut {
    amount: bigint;
    target: TxoutTarget;
}

export interface TransactionPrefix {
    version: bigint;
    unlockTime: bigint;
    vin: TxIn[];
    vout: TxOut[];
    extra: Uint8Array;
}

const writeKey = (writer: ByteWriter, key: Uint8Array): void => {
    if (key.length !== KEY_SIZE) {
        throw new Error(`Monero key must be ${KEY_SIZE} bytes, got ${key.length}`);
    }
    writer.writeBytes(key);
};

const writeTxIn = (writer: ByteWriter, input: TxIn): void => {
    if (input.type === 'gen') {
        writer.writeByte(TXIN_GEN_TAG);
        writeUVarint(writer, input.height);

        return;
    }
    writer.writeByte(TXIN_TO_KEY_TAG);
    writeUVarint(writer, input.amount);
    writeUVarint(writer, BigInt(input.keyOffsets.length));
    for (const offset of input.keyOffsets) {
        writeUVarint(writer, offset);
    }
    writeKey(writer, input.keyImage);
};

const readTxIn = (reader: ByteReader): TxIn => {
    const tag = reader.readByte();
    if (tag === TXIN_GEN_TAG) {
        return { type: 'gen', height: readUVarint(reader) };
    }
    if (tag === TXIN_TO_KEY_TAG) {
        const amount = readUVarint(reader);
        const count = Number(readUVarint(reader));
        const keyOffsets: bigint[] = [];
        for (let i = 0; i < count; i++) {
            keyOffsets.push(readUVarint(reader));
        }

        return { type: 'key', amount, keyOffsets, keyImage: reader.readBytes(KEY_SIZE) };
    }
    throw new Error(`Unsupported txin variant tag 0x${tag.toString(16)}`);
};

export const writeTxOut = (writer: ByteWriter, output: TxOut): void => {
    writeUVarint(writer, output.amount);
    if (output.target.type === 'taggedKey') {
        writer.writeByte(TXOUT_TO_TAGGED_KEY_TAG);
        writeKey(writer, output.target.key);
        writer.writeByte(output.target.viewTag & 0xff);

        return;
    }
    writer.writeByte(TXOUT_TO_KEY_TAG);
    writeKey(writer, output.target.key);
};

export const readTxOut = (reader: ByteReader): TxOut => {
    const amount = readUVarint(reader);
    const tag = reader.readByte();
    if (tag === TXOUT_TO_TAGGED_KEY_TAG) {
        return {
            amount,
            target: {
                type: 'taggedKey',
                key: reader.readBytes(KEY_SIZE),
                viewTag: reader.readByte(),
            },
        };
    }
    if (tag === TXOUT_TO_KEY_TAG) {
        return { amount, target: { type: 'key', key: reader.readBytes(KEY_SIZE) } };
    }
    throw new Error(`Unsupported txout variant tag 0x${tag.toString(16)}`);
};

export const writeTransactionPrefix = (writer: ByteWriter, prefix: TransactionPrefix): void => {
    writeUVarint(writer, prefix.version);
    writeUVarint(writer, prefix.unlockTime);

    writeUVarint(writer, BigInt(prefix.vin.length));
    for (const input of prefix.vin) {
        writeTxIn(writer, input);
    }

    writeUVarint(writer, BigInt(prefix.vout.length));
    for (const output of prefix.vout) {
        writeTxOut(writer, output);
    }

    writeUVarint(writer, BigInt(prefix.extra.length));
    writer.writeBytes(prefix.extra);
};

export const readTransactionPrefix = (reader: ByteReader): TransactionPrefix => {
    const version = readUVarint(reader);
    const unlockTime = readUVarint(reader);

    const vinCount = Number(readUVarint(reader));
    const vin: TxIn[] = [];
    for (let i = 0; i < vinCount; i++) {
        vin.push(readTxIn(reader));
    }

    const voutCount = Number(readUVarint(reader));
    const vout: TxOut[] = [];
    for (let i = 0; i < voutCount; i++) {
        vout.push(readTxOut(reader));
    }

    const extraLen = Number(readUVarint(reader));
    const extra = reader.readBytes(extraLen);

    return { version, unlockTime, vin, vout, extra };
};

export interface Transaction {
    prefix: TransactionPrefix;
    // Present for RingCT (version >= 2) non-coinbase transactions.
    rctSig?: RctSig;
}

// The rct arrays are prefix-free, so their sizes come from the transaction prefix: one CLSAG and
// pseudoOut per (key) input, ecdhInfo/outPk per output, and ring size (mixin + 1) from the offsets.
const getRctDimensions = (prefix: TransactionPrefix): RctDimensions => {
    const firstKeyInput = prefix.vin.find((input): input is TxinToKey => input.type === 'key');

    return {
        inputs: prefix.vin.length,
        outputs: prefix.vout.length,
        mixin: firstKeyInput ? firstKeyInput.keyOffsets.length - 1 : 0,
    };
};

export const writeTransaction = (writer: ByteWriter, tx: Transaction): void => {
    writeTransactionPrefix(writer, tx.prefix);
    if (tx.prefix.version < 2n || !tx.rctSig) {
        return;
    }
    const dimensions = getRctDimensions(tx.prefix);
    writeRctSigBase(writer, tx.rctSig.base, dimensions);
    writeRctSigPrunable(writer, tx.rctSig.prunable, {
        ...dimensions,
        type: tx.rctSig.base.type,
    });
};

export const readTransaction = (reader: ByteReader): Transaction => {
    const prefix = readTransactionPrefix(reader);
    if (prefix.version < 2n) {
        return { prefix };
    }
    const dimensions = getRctDimensions(prefix);
    const base = readRctSigBase(reader, dimensions);
    const prunable = readRctSigPrunable(reader, { ...dimensions, type: base.type });

    return { prefix, rctSig: { base, prunable } };
};
