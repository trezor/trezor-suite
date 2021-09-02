import * as varuint from 'varuint-bitcoin';
import { BufferReader, BufferWriter } from '../bufferutils';
import { TransactionBase, TransactionOptions, varSliceSize, vectorSize } from './base';

const DASH_NORMAL = 0;
const DASH_QUORUM_COMMITMENT = 6;

export interface DashSpecific {
    type: 'dash';
    extraPayload?: Buffer;
}

function byteLength(tx: TransactionBase<DashSpecific>, _ALLOW_WITNESS = true) {
    const hasWitnesses = _ALLOW_WITNESS && tx.hasWitnesses();

    return (
        (hasWitnesses ? 10 : 8) +
        (tx.timestamp ? 4 : 0) +
        varuint.encodingLength(tx.ins.length) +
        varuint.encodingLength(tx.outs.length) +
        tx.ins.reduce((sum, input) => sum + 40 + varSliceSize(input.script), 0) +
        tx.outs.reduce((sum, output) => sum + 8 + varSliceSize(output.script), 0) +
        (tx.specific?.extraPayload ? varSliceSize(tx.specific.extraPayload) : 0) +
        (hasWitnesses ? tx.ins.reduce((sum, input) => sum + vectorSize(input.witness), 0) : 0)
    );
}

function toBuffer(
    tx: TransactionBase<DashSpecific>,
    buffer?: Buffer,
    initialOffset?: number,
    _ALLOW_WITNESS = true,
) {
    if (!buffer) buffer = Buffer.allocUnsafe(tx.byteLength(_ALLOW_WITNESS));

    const bufferWriter = new BufferWriter(buffer, initialOffset || 0);

    if (tx.version >= 3 && tx.type !== DASH_NORMAL) {
        bufferWriter.writeUInt16(tx.version);
        bufferWriter.writeUInt16(tx.type!);
    } else {
        bufferWriter.writeInt32(tx.version);
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

    bufferWriter.writeUInt32(tx.locktime);

    if (tx.specific?.extraPayload) bufferWriter.writeVarSlice(tx.specific.extraPayload);

    // avoid slicing unless necessary
    if (initialOffset !== undefined) return buffer.slice(initialOffset, bufferWriter.offset);
    return buffer;
}

function getExtraData(tx: TransactionBase<DashSpecific>) {
    if (!tx.specific?.extraPayload) return;
    const extraDataLength = varuint.encode(tx.specific.extraPayload.length);
    return Buffer.concat([extraDataLength, tx.specific.extraPayload]);
}

export function fromConstructor(options: TransactionOptions) {
    const tx = new TransactionBase<DashSpecific>(options);
    // initialize specific data
    tx.specific = tx.specific || { type: 'dash' };
    // override base methods
    tx.byteLength = byteLength.bind(null, tx);
    tx.toBuffer = toBuffer.bind(null, tx);
    tx.getExtraData = getExtraData.bind(null, tx);
    return tx;
}

export function fromBuffer(buffer: Buffer, options: TransactionOptions) {
    const bufferReader = new BufferReader(buffer);

    const tx = fromConstructor(options);
    tx.version = bufferReader.readInt32();
    tx.type = tx.version >> 16;
    tx.version &= 0xffff;
    if (tx.version === 3 && (tx.type < DASH_NORMAL || tx.type > DASH_QUORUM_COMMITMENT)) {
        throw new Error('Unsupported Dash transaction type');
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

    tx.locktime = bufferReader.readUInt32();

    if (tx.version >= 3 && tx.type !== DASH_NORMAL) {
        tx.specific!.extraPayload = bufferReader.readVarSlice();
    }

    if (options.nostrict) return tx;
    if (bufferReader.offset !== buffer.length) throw new Error('Transaction has unexpected data');

    return tx;
}
