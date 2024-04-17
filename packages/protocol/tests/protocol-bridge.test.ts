import { bridge } from '../src/index';

describe('protocol-bridge', () => {
    it('encode', () => {
        let result;
        // encode small chunk, message without data
        result = bridge.encode(Buffer.alloc(0), { messageType: 55 });
        expect(result.length).toEqual(6);

        // encode big chunk, message with data
        result = bridge.encode(Buffer.alloc(371), { messageType: 55 });
        expect(result.subarray(0, 6).toString('hex')).toEqual('003700000173');
        expect(result.readUint32BE(2)).toEqual(371);
        expect(result.length).toEqual(371 + 6);

        // fail to encode unsupported messageType (string)
        expect(() => bridge.encode(Buffer.alloc(64), { messageType: 'Initialize' })).toThrow(
            'Unsupported message type Initialize',
        );
    });

    it('decode', () => {
        const getFeatures = Buffer.from('0037', 'hex');
        const data = Buffer.allocUnsafe(385).fill(0);
        data.fill(getFeatures, 0, 2);
        data.writeUint32BE(379, 2);

        const read = bridge.decode(data);
        expect(read.messageType).toEqual(55);
        expect(read.length).toEqual(379);
    });
});
