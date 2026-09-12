import { protobufManager } from '@trezor/protobuf';
import * as stellarProto from '@trezor/protobuf/src/definitions/messages-stellar_pb';
import * as messagesProto from '@trezor/protobuf/src/definitions/messages_pb';
import { bridge as bridgeProtocol, v1 as protocolV1, v2 as protocolV2 } from '@trezor/protocol';

import { receive, receiveAndParse } from './receive';
import { buildMessage, createChunks } from './send';

protobufManager.load([messagesProto, stellarProto]);

const fixtures = Array(100)
    .fill(undefined)
    .map((_u, i) => ({
        name: 'StellarPaymentOp',
        in: {
            source_account: 'm'.repeat(13 * i), // make message longer then 64 bytes
            destination_account: 'wuff',
            asset: {
                type: 'NATIVE',
                code: 'hello',
                issuer: 'world',
            },
            amount: 10,
        },
    }));

describe('encoding json -> protobuf -> json', () => {
    fixtures.forEach(f => {
        describe(`${f.name} - payload length ${f.in.source_account.length}`, () => {
            test('bridgeProtocol: buildMessage - receiveAndParse', async () => {
                const result = buildMessage({
                    name: f.name,
                    data: f.in,
                    protocol: bridgeProtocol,
                });
                const { length } = Buffer.from(f.in.source_account);
                // result length cannot be less than message header/constant (28) + variable source_account length
                // additional bytes are expected (encoded Uint32) if message length is greater
                expect(result.length).toBeGreaterThanOrEqual(28 + length);
                const decoded = await receiveAndParse(
                    () => Promise.resolve({ success: true, payload: result }),
                    bridgeProtocol,
                );
                if (!decoded.success) {
                    throw new Error('Decoding failed');
                }
                const { type, message } = decoded.payload;
                // then decode message and check, whether decoded message matches original json
                expect(type).toEqual(f.name);
                expect(message).toEqual(f.in);
            });

            test('v1Protocol: buildMessage - createChunks - receiveAndParse', async () => {
                const result = buildMessage({
                    name: f.name,
                    data: f.in,
                    protocol: protocolV1,
                });
                const [, chunkHeader] = protocolV1.getHeaders(result);
                const chunks = createChunks(result, chunkHeader, 64);
                // each protocol chunks are equal 64 bytes
                chunks.forEach(chunk => {
                    expect(chunk.length).toEqual(64);
                });
                let i = -1;
                const decoded = await receiveAndParse(() => {
                    i++;
                    // @ts-expect-error: indexing with noUncheckedIndexedAccess
                    const chunk: Buffer = chunks[i];

                    return Promise.resolve({ success: true, payload: chunk });
                }, protocolV1);
                if (!decoded.success) {
                    throw new Error('Decoding failed');
                }
                const { type, message } = decoded.payload;
                // then decode message and check, whether decoded message matches original json
                expect(type).toEqual(f.name);
                expect(message).toEqual(f.in);
            });
        });
    });
});

