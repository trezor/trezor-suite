export type TransportProtocolDecode = (bytes: Buffer) => {
    header: Buffer;
    length: number;
    messageType: number | string;
    payload: Buffer;
};

export interface TransportProtocolEncodeOptions {
    messageType: number | string;
    header?: Buffer;
}

export type TransportProtocolEncode = (
    data: Buffer,
    options: TransportProtocolEncodeOptions,
) => Buffer;

export interface TransportProtocol {
    name: 'bridge' | 'v1' | 'v2';
    encode: TransportProtocolEncode;
    decode: TransportProtocolDecode;
    getChunkHeader: (data: Buffer) => Buffer;
}
