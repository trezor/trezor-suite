import { encode, decode, getChunkHeader } from '../src/protocol-v2';

describe('protocol-v2', () => {
    it('encode/decode TrezorHostProtocolMessage', () => {
        // ThpCreateNewSession message
        const data = Buffer.from(
            '04123800230003e80a0870617373313233341000a0a1a2a3a4a5a6a7a8a9b0b1b2b3b4b504db712b',
            'hex',
        );

        const decoded = decode(data);
        expect(decoded.messageType).toEqual('TrezorHostProtocolMessage');
        expect(decoded.header).toEqual(data.subarray(0, 3));
        expect(decoded.length).toEqual(35);
        expect(decoded.payload).toEqual(data.subarray(5, 5 + 35));

        const encoded = encode(decoded.payload, decoded);
        expect(encoded).toEqual(data);
    });

    it('encode with error', () => {
        expect(() => encode(Buffer.alloc(0), { messageType: 1 })).toThrow(
            'Use protocol-thp.encode',
        );
        expect(() => encode(Buffer.alloc(0), { messageType: 'TrezorHostProtocolMessage' })).toThrow(
            'unexpected header undefined',
        );
        expect(() =>
            encode(Buffer.alloc(0), {
                messageType: 'TrezorHostProtocolMessage',
                header: Buffer.alloc(1),
            }),
        ).toThrow('unexpected header 00');
        expect(() =>
            encode(Buffer.alloc(0), {
                messageType: 'TrezorHostProtocolMessage',
                header: Buffer.alloc(4),
            }),
        ).toThrow('unexpected header 00000000');
    });

    it('decode with error', () => {
        expect(() => decode(Buffer.alloc(0))).toThrow('Malformed protocol format');
    });

    it('getChunkHeader', () => {
        expect(getChunkHeader(Buffer.from('0412380000', 'hex'))).toEqual(
            Buffer.from('801238', 'hex'),
        );
        // with error
        expect(() => getChunkHeader(Buffer.alloc(0))).toThrow('Malformed protocol format');
    });
});
