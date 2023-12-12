import { v1 } from '../src/index';

describe('protocol-v1', () => {
    it('encode', () => {
        let chunks;
        // encode only one chunk, message without data
        chunks = v1.encode(Buffer.alloc(0), { messageType: 55 });
        expect(chunks.length).toEqual(1);
        expect(chunks[0].length).toEqual(64);

        // encode multiple chunks, message with data
        chunks = v1.encode(Buffer.alloc(371), { messageType: 55 });
        expect(chunks.length).toEqual(7);
        chunks.forEach((chunk, index) => {
            expect(chunk.length).toEqual(64);
            if (index === 0) {
                // first chunk with additional data
                expect(chunk.subarray(0, 9).toString('hex')).toEqual('3f2323003700000173');
                expect(chunk.readUint32BE(5)).toEqual(371);
            } else {
                // following chunk starts with MESSAGE_MAGIC_HEADER_BYTE
                expect(chunk.subarray(0, 5).toString('hex')).toEqual('3f00000000');
            }
        });
    });

    it('decode', () => {
        const getFeatures = Buffer.from('3f23230037', 'hex');
        const data = Buffer.allocUnsafe(360).fill(0);
        data.fill(getFeatures, 0, 5);
        data.writeUint32BE(379, 5);

        const read = v1.decode(data);
        expect(read.typeId).toEqual(55);
        expect(read.length).toEqual(379);
    });
});
