import ByteBuffer from 'bytebuffer';

// Decode `trzd` protocol used for decoding of dynamically loaded `@trezor/protobuf` messages
// https://github.com/trezor/trezor-firmware/blob/087becd2caa5618eecab37ac3f2ca51172e52eb9/docs/common/ethereum-definitions.md#definition-format

export const decode = (bytes: ArrayBuffer) => {
    const byteBuffer = ByteBuffer.wrap(bytes);
    byteBuffer.LE(true); // use little endian byte order
    // 5 bytes magic `trzd`
    const magic = byteBuffer.readBytes(5).toUTF8();
    // 1 byte
    const definitionType = byteBuffer.readUint8();
    // 4 bytes
    const dataVersion = byteBuffer.readUint32();
    // 2 bytes
    const protobufLength = byteBuffer.readUint16();
    // N bytes
    const protobufPayload = byteBuffer.slice(12, 12 + protobufLength);

    return {
        magic,
        definitionType,
        dataVersion,
        protobufLength,
        protobufPayload,
    };
};
