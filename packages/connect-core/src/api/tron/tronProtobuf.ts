import { BinaryReader, BinaryWriter, WireType } from '@bufbuild/protobuf/wire';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

// The TRON-network `Transaction { bytes rawData=1, repeated bytes signature=2 }`
// envelope isn't part of the Trezor protobuf schema, so we emit and parse its
// two length-delimited fields directly against the wire format.

export const encodeBroadcastTransaction = (rawDataHex: string, signatureHex: string): string => {
    const writer = new BinaryWriter();
    writer.tag(1, WireType.LengthDelimited).bytes(hexToBytes(rawDataHex));
    writer.tag(2, WireType.LengthDelimited).bytes(hexToBytes(signatureHex));

    return bytesToHex(writer.finish());
};

export const decodeBroadcastTransaction = (hex: string) => {
    const reader = new BinaryReader(hexToBytes(hex));
    let rawData: Uint8Array | undefined;
    const signature: Uint8Array[] = [];
    while (reader.pos < reader.len) {
        const [fieldNo] = reader.tag();
        if (fieldNo === 1) {
            rawData = reader.bytes();
        } else if (fieldNo === 2) {
            signature.push(reader.bytes());
        } else {
            throw new Error(`Unexpected field ${fieldNo} in broadcast transaction`);
        }
    }
    if (!rawData) throw new Error('Missing rawData in broadcast transaction');

    return { rawData, signature };
};
