import { ABORTED_BY_SIGNAL } from '../src/errors';
import { readMessageBuffer } from '../src/utils/readMessageBuffer';

describe('readMessageBuffer', () => {
    it('read from readBuffer', async () => {
        const r = readMessageBuffer();

        r.onMessage('1', Buffer.alloc(2).fill(1));
        r.onMessage('2-ignored', Buffer.alloc(2).fill(3));
        r.onMessage('1', Buffer.alloc(2).fill(2));

        let result = await r.read('1');
        if (!result.success) throw new Error(result.error);
        expect(result.payload.toString('hex')).toEqual('0101');

        result = await r.read('1');
        if (!result.success) throw new Error(result.error);
        expect(result.payload.toString('hex')).toEqual('0202');
    });

    it('read from readRequest promise', async () => {
        const r = readMessageBuffer();

        const readPromise1 = r.read('1');
        const readPromise2 = r.read('1');

        r.onMessage('1', Buffer.alloc(2).fill(1));
        r.onMessage('2-ignored', Buffer.alloc(2).fill(3));
        r.onMessage('1', Buffer.alloc(2).fill(2));

        let result = await readPromise1;
        if (!result.success) throw new Error(result.error);
        expect(result.payload.toString('hex')).toEqual('0101');

        result = await readPromise2;
        if (!result.success) throw new Error(result.error);
        expect(result.payload.toString('hex')).toEqual('0101');

        result = await r.read('1');
        if (!result.success) throw new Error(result.error);
        expect(result.payload.toString('hex')).toEqual('0202');
    });

    it('read from readRequest aborted', async () => {
        const r = readMessageBuffer();

        const abortController = new AbortController();

        const readPromise = r.read('1', abortController.signal);

        abortController.abort();

        let result = await readPromise;
        if (result.success) throw new Error('Unexpected success');
        expect(result.error).toEqual(ABORTED_BY_SIGNAL);

        r.onMessage('1', Buffer.alloc(2).fill(1));
        result = await r.read('1');
        if (!result.success) throw new Error(result.error);
        expect(result.payload.toString('hex')).toEqual('0101');
    });
});
