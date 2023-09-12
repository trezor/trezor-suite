// https://devdocs.decred.org/developer-guides/transactions/transaction-format/

import * as varuint from 'varuint-bitcoin';
import { BufferReader, BufferWriter } from '../bufferutils';
import * as bcrypto from '../crypto';
import { TransactionBase, TransactionOptions, varSliceSize, EMPTY_SCRIPT } from './base';

const DECRED_TX_VERSION = 1;
const DECRED_TX_SERIALIZE_FULL = 0;
const DECRED_TX_SERIALIZE_NO_WITNESS = 1;
const DECRED_SCRIPT_VERSION = 0;

function hasWitnesses(tx: TransactionBase) {
    return tx.type === DECRED_TX_SERIALIZE_FULL;
}

function byteLength(tx: TransactionBase, _ALLOW_WITNESS = true) {
    let byteLength = 4 + varuint.encodingLength(tx.ins.length); // version + nIns
    let nWitness = 0;
    const hasWitnesses = _ALLOW_WITNESS && tx.hasWitnesses();
    byteLength += tx.ins.reduce((sum, input) => {
        sum += 32 + 4 + 1 + 4; // prevOut hash + index + tree + sequence
        if (hasWitnesses) {
            nWitness += 1;
            sum += 8 + 4 + 4; // value + height + block index
            sum += varSliceSize(input.decredWitness!.script);
        }
        return sum;
    }, 0);
    if (hasWitnesses) {
        byteLength += varuint.encodingLength(nWitness);
    }
    byteLength += varuint.encodingLength(tx.outs.length);
    byteLength += tx.outs.reduce((sum, output) => {
        sum += 8 + 2; // value + script version
        sum += varSliceSize(output.script);
        return sum;
    }, 0);
    byteLength += 4 + 4; // block height + block index
    return byteLength;
}

function toBuffer(
    tx: TransactionBase,
    buffer?: Buffer,
    initialOffset?: number,
    _ALLOW_WITNESS = true,
) {
    if (!buffer) buffer = Buffer.allocUnsafe(byteLength(tx, _ALLOW_WITNESS));

    const bufferWriter = new BufferWriter(buffer, initialOffset || 0);

    bufferWriter.writeUInt16(tx.version);
    bufferWriter.writeUInt16(_ALLOW_WITNESS ? tx.type! : DECRED_TX_SERIALIZE_NO_WITNESS);

    bufferWriter.writeVarInt(tx.ins.length);
    tx.ins.forEach(txIn => {
        bufferWriter.writeSlice(txIn.hash);
        bufferWriter.writeUInt32(txIn.index);
        bufferWriter.writeUInt8(txIn.decredTree!);
        bufferWriter.writeUInt32(txIn.sequence);
    });

    bufferWriter.writeVarInt(tx.outs.length);
    tx.outs.forEach(txOut => {
        bufferWriter.writeUInt64(txOut.value);
        bufferWriter.writeUInt16(txOut.decredVersion!);
        bufferWriter.writeVarSlice(txOut.script);
    });

    bufferWriter.writeUInt32(tx.locktime);
    bufferWriter.writeUInt32(tx.expiry!);

    if (_ALLOW_WITNESS && tx.hasWitnesses()) {
        bufferWriter.writeVarInt(tx.ins.length);
        tx.ins.forEach(input => {
            bufferWriter.writeUInt64(input.decredWitness!.value);
            bufferWriter.writeUInt32(input.decredWitness!.height);
            bufferWriter.writeUInt32(input.decredWitness!.blockIndex);
            bufferWriter.writeVarSlice(input.decredWitness!.script);
        });
    }

    // avoid slicing unless necessary
    if (initialOffset !== undefined) return buffer.slice(initialOffset, bufferWriter.offset);
    return buffer;
}

function getHash(tx: TransactionBase, forWitness = false): Buffer {
    // wtxid for coinbase is always 32 bytes of 0x00
    if (forWitness && tx.isCoinbase()) return Buffer.alloc(32, 0);
    return bcrypto.blake256(toBuffer(tx, undefined, undefined, forWitness));
}

function weight(tx: TransactionBase) {
    return tx.byteLength(true);
}

export function fromConstructor(options: TransactionOptions) {
    const tx = new TransactionBase(options);
    // override base methods
    tx.byteLength = byteLength.bind(null, tx);
    tx.toBuffer = toBuffer.bind(null, tx);
    tx.hasWitnesses = hasWitnesses.bind(null, tx);
    tx.getHash = getHash.bind(null, tx);
    tx.weight = weight.bind(null, tx);
    return tx;
}

export function fromBuffer(buffer: Buffer, options: TransactionOptions) {
    const bufferReader = new BufferReader(buffer);

    const tx = fromConstructor(options);
    tx.version = bufferReader.readInt32();

    tx.type = tx.version >> 16;
    tx.version &= 0xffff;

    if (tx.version !== DECRED_TX_VERSION) {
        throw new Error('Unsupported Decred transaction version');
    }
    if (tx.type !== DECRED_TX_SERIALIZE_FULL && tx.type !== DECRED_TX_SERIALIZE_NO_WITNESS) {
        throw new Error('Unsupported Decred transaction type');
    }

    const vinLen = bufferReader.readVarInt();
    for (let i = 0; i < vinLen; ++i) {
        tx.ins.push({
            hash: bufferReader.readSlice(32),
            index: bufferReader.readUInt32(),
            decredTree: bufferReader.readUInt8(),
            sequence: bufferReader.readUInt32(),
            script: EMPTY_SCRIPT, // not used in decred
            witness: [], // not used in decred
        });
    }

    const voutLen = bufferReader.readVarInt();
    for (let i = 0; i < voutLen; i++) {
        const value = bufferReader.readUInt64String();
        const version = bufferReader.readUInt16();
        if (version !== DECRED_SCRIPT_VERSION) throw new Error('Unsupported Decred script version');
        tx.outs.push({
            value,
            decredVersion: version,
            script: bufferReader.readVarSlice(),
        });
    }

    tx.locktime = bufferReader.readUInt32();
    tx.expiry = bufferReader.readUInt32();

    if (tx.type === DECRED_TX_SERIALIZE_FULL) {
        const count = bufferReader.readVarInt();
        if (count !== vinLen) throw new Error('Non equal number of ins and witnesses');
        tx.ins.forEach(vin => {
            vin.decredWitness = {
                value: bufferReader.readUInt64String(),
                height: bufferReader.readUInt32(),
                blockIndex: bufferReader.readUInt32(),
                script: bufferReader.readVarSlice(),
            };
        });
    }

    if (options.nostrict) return tx;
    if (bufferReader.offset !== buffer.length) throw new Error('Transaction has unexpected data');

    return tx;
}
