import { BufferReader, BufferWriter } from '../bufferutils';
import { isNetworkType } from '../networks';
import { TransactionBase, TransactionOptions } from './base';

const ADVANCED_TRANSACTION_MARKER = 0x00;
const ADVANCED_TRANSACTION_FLAG = 0x01;
const MWEB_PEGOUT_TX_FLAG = 0x08;

function toBuffer<S>(
    tx: TransactionBase<S>,
    buffer?: Buffer,
    initialOffset?: number,
    _ALLOW_WITNESS = true,
    _ALLOW_MWEB = true,
) {
    if (!buffer) buffer = Buffer.allocUnsafe(tx.byteLength(_ALLOW_WITNESS, _ALLOW_MWEB));

    const bufferWriter = new BufferWriter(buffer, initialOffset || 0);

    bufferWriter.writeInt32(tx.version);

    const hasWitnesses = _ALLOW_WITNESS && tx.hasWitnesses();
    const hasMweb = _ALLOW_MWEB && tx.isMwebPegOutTx();

    if (hasWitnesses) {
        bufferWriter.writeUInt8(ADVANCED_TRANSACTION_MARKER);
        bufferWriter.writeUInt8(ADVANCED_TRANSACTION_FLAG);
    } else if (hasMweb) {
        bufferWriter.writeUInt8(ADVANCED_TRANSACTION_MARKER);
        bufferWriter.writeUInt8(MWEB_PEGOUT_TX_FLAG);
    }

    bufferWriter.writeVarInt(tx.ins.length);

    tx.ins.forEach(txIn => {
        bufferWriter.writeSlice(txIn.hash);
        bufferWriter.writeUInt32(txIn.index);
        bufferWriter.writeVarSlice(txIn.script);
        bufferWriter.writeUInt32(txIn.sequence);
    });

    bufferWriter.writeVarInt(tx.outs.length);
    tx.outs.forEach(txOut => {
        bufferWriter.writeUInt64(txOut.value);
        bufferWriter.writeVarSlice(txOut.script);
    });

    if (hasWitnesses) {
        tx.ins.forEach(input => {
            bufferWriter.writeVector(input.witness);
        });
    }

    if (hasMweb) {
        bufferWriter.writeUInt8(0);
    }

    bufferWriter.writeUInt32(tx.locktime);

    // avoid slicing unless necessary
    if (initialOffset !== undefined) return buffer.subarray(initialOffset, bufferWriter.offset);

    return buffer;
}

export function fromConstructor(options: TransactionOptions) {
    const tx = new TransactionBase(options);
    // override base methods
    tx.toBuffer = toBuffer.bind(null, tx);

    return tx;
}

export function fromBuffer(buffer: Buffer, options: TransactionOptions) {
    const bufferReader = new BufferReader(buffer);

    const tx = fromConstructor(options);
    tx.version = bufferReader.readInt32();
    const marker = bufferReader.readUInt8();
    const flag = bufferReader.readUInt8();

    let hasWitnesses = false;
    let hasMweb = false;

    if (isNetworkType('litecoin', tx.network)) {
        if (marker === ADVANCED_TRANSACTION_MARKER && flag === MWEB_PEGOUT_TX_FLAG) {
            hasMweb = true;
        }
    }

    if (marker === ADVANCED_TRANSACTION_MARKER && flag === ADVANCED_TRANSACTION_FLAG) {
        hasWitnesses = true;
    } else if (!hasMweb) {
        bufferReader.offset -= 2;
    }

    const vinLen = bufferReader.readVarInt();
    for (let i = 0; i < vinLen; ++i) {
        tx.ins.push({
            hash: bufferReader.readSlice(32),
            index: bufferReader.readUInt32(),
            script: bufferReader.readVarSlice(),
            sequence: bufferReader.readUInt32(),
            witness: [],
        });
    }

    const voutLen = bufferReader.readVarInt();
    for (let i = 0; i < voutLen; ++i) {
        tx.outs.push({
            value: bufferReader.readUInt64String(),
            script: bufferReader.readVarSlice(),
        });
    }

    if (hasWitnesses) {
        for (let i = 0; i < vinLen; ++i) {
            tx.ins[i].witness = bufferReader.readVector();
        }

        // was this pointless?
        if (!tx.hasWitnesses()) throw new Error('Transaction has superfluous witness data');
    }

    if (hasMweb) {
        bufferReader.readUInt8();
    }

    tx.locktime = bufferReader.readUInt32();

    if (options.nostrict) return tx;
    if (bufferReader.offset !== buffer.length) throw new Error('Transaction has unexpected data');

    return tx;
}
