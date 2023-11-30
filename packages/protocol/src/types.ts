export type TransportProtocolDecode = (bytes: ArrayBuffer) => {
    length: number;
    typeId: number;
    buffer: ByteBuffer;
};

export interface TransportProtocolEncodeOptions {
    messageType: number;
    chunkSize?: number;
}

export type TransportProtocolEncode = (
    data: ByteBuffer,
    options: TransportProtocolEncodeOptions,
) => ByteBuffer[];

export interface TransportProtocol {
    encode: TransportProtocolEncode;
    decode: TransportProtocolDecode;
}
