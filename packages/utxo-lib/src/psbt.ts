// Minimal BIP-174 (PSBTv0) parser/serializer.
//
// Handles the raw key-value map structure and the unsigned transaction.
// Field-level interpretation is left to consumers.
//
// Spec: https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki
//

import { BufferReader, BufferWriter, varIntSize } from './bufferutils';
import { Transaction, type TransactionOptions } from './transaction';

// 5-byte header: ASCII "psbt" followed by 0xff separator.
export const PSBT_MAGIC = Buffer.from('70736274ff', 'hex');

// BIP-174 global key type for the unsigned transaction (key 0x00, no key data).
export const UNSIGNED_TX_KEY = 0x00;

export type PsbtKeyValue = {
    key: Buffer;
    value: Buffer;
};

export type PsbtOptions = TransactionOptions;

// Read key-value pairs from a single map section until the 0x00 separator.
// Each pair is encoded as: <varint key_len> <key> <varint value_len> <value>.
// Duplicate keys within a map are rejected per BIP-174.
function readMap(bufferReader: BufferReader): PsbtKeyValue[] {
    const map: PsbtKeyValue[] = [];
    const keySet = new Set<string>();

    while (true) {
        const key = bufferReader.readVarSlice();
        if (key.length === 0) {
            return map;
        }

        const keyHex = key.toString('hex');
        if (keySet.has(keyHex)) {
            throw new Error('PSBT map has duplicate key.');
        }
        keySet.add(keyHex);

        map.push({
            key,
            value: bufferReader.readVarSlice(),
        });
    }
}

function getUnsignedTx(map: PsbtKeyValue[], options: PsbtOptions) {
    const unsignedTxEntries = map.filter(
        kv => kv.key.length === 1 && kv.key[0] === UNSIGNED_TX_KEY,
    );

    if (unsignedTxEntries.length !== 1 || !unsignedTxEntries[0]) {
        throw new Error('PSBT must contain exactly one unsigned transaction.');
    }

    return Transaction.fromBuffer(unsignedTxEntries[0].value, {
        network: options.network,
        nostrict: false,
    });
}

function getMapByteLength(map: PsbtKeyValue[]) {
    return map.reduce(
        (size, { key, value }) =>
            size + varIntSize(key.length) + key.length + varIntSize(value.length) + value.length,
        1,
    );
}

// Serialize key-value pairs and terminate the map with a 0x00 byte.
function writeMap(bufferWriter: BufferWriter, map: PsbtKeyValue[]) {
    map.forEach(({ key, value }) => {
        bufferWriter.writeVarSlice(key);
        bufferWriter.writeVarSlice(value);
    });

    bufferWriter.writeUInt8(0);
}

export class Psbt {
    readonly unsignedTx: Transaction;
    readonly globalMap: PsbtKeyValue[];
    readonly inputs: PsbtKeyValue[][];
    readonly outputs: PsbtKeyValue[][];

    private constructor({
        unsignedTx,
        globalMap,
        inputs,
        outputs,
    }: {
        unsignedTx: Transaction;
        globalMap: PsbtKeyValue[];
        inputs: PsbtKeyValue[][];
        outputs: PsbtKeyValue[][];
    }) {
        this.unsignedTx = unsignedTx;
        this.globalMap = globalMap;
        this.inputs = inputs;
        this.outputs = outputs;
    }

    static fromBuffer(buffer: Buffer, options: PsbtOptions = {}) {
        const bufferReader = new BufferReader(buffer);
        if (!bufferReader.readSlice(PSBT_MAGIC.length).equals(PSBT_MAGIC)) {
            throw new Error('Invalid PSBT magic bytes.');
        }

        const globalMap = readMap(bufferReader);
        const unsignedTx = getUnsignedTx(globalMap, options);

        const inputs: PsbtKeyValue[][] = [];
        for (let i = 0; i < unsignedTx.ins.length; i++) {
            inputs.push(readMap(bufferReader));
        }

        const outputs: PsbtKeyValue[][] = [];
        for (let i = 0; i < unsignedTx.outs.length; i++) {
            outputs.push(readMap(bufferReader));
        }

        if (!options.nostrict && bufferReader.offset !== buffer.length) {
            throw new Error('PSBT has unexpected data.');
        }

        return new Psbt({
            unsignedTx,
            globalMap,
            inputs,
            outputs,
        });
    }

    static fromHex(hex: string, options: PsbtOptions = {}) {
        return this.fromBuffer(Buffer.from(hex, 'hex'), { ...options, nostrict: false });
    }

    toBuffer() {
        const unsignedTxBuffer = this.unsignedTx.toBuffer();
        const globalMap = this.globalMap.map(keyValue => {
            if (keyValue.key.length === 1 && keyValue.key[0] === UNSIGNED_TX_KEY) {
                return {
                    ...keyValue,
                    value: unsignedTxBuffer,
                };
            }

            return keyValue;
        });

        const globalUnsignedTxEntries = globalMap.filter(
            ({ key }) => key.length === 1 && key[0] === UNSIGNED_TX_KEY,
        );

        if (globalUnsignedTxEntries.length !== 1) {
            throw new Error('PSBT must contain exactly one unsigned transaction.');
        }

        if (this.inputs.length > this.unsignedTx.ins.length) {
            throw new Error('PSBT has more input maps than unsigned transaction inputs.');
        }

        if (this.outputs.length > this.unsignedTx.outs.length) {
            throw new Error('PSBT has more output maps than unsigned transaction outputs.');
        }

        const inputMaps = Array.from({ length: this.unsignedTx.ins.length }, (_, index) =>
            this.inputs[index] ? this.inputs[index].map(keyValue => ({ ...keyValue })) : [],
        );
        const outputMaps = Array.from({ length: this.unsignedTx.outs.length }, (_, index) =>
            this.outputs[index] ? this.outputs[index].map(keyValue => ({ ...keyValue })) : [],
        );

        const byteLength =
            PSBT_MAGIC.length +
            getMapByteLength(globalMap) +
            inputMaps.reduce((size, map) => size + getMapByteLength(map), 0) +
            outputMaps.reduce((size, map) => size + getMapByteLength(map), 0);

        const buffer = Buffer.allocUnsafe(byteLength);
        const bufferWriter = new BufferWriter(buffer);

        bufferWriter.writeSlice(PSBT_MAGIC);
        writeMap(bufferWriter, globalMap);
        inputMaps.forEach(map => writeMap(bufferWriter, map));
        outputMaps.forEach(map => writeMap(bufferWriter, map));

        return buffer;
    }

    toHex() {
        return this.toBuffer().toString('hex');
    }
}
