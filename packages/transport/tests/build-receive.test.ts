import { parseConfigure } from '@trezor/protobuf';
import { bridge as bridgeProtocol, v1 as protocolV1, v2 as protocolV2 } from '@trezor/protocol';

import { receive, receiveAndParse } from '../src/utils/receive';
import { buildMessage, createChunks } from '../src/utils/send';

const messages = {
    StellarPaymentOp: {
        fields: {
            source_account: {
                type: 'string',
                id: 1,
            },
            destination_account: {
                rule: 'required',
                type: 'string',
                id: 2,
            },
            asset: {
                rule: 'required',
                type: 'StellarAsset',
                id: 3,
            },
            amount: {
                rule: 'required',
                type: 'sint64',
                id: 4,
            },
        },
    },
    StellarAssetType: {
        values: {
            NATIVE: 0,
            ALPHANUM4: 1,
            ALPHANUM12: 2,
        },
    },
    StellarAsset: {
        fields: {
            type: {
                rule: 'required',
                type: 'StellarAssetType',
                id: 1,
            },
            code: {
                type: 'string',
                id: 2,
            },
            issuer: {
                type: 'string',
                id: 3,
            },
        },
    },
    MessageType: {
        values: {
            StellarSignTx: 202,
            StellarTxOpRequest: 203,
            StellarGetAddress: 207,
            StellarAddress: 208,
            StellarCreateAccountOp: 210,
            StellarPaymentOp: 211,
            StellarPathPaymentOp: 212,
            StellarManageOfferOp: 213,
            StellarCreatePassiveOfferOp: 214,
            StellarSetOptionsOp: 215,
            StellarChangeTrustOp: 216,
            StellarAllowTrustOp: 217,
            StellarAccountMergeOp: 218,
            StellarManageDataOp: 220,
            StellarBumpSequenceOp: 221,
            StellarClaimClaimableBalanceOp: 225,
            StellarSignedTx: 230,
        },
    },
};

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

const parsedMessages = parseConfigure({
    nested: { hw: { nested: { trezor: { nested: { messages: { nested: messages } } } } } },
});

describe('encoding json -> protobuf -> json', () => {
    fixtures.forEach(f => {
        describe(`${f.name} - payload length ${f.in.source_account.length}`, () => {
            test('bridgeProtocol: buildMessage - receiveAndParse', async () => {
                const result = buildMessage({
                    messages: parsedMessages,
                    name: f.name,
                    data: f.in,
                    protocol: bridgeProtocol,
                });
                const { length } = Buffer.from(f.in.source_account);
                // result length cannot be less than message header/constant (28) + variable source_account length
                // additional bytes are expected (encoded Uint32) if message length is greater
                expect(result.length).toBeGreaterThanOrEqual(28 + length);
                const decoded = await receiveAndParse(
                    parsedMessages,
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
                    messages: parsedMessages,
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
                const decoded = await receiveAndParse(
                    parsedMessages,
                    () => {
                        i++;
                        // @ts-expect-error: indexing with noUncheckedIndexedAccess
                        const chunk: Buffer = chunks[i];

                        return Promise.resolve({ success: true, payload: chunk });
                    },
                    protocolV1,
                );
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
        // protocol-v2 message
        const result = await receive(getApiRead(['2833da0004527eb068']), protocolV1);
        expect(result.success).toBe(false);
    });

    test('protocol-v1 malformed continuation packet', async () => {
        // missing 3f in second chunk
        const result = await receive(
            getApiRead(['3f23230002000000060a', '046d656f77']),
            protocolV1,
        );
        expect(result.success).toBe(false);
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
