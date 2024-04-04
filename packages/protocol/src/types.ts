export type TransportProtocolDecode = (bytes: ArrayBuffer) => {
    length: number;
    messageType: number;
    payload: Buffer;
};

export interface TransportProtocolEncodeOptions {
    messageType: number;
    chunkSize?: number;
}

export type TransportProtocolEncode = (
    data: Buffer,
    options: TransportProtocolEncodeOptions,
) => Buffer[];

export interface TransportProtocol {
    encode: TransportProtocolEncode;
    decode: TransportProtocolDecode;
}