describe('receive', () => {
    const getApiRead = (chunks: string[]) =>
        jest.fn(() =>
            Promise.resolve({
                success: true,
                payload: Buffer.from(chunks.shift() || 'dead', 'hex'),
            } as const),
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('protocol-v1 ne chunk', async () => {
        const result = await receive(getApiRead(['3f23230002000000060a046d656f77']), protocolV1);
        expect(result).toMatchObject({
            success: true,
            payload: { messageType: 2 },
        });
    });

    test('protocol-v1 multiple chunks', async () => {
        const result = await receive(
            getApiRead(['3f23230002000000060a', '3f046d65', '3f6f77']),
            protocolV1,
        );
        expect(result).toMatchObject({
            success: true,
            payload: { messageType: 2 },
        });
    });

    test('protocol-v1 malformed initial packet', async () => {
        const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
        // protocol-v2 message
        const result = await receive(getApiRead(['2833da0004527eb068']), protocolV1);
        expect(result.success).toBe(false);
        expect(spyWarn).toHaveBeenCalledTimes(1);
    });

    test('protocol-v1 malformed continuation packet', async () => {
        const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
        // missing 3f in second chunk
        const result = await receive(
            getApiRead(['3f23230002000000060a', '046d656f77']),
            protocolV1,
        );
        expect(result.success).toBe(false);
        expect(spyWarn).toHaveBeenCalledTimes(1);
    });

    test('protocol-v1 handle packet loss', async () => {
        const apiRead = getApiRead([
            '3f23230002000000060a',
            '3f046d65',
            '3f23230002000000060a', // first chunk again
            '3f046d65',
            '3f6f77',
        ]);
        const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
        const result = await receive(apiRead, protocolV1);
        expect(result).toMatchObject({
            success: true,
            payload: { messageType: 2 },
        });
        expect(apiRead).toHaveBeenCalledTimes(5);
        expect(spyWarn).toHaveBeenCalledTimes(1);
        if (result.success) {
            expect(result.payload.payload.subarray(0, result.payload.length).toString('hex')).toBe(
                '0a046d656f77',
            );
        }
    });

    test('protocol-v1 continuation chunk that coincidentally starts with the message header bytes is not mistaken for a restart', async () => {
        // Regression test: comparing only the 3-byte protocol-v1 header (3f 23 23) against a
        // continuation chunk's leading bytes would false-positive on any genuine continuation
        // chunk whose payload happens to start with 23 23, discarding real data. The fix must
        // compare against the full saved first-packet bytes, so a match on only the first 3
        // bytes is not enough to trigger a restart.
        const apiRead = getApiRead([
            '3f23230002000000060a', // first packet: header 3f2323, type 0002, length 6, payload byte 0a
            '3f232301020304', // continuation: chunkHeader 3f + payload 23 23 01 02 03 04 (7 bytes)
        ]);
        const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
        const result = await receive(apiRead, protocolV1);
        expect(result).toMatchObject({
            success: true,
            payload: { messageType: 2 },
        });
        expect(apiRead).toHaveBeenCalledTimes(2);
        expect(spyWarn).not.toHaveBeenCalled();
        if (result.success) {
            // 1 payload byte from the first packet (0a) + 5 bytes from the continuation
            // (23 23 01 02 03 - Buffer.copy truncates to the remaining 5-byte capacity of the
            // 6-byte result buffer, dropping the continuation's trailing 04, which is expected
            // and unrelated to this fix)
            expect(result.payload.payload.subarray(0, result.payload.length).toString('hex')).toBe(
                '0a2323010203',
            );
        }
    });

    test('protocol-v1 SHORT continuation chunk that coincidentally shares the header prefix is not mistaken for a restart', async () => {
        // Regression test: comparing only a length-capped prefix (min(chunk length, first
        // packet length)) would still false-positive when a short continuation chunk's entire
        // content happens to equal the first bytes of a longer first packet. Real chunked
        // transports pad every packet - first and continuation alike - to the same fixed chunk
        // size (see `createChunks`), so a genuine retransmit is always the SAME length as the
        // original first packet; the fix must require an exact length match (not just a
        // prefix match) before comparing content, so a differently-sized continuation - even
        // one that is a byte-for-byte prefix of the first packet - is never mistaken for one.
        const apiRead = getApiRead([
            '3f23230002000000030a', // first packet (10 bytes): header 3f2323, type 0002, length 3, payload byte 0a
            '3f2323', // SHORT continuation (3 bytes): chunkHeader 3f + payload 23 23 - identical prefix, different length
        ]);
        const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
        const result = await receive(apiRead, protocolV1);
        expect(result).toMatchObject({
            success: true,
            payload: { messageType: 2 },
        });
        expect(apiRead).toHaveBeenCalledTimes(2);
        expect(spyWarn).not.toHaveBeenCalled();
        if (result.success) {
            expect(result.payload.payload.subarray(0, result.payload.length).toString('hex')).toBe(
                '0a2323',
            );
        }
    });

    test('protocol-bridge multi-read message is not mistaken for a restart on every chunk', async () => {
        // Regression test: protocol-bridge has no chunk framing at all (getHeaders returns two
        // empty buffers), so a naive header-match restart check (empty buffer compared against
        // an empty slice) is always "equal" and would treat every single chunk as a restart,
        // resetting offset forever and never completing reception.
        const result = buildMessage({
            name: 'StellarPaymentOp',
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            data: fixtures[0].in,
            protocol: bridgeProtocol,
        });
        // split the encoded message into two reads, well past the 6-byte bridge header
        const splitAt = 10;
        const apiRead = getApiRead([
            result.subarray(0, splitAt).toString('hex'),
            result.subarray(splitAt).toString('hex'),
        ]);
        const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
        const decoded = await receiveAndParse(apiRead, bridgeProtocol);
        expect(apiRead).toHaveBeenCalledTimes(2);
        expect(spyWarn).not.toHaveBeenCalled();
        if (!decoded.success) {
            throw new Error('Decoding failed');
        }
        expect(decoded.payload.type).toEqual('StellarPaymentOp');
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        expect(decoded.payload.message).toEqual(fixtures[0].in);
    });

    test('protocol-v2 receive one chunk', async () => {
        const result = await receive(getApiRead(['2833da0004527eb068']), protocolV2);
        expect(result).toMatchObject({
            success: true,
            payload: { messageType: 32 },
        });
    });

    test('protocol-v2 multiple chunks', async () => {
        const apiRead = getApiRead(['2833da0004', '8033da527e', '8033dab068']);
        const result = await receive(apiRead, protocolV2);
        expect(result).toMatchObject({
            success: true,
            payload: { messageType: 32 },
        });
        expect(apiRead).toHaveBeenCalledTimes(3);
    });

    test('protocol-v2 handle packet loss', async () => {
        const apiRead = getApiRead([
            '2833da0004',
            '8033da527e',
            '2833da0004', // first chunk again
            '8033da527e',
            '2833da0004', // first chunk again
            '8033da527e',
            '8033dab068',
        ]);
        const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
        const result = await receive(apiRead, protocolV2);
        expect(result).toMatchObject({
            success: true,
            payload: { messageType: 32 },
        });
        expect(apiRead).toHaveBeenCalledTimes(7);
        expect(spyWarn).toHaveBeenCalledTimes(2);
    });

    test('protocol-v2 malformed initial packet', async () => {
        // protocol-v1 message
        const apiRead = getApiRead(['3f0000']);
        const result = await receive(apiRead, protocolV2);
        expect(result.success).toBe(false);
        expect(apiRead).toHaveBeenCalledTimes(1);
    });

    test('protocol-v2 malformed continuation packet', async () => {
        // missing second chunk is protocol-v1
        let apiRead = getApiRead(['2833da0004', '3f00000000']);
        let result = await receive(apiRead, protocolV2);
        expect(result.success).toBe(false);
        expect(apiRead).toHaveBeenCalledTimes(2);

        // third chunk is missing
        apiRead = getApiRead(['2833da0004', '8033da52']);
        result = await receive(apiRead, protocolV2);
        expect(result.success).toBe(false);
        expect(apiRead).toHaveBeenCalledTimes(3);
    });
});

describe('createChunks', () => {
    const chunkHeader = Buffer.from([63]);

    test('small packet = one chunk', () => {
        const result = createChunks(Buffer.alloc(63).fill(0x12), chunkHeader, 64);
        expect(result.length).toBe(1);
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstChunk: Buffer = result[0];
        expect(firstChunk.toString('hex')).toBe('12'.repeat(63) + '00');
    });

    test('exact packet = one chunk', () => {
        const result = createChunks(Buffer.alloc(64), chunkHeader, 64);
        expect(result.length).toBe(1);
    });

    test('byte overflow = two chunks', () => {
        const result = createChunks(Buffer.alloc(65).fill('a0a1'), chunkHeader, 64);
        expect(result.length).toBe(2);
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const secondChunk: Buffer = result[1];
        // header + last byte from data
        expect(secondChunk.subarray(0, 2).toString('hex')).toBe('3f61');
        // the rest is filled with 00
        expect(secondChunk.subarray(2).toString('hex')).toBe('00'.repeat(62));
    });

    test('exact packet, big chunkHeader = two chunks', () => {
        const result = createChunks(
            Buffer.alloc(64 + 64 - 7).fill(0x12),
            Buffer.alloc(7).fill(0x73),
            64,
        );
        expect(result.length).toBe(2);
    });

    test('byte overflow, big chunkHeader = three chunks', () => {
        const result = createChunks(
            Buffer.alloc(64 * 2 - 6).fill(0x12),
            Buffer.alloc(7).fill(0x73),
            64,
        );
        expect(result.length).toBe(3);
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const thirdChunk: Buffer = result[2];
        expect(thirdChunk.subarray(0, 8).toString('hex')).toBe('7373737373737312');
        expect(thirdChunk.subarray(8).toString('hex')).toBe('00'.repeat(64 - 8));
    });

    test('chunkSize not set = one chunk', () => {
        const result = createChunks(Buffer.alloc(128).fill(0x12), Buffer.alloc(7).fill(0x73), 0);
        expect(result.length).toBe(1);
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstChunk: Buffer = result[0];
        expect(firstChunk.byteLength).toBe(128);
    });
});
