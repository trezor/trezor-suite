import { thp as protocolThp, v1 as protocolV1 } from '@trezor/protocol';

import { readWithExpectedHeaders } from '../src/utils/readWithExpectedHeaders';

describe('readWithExpectedHeaders', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // common AbstractApi['read'] mock
    const SUCCESS = Buffer.from('3f23230002000000060a046d656f77', 'hex'); // proto Success
    const apiRead = jest.fn(
        signal =>
            new Promise<any>((resolve, reject) => {
                const listener = () => {
                    signal.removeEventListener('abort', listener);
                    reject(new Error('Aborted'));
                };
                signal?.addEventListener('abort', listener);

                setTimeout(() => {
                    signal.removeEventListener('abort', listener);
                    resolve({
                        success: true,
                        payload: SUCCESS,
                    });
                }, 10);
            }),
    );

    it('read aborted', async () => {
        const abortController = new AbortController();
        const read = readWithExpectedHeaders(apiRead, {
            signal: abortController.signal,
        });

        const resultPromise = read([Buffer.alloc(3)]);

        abortController.abort();
        // error thrown from scheduleAction
        await expect(() => resultPromise).rejects.toThrow('Aborted by signal');
    });

    it('read timeout', async () => {
        const read = readWithExpectedHeaders(apiRead, {
            timeout: 7, // see default apiRead timeout
        });

        const resultPromise = read([Buffer.alloc(3)]);

        // error thrown from scheduleAction
        await expect(() => resultPromise).rejects.toThrow('Aborted by timeout');
    });

    it('api.read failed', async () => {
        const read = readWithExpectedHeaders(() =>
            Promise.resolve({ success: false, error: 'unexpected error' }),
        );

        const result = await read();
        expect(result).toMatchObject({ success: false, error: 'unexpected error' });
    });

    it('attempts limit reached', async () => {
        const apiRead = jest.fn(() =>
            Promise.resolve({ success: true, payload: Buffer.alloc(64) } as const),
        );
        const expectedHeaders = protocolV1.getHeaders(SUCCESS);
        const read = readWithExpectedHeaders(apiRead, { attempts: 7 });
        // error thrown from scheduleAction
        await expect(() => read(expectedHeaders)).rejects.toThrow('Unexpected chunk');
        expect(apiRead).toHaveBeenCalledTimes(7);
    });

    it('success with expectedHeaders', async () => {
        const expectedHeaders = protocolV1.getHeaders(SUCCESS);

        const result = await readWithExpectedHeaders(apiRead)(expectedHeaders);
        expect(result).toMatchObject({ success: true });
    });

    it('success. expectedHeaders not set', async () => {
        const result = await readWithExpectedHeaders(apiRead)();
        expect(result).toMatchObject({ success: true });
    });

    it('success. received at 5th attempt', async () => {
        const expectedHeaders = protocolV1.getHeaders(SUCCESS);

        let attempt = 0;
        const apiRead = jest.fn(
            () =>
                new Promise<any>(resolve => {
                    if (++attempt < 5) {
                        resolve({ success: true, payload: Buffer.alloc(32) });
                    } else {
                        resolve({ success: true, payload: SUCCESS });
                    }
                }),
        );

        const result = await readWithExpectedHeaders(apiRead)(expectedHeaders);

        expect(apiRead).toHaveBeenCalledTimes(5);
        expect(result).toMatchObject({ success: true });
    });

    it('success with THP', async () => {
        const readResult = Buffer.from('2833da0004527eb068', 'hex');

        let attempt = 0;
        const apiRead = jest.fn(
            () =>
                new Promise<any>(resolve => {
                    if (++attempt < 5) {
                        resolve({ success: true, payload: Buffer.alloc(32) });
                    } else {
                        resolve({ success: true, payload: readResult });
                    }
                }),
        );

        const thpState = new protocolThp.ThpState();
        thpState.setChannel(readResult.subarray(1, 3));
        thpState.setExpectedResponses([0x20]); // expect ThpAck
        thpState.updateSyncBit('send'); // ThpAck is masked, data will start with "28" instead of "20"

        const result = await readWithExpectedHeaders(apiRead)(
            protocolThp.getExpectedHeaders(thpState),
        );
        expect(result).toMatchObject({ success: true });
    });
});
