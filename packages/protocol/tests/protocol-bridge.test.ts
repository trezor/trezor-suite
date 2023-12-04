import ByteBuffer from 'bytebuffer';

import { bridge } from '../src/index';

describe('protocol-bridge', () => {
    it('encode', () => {
        let chunks;
        // encode small chunk, message without data
        chunks = bridge.encode(new ByteBuffer(0), { messageType: 55 });
        expect(chunks.limit).toEqual(6);

        // encode big chunk, message with data
        chunks = bridge.encode(new ByteBuffer(371), { messageType: 55 });
        expect(chunks.slice(0, 6).toString('hex')).toEqual('003700000173');
        expect(chunks.readUint32(2)).toEqual(371);
        expect(chunks.buffer.length).toEqual(371 + 6);
    });

    it('decode', () => {
        const getFeatures = Buffer.from('0037', 'hex');
        const data = Buffer.allocUnsafe(385).fill(0);
        data.fill(getFeatures, 0, 2);
        data.writeUint32BE(379, 2);

        const read = bridge.decode(ByteBuffer.fromHex(data.toString('hex')));
        expect(read.typeId).toEqual(55);
    });
});
