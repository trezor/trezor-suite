// Decode `trzd` protocol used for decoding of dynamically loaded `@trezor/protobuf` messages
// https://github.com/trezor/trezor-firmware/blob/087becd2caa5618eecab37ac3f2ca51172e52eb9/docs/common/ethereum-definitions.md#definition-format

export const decode = (bytes: ArrayBuffer) => {
    const byteBuffer = Buffer.from(bytes);
    // 5 bytes magic `trzd`
    const magic = byteBuffer.subarray(0, 5).toString('utf8');
    // 1 byte
    const definitionType = byteBuffer.readUInt8(5);
    // 4 bytes
    const dataVersion = byteBuffer.readUInt32LE(6);
    // 2 bytes
    const protobufLength = byteBuffer.readUInt16LE(10);
    // N bytes
    const protobufPayload = byteBuffer.subarray(12, 12 + protobufLength);

    return {
        magic,
        definitionType,
        dataVersion,
        protobufLength,
        protobufPayload,
    };
};
