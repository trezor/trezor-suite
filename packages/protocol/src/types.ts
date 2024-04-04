export type TransportProtocolDecode = (bytes: ArrayBuffer) => {
    length: number;
    messageType: number | string;
    payload: Buffer;
};

export interface TransportProtocolEncodeOptions {
    messageType: number | string;
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
