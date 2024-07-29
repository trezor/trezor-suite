export type TransportProtocolDecode = (bytes: Buffer) => {
    length: number;
    messageType: number | string;
    payload: Buffer;
};

export interface TransportProtocolEncodeOptions {
    messageType: number | string;
}

export type TransportProtocolEncode = (
    data: Buffer,
    options: TransportProtocolEncodeOptions,
) => Buffer;

export interface TransportProtocol {
    encode: TransportProtocolEncode;
    decode: TransportProtocolDecode;
    getChunkHeader: (data: Buffer) => Buffer;
}
