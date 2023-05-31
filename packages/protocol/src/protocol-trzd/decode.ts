import ByteBuffer from 'bytebuffer';

export const decode = (bytes: ArrayBuffer) => {
    const byteBuffer = ByteBuffer.wrap(bytes);
    const magic = byteBuffer.readBytes(5).toUTF8();
    const definitionType = byteBuffer.readUint8();
    const dataVersion = byteBuffer.readUint32();
    const protobufLength = byteBuffer.readUint8();
    const protobufPayload = byteBuffer.slice(12, 12 + protobufLength);

    return {
        magic,
        definitionType,
        dataVersion,
        protobufLength,
        protobufPayload,
    };
};
