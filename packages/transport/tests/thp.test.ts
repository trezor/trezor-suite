import { parseConfigure } from '@trezor/protobuf';
import { thp as protocolThp, v2 } from '@trezor/protocol';

import { parseThpMessage, receiveThpMessage, sendThpMessage } from '../src/thp';

describe('thp', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const apiChunkSize = 64;
    const thpState = new protocolThp.ThpState();
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
                    resolve({ success: true, payload: Buffer.alloc(apiChunkSize) });
                }, 100);
            }),
    );

    const apiWrite = jest.fn(() => Promise.resolve({ success: true } as any));

    describe('receiveThpMessage', () => {
        it('aborted', async () => {
            const abortController = new AbortController();
            let attempt = 0;
            const apiRead = jest.fn(
                signal =>
                    new Promise<any>(resolve => {
                        if (++attempt < 5) {
                            resolve({ success: true, payload: Buffer.alloc(32) });
                        } else {
                            signal?.addEventListener('abort', () => {
                                resolve({ success: false, message: 'Aborted by signal in API' });
                            });
                            abortController.abort();
                        }
                    }),
            );

            thpState.setExpectedResponses([0x20]);

            const result = await receiveThpMessage({
                thpState,
                apiRead,
                apiWrite,
                signal: abortController.signal,
            });

            expect(apiRead).toHaveBeenCalledTimes(5);
            expect(result).toMatchObject({ success: false, message: 'Aborted by signal in API' });
        });

        it('api write failed', async () => {
            const readResult = Buffer.from('200c22000471913136', 'hex');
            thpState.setChannel(readResult.subarray(1, 3));
            thpState.setExpectedResponses([0x20]);

            const result = await receiveThpMessage({
                thpState,
                apiRead: () => Promise.resolve({ success: true, payload: readResult }),
                apiWrite: () => Promise.resolve({ success: false, error: 'unexpected error' }),
            });

            expect(result).toMatchObject({ success: false, error: 'unexpected error' });
        });

        it('success', async () => {
            const readResult = Buffer.from('200c22000471913136', 'hex');
            thpState.setChannel(readResult.subarray(1, 3));
            thpState.setExpectedResponses([0x20]);

            const result = await receiveThpMessage({
                thpState,
                apiRead: () => Promise.resolve({ success: true, payload: readResult }),
                apiWrite,
            });

            expect(apiWrite).toHaveBeenCalledTimes(1);
            expect(result).toMatchObject({ success: true });
        });

        it('success. Expected chunk received at 5th attempt', async () => {
            const readResult = Buffer.from('200c22000471913136', 'hex');
            thpState.setChannel(readResult.subarray(1, 3));
            thpState.setExpectedResponses([0x20]);

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

            const result = await receiveThpMessage({
                thpState,
                apiRead,
                apiWrite,
            });

            expect(apiRead).toHaveBeenCalledTimes(5);
            expect(apiWrite).toHaveBeenCalledTimes(1);
            expect(result).toMatchObject({ success: true });
        });

        it('success. ThpAck not required', async () => {
            const readResult = Buffer.from(
                '41ffff0022cb263fc1c42de1ac12340a045432543110001800200228022803280428017d8ccd6b',
                'hex',
            );
            thpState.setChannel(readResult.subarray(1, 3));
            thpState.setExpectedResponses([0x41]); // ThpCreateChannelResponse

            const result = await receiveThpMessage({
                thpState,
                apiRead: () => Promise.resolve({ success: true, payload: readResult }),
                apiWrite,
            });

            expect(apiWrite).toHaveBeenCalledTimes(0);
            expect(result).toMatchObject({ success: true });
        });
    });

    describe('sendThpMessage', () => {
        it('retransmission attempts limit reached', async () => {
            jest.useFakeTimers();

            const sendPromise = sendThpMessage({
                thpState,
                chunks: [
                    Buffer.from(
                        '00123700245123076b080f174d3a5e7e8906d4282f577b28f46135618cf10c00b4eeb08c62ea514194',
                        'hex',
                    ),
                ],
                apiWrite,
                apiRead,
            });

            await jest.advanceTimersByTimeAsync(11 * 3000); // (ATTEMPTS_LIMIT + 1) * THP_ACK_DEADLINE
            const result = await sendPromise;

            expect(result).toMatchObject({ success: false, message: 'Aborted by deadline' });
            expect(apiWrite).toHaveBeenCalledTimes(10);
        });

        it('ThpAck never received', async () => {
            jest.useFakeTimers();

            const apiRead = jest.fn(
                signal =>
                    new Promise<any>((_resolve, reject) => {
                        const listener = () => {
                            signal.removeEventListener('abort', listener);
                            reject(new Error('Aborted by signal inside API'));
                        };
                        signal?.addEventListener('abort', listener);
                    }),
            );

            const sendPromise = sendThpMessage({
                thpState,
                chunks: [
                    Buffer.from(
                        '00123700245123076b080f174d3a5e7e8906d4282f577b28f46135618cf10c00b4eeb08c62ea514194',
                        'hex',
                    ),
                ],
                apiWrite,
                apiRead,
            });

            await jest.advanceTimersByTimeAsync(20 * 3000); // (ATTEMPTS_LIMIT + 1) * THP_ACK_DEADLINE
            const result = await sendPromise;

            expect(result).toMatchObject({ success: false, message: 'Aborted by deadline' });
            expect(apiWrite).toHaveBeenCalledTimes(10);
        });

        it('api read failed', async () => {
            jest.useFakeTimers();

            const apiRead = jest.fn(
                () =>
                    new Promise<any>(resolve => {
                        resolve({ success: false, message: 'API read error' });
                    }),
            );

            const sendPromise = sendThpMessage({
                thpState,
                chunks: [
                    Buffer.from(
                        '00123700245123076b080f174d3a5e7e8906d4282f577b28f46135618cf10c00b4eeb08c62ea514194',
                        'hex',
                    ),
                ],
                apiWrite,
                apiRead,
            });

            await jest.advanceTimersByTimeAsync(10000);
            const result = await sendPromise;

            expect(result).toMatchObject({ success: false });
            expect(apiWrite).toHaveBeenCalledTimes(1);
            expect(apiRead).toHaveBeenCalledTimes(1);
        });

        it('api write failed', async () => {
            const apiWrite = jest.fn(
                () =>
                    new Promise<any>(resolve => {
                        resolve({ success: false, error: 'unexpected error' });
                    }),
            );

            const result = await sendThpMessage({
                thpState,
                chunks: [
                    Buffer.from(
                        '00123700245123076b080f174d3a5e7e8906d4282f577b28f46135618cf10c00b4eeb08c62ea514194',
                        'hex',
                    ),
                ],
                apiWrite,
                apiRead,
            });

            expect(result).toMatchObject({ success: false, error: 'unexpected error' });
            expect(apiRead).toHaveBeenCalledTimes(0);
        });

        it('aborted', async () => {
            jest.useFakeTimers();
            const abortController = new AbortController();
            const sendPromise = sendThpMessage({
                thpState,
                chunks: [
                    Buffer.from(
                        '00123700245123076b080f174d3a5e7e8906d4282f577b28f46135618cf10c00b4eeb08c62ea514194',
                        'hex',
                    ),
                ],
                apiWrite,
                apiRead,
                signal: abortController.signal,
            });

            await jest.advanceTimersByTimeAsync(4000);
            expect(apiWrite).toHaveBeenCalledTimes(2); // there was 1 retransmission

            abortController.abort();

            const result = await sendPromise;
            expect(result).toMatchObject({ success: false, message: 'Aborted by signal' });
        });

        it('success. ThpAck not required', async () => {
            const result = await sendThpMessage({
                thpState,
                chunks: [Buffer.from([0x40, 0, 0])],
                apiWrite,
                apiRead,
            });

            expect(apiWrite).toHaveBeenCalledTimes(1);
            expect(apiRead).toHaveBeenCalledTimes(0);
            expect(result).toMatchObject({ success: true });
        });

        it('success. ThpAck received', async () => {
            const readResult = Buffer.from('200c22000471913136', 'hex');
            thpState.setChannel(readResult.subarray(1, 3));
            thpState.setExpectedResponses([0x20]);

            const result = await sendThpMessage({
                thpState,
                chunks: [Buffer.from([0x04, 0, 0])],
                apiWrite,
                apiRead: () => Promise.resolve({ success: true, payload: readResult }),
            });

            expect(result).toMatchObject({ success: true });
        });
    });

    describe('parseThpMessage', () => {
        it('success decrypted', async () => {
            const readResult = Buffer.from(
                '41ffff0020b06fe019f6f7e1a333d60a0454335731180220002802280328042801ab2d478b',
                'hex',
            );

            const protobufRoot = parseConfigure({
                nested: protocolThp.getProtobufDefinitions(),
            });

            const result = await parseThpMessage({
                messages: protobufRoot,
                decoded: v2.decode(readResult),
                thpState,
            });

            expect(result.type).toEqual('ThpCreateChannelResponse');
        });

        it('success encrypted', async () => {
            const readResult = Buffer.from(
                '41ffff0020b06fe019f6f7e1a333d60a0454335731180220002802280328042801ab2d478b',
                'hex',
            );

            const protobufRoot = parseConfigure({
                nested: protocolThp.getProtobufDefinitions(),
            });

            const result = await parseThpMessage({
                messages: protobufRoot,
                decoded: v2.decode(readResult),
                thpState,
            });

            expect(result.type).toEqual('ThpCreateChannelResponse');
        });
    });
});
