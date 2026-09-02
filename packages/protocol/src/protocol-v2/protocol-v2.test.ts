import { THP_CONTROL_BYTE } from './constants';

import { decode, encode, getHeaders } from './index';

describe('protocol-v2', () => {
    it('encode/decode v2 message', () => {
        // ThpCreateNewSession message
        const data = Buffer.from(
            '04123800230003e80a0870617373313233341000a0a1a2a3a4a5a6a7a8a9b0b1b2b3b4b504db712b',
            'hex',
        );

        const decoded = decode(data);
        expect(decoded.messageType).toEqual(THP_CONTROL_BYTE.ENCRYPTED);
        expect(decoded.header).toEqual(data.subarray(0, 3));
        expect(decoded.length).toEqual(35);
        expect(decoded.payload).toEqual(data.subarray(5, 5 + 35));

        const encoded = encode(decoded.payload, decoded);
        expect(encoded).toEqual(data);
    });

    it('encode with error', () => {
        expect(() => encode(Buffer.alloc(0), { messageType: 1 })).toThrow(
            'Malformed protocol format',
        );
        expect(() =>
            encode(Buffer.alloc(0), {
                messageType: 1,
                header: Buffer.alloc(1),
            }),
        ).toThrow('Malformed protocol format');
        expect(() =>
            encode(Buffer.alloc(0), {
                messageType: 1,
                header: Buffer.alloc(4),
            }),
        ).toThrow('Malformed protocol format');
    });

    it('decode with error', () => {
        expect(() => decode(Buffer.alloc(0))).toThrow('Malformed protocol format');
        // CONTINUATION_PACKET
        expect(() => decode(Buffer.from('8012380000', 'hex'))).toThrow('Malformed protocol format');
        // unrecognized chunk
        expect(() => decode(Buffer.from('9912380000', 'hex'))).toThrow('Malformed protocol format');
    });
    it('getHeaders', () => {
        expect(getHeaders(Buffer.from('0412380000', 'hex'))).toEqual([
            Buffer.from('041238', 'hex'),
            Buffer.from('801238', 'hex'),
        ]);
        // with error
        expect(() => getHeaders(Buffer.alloc(0))).toThrow('Malformed protocol format');
    });
});
