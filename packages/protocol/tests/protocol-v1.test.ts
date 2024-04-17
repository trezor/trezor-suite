import { v1 } from '../src/index';
import { HEADER_SIZE } from '../src/protocol-v1/constants';

describe('protocol-v1', () => {
    it('encode', () => {
        let result;
        // encode message without data
        result = v1.encode(Buffer.alloc(0), { messageType: 55 });
        expect(result.length).toEqual(HEADER_SIZE);

        // encode message with data
        result = v1.encode(Buffer.alloc(371).fill(0xa3), { messageType: 55 });
        expect(result.length).toEqual(371 + HEADER_SIZE);
        expect(result.subarray(0, HEADER_SIZE).toString('hex')).toEqual('3f2323003700000173');
        expect(result.subarray(HEADER_SIZE).toString('hex')).toEqual('a3'.repeat(371));

        // fail to encode unsupported messageType (string)
        expect(() => v1.encode(Buffer.alloc(64), { messageType: 'Initialize' })).toThrow(
            'Unsupported message type Initialize',
        );
    });

    it('decode', () => {
        const getFeatures = Buffer.from('3f23230037', 'hex');
        const data = Buffer.allocUnsafe(360).fill(0);
        data.fill(getFeatures, 0, 5);
        data.writeUint32BE(379, 5);

        const read = v1.decode(data);
        expect(read.messageType).toEqual(55);
        expect(read.length).toEqual(379);
    });
});
