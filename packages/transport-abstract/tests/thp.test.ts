import { protobufManager } from '@trezor/protobuf';
import * as thpProto from '@trezor/protobuf/src/definitions/messages-thp_pb';
import { thp as protocolThp, v2 } from '@trezor/protocol';

import { parseThpMessage, receiveThpMessage, sendThpMessage } from '../src/thp';
import {
    ATTEMPTS_LIMIT,
    THP_ACK_DEADLINE,
    THP_ACK_TIMEOUT,
} from '../src/thp/receiveExpectedMessage';

protobufManager.load([thpProto]);

describe('thp', () => {
    const HANDSHAKE_COMP_RES = Buffer.from(
        '13094b0015cc41d620b1ea28111d64e2faf6d34e06e371dd3c4f0000000000000000000000000000000000000000000000000000000000000000000000000000',
        'hex',
    );

    const THP_ACK = Buffer.from('200c22000471913136', 'hex');

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
                    resolve({ success: true, payload: THP_ACK });
                }, 100);
            }),
    );

    const apiWrite = jest.fn(() => Promise.resolve({ success: true } as any));

    beforeEach(() => {
        jest.clearAllMocks();
        thpState.resetState();
        thpState.setChannel(THP_ACK.subarray(1, 3));
    });

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
                                resolve({
                                    success: false,
                                    error: { code: 'Aborted by signal in API' },
                                });
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
            expect(result).toMatchObject({
                success: false,
                error: { code: 'Aborted by signal in API' },
            });
        });

        it('write ThpAck error', async () => {
            thpState.setChannel(HANDSHAKE_COMP_RES.subarray(1, 3));
            thpState.setExpectedResponses([0x03]);
            thpState.updateSyncBit('recv');

            const result = await receiveThpMessage({
                thpState,
                apiRead: () => Promise.resolve({ success: true, payload: HANDSHAKE_COMP_RES }),
                apiWrite: () =>
                    Promise.resolve({ success: false, error: { code: 'unexpected error' } }),
            });

            expect(result).toMatchObject({ success: false, error: { code: 'unexpected error' } });
        });

        it('success', async () => {
            thpState.setChannel(HANDSHAKE_COMP_RES.subarray(1, 3));
            thpState.setExpectedResponses([0x03]);
            thpState.updateSyncBit('recv');

            const result = await receiveThpMessage({
                thpState,
                apiRead: () => Promise.resolve({ success: true, payload: HANDSHAKE_COMP_RES }),
                apiWrite,
            });
            expect(apiWrite).toHaveBeenCalledTimes(1);
            expect(result).toMatchObject({ success: true });
        });

        it('success. Expected chunk received at 5th attempt', async () => {
            const readResult = Buffer.from(
                '13094b0015cc41d620b1ea28111d64e2faf6d34e06e371dd3c4f0000000000000000000000000000000000000000000000000000000000000000000000000000',
                'hex',
            );
            thpState.setChannel(readResult.subarray(1, 3));
            thpState.setExpectedResponses([0x03]);
            thpState.updateSyncBit('recv');

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
                apiRead: () =>
                    Promise.resolve({
                        success: true,
                        payload: Buffer.from('400c220004e8a3467b', 'hex'),
                    }),
            });

            await jest.advanceTimersByTimeAsync((ATTEMPTS_LIMIT + 1) * THP_ACK_DEADLINE);
            const result = await sendPromise;

            expect(result).toMatchObject({ success: false, error: { message: 'RetriesExceeded' } });
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

            await jest.advanceTimersByTimeAsync(THP_ACK_TIMEOUT + THP_ACK_DEADLINE); // (ATTEMPTS_LIMIT + 1) * THP_ACK_DEADLINE
            const result = await sendPromise;

            expect(result).toMatchObject({
                success: false,
                error: { message: 'Aborted by deadline' },
            });
            expect(apiWrite).toHaveBeenCalledTimes(3);
        });

        it('api read error', async () => {
            jest.useFakeTimers();

            const apiRead = jest.fn(
                () =>
                    new Promise<any>(resolve => {
                        resolve({ success: false, error: { code: 'API read error' } });
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

        it('api write error', async () => {
            const apiWrite = jest.fn(
                () =>
                    new Promise<any>(resolve => {
                        resolve({ success: false, error: { code: 'unexpected error' } });
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

            expect(result).toMatchObject({ success: false, error: { code: 'unexpected error' } });
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
                apiRead: (signal?: AbortSignal) =>
                    new Promise<any>((_resolve, reject) => {
                        const listener = () => {
                            signal?.removeEventListener('abort', listener);
                            reject(new Error('Aborted in api'));
                        };
                        signal?.addEventListener('abort', listener);
                    }),
                signal: abortController.signal,
            });

            await jest.advanceTimersByTimeAsync(11_000);
            expect(apiWrite).toHaveBeenCalledTimes(2); // there was 1 retransmission

            abortController.abort();

            const result = await sendPromise;
            expect(result).toMatchObject({ success: false, error: { code: 'Aborted in api' } });
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

            const result = await parseThpMessage({
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

            const result = await parseThpMessage({
                decoded: v2.decode(readResult),
                thpState,
            });

            expect(result.type).toEqual('ThpCreateChannelResponse');
        });
    });
});
