import * as protobuf from 'protobufjs/light';
import { v1 as v1Protocol, bridge as bridgeProtocol } from '@trezor/protocol';
import { buildMessage, createChunks } from '../src/utils/send';
import { receiveAndParse } from '../src/utils/receive';

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

const parsedMessages = protobuf.Root.fromJSON({
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
                    encode: bridgeProtocol.encode,
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
                    encode: v1Protocol.encode,
                });

                const chunks = createChunks(result, v1Protocol.getChunkHeader(result), 64);
                // each protocol chunks are equal 64 bytes
                chunks.forEach(chunk => {
                    expect(chunk.length).toEqual(64);
                });
                let i = -1;
                const decoded = await receiveAndParse(
                    parsedMessages,
                    () => {
                        i++;

                        return Promise.resolve({ success: true, payload: chunks[i] });
                    },
                    v1Protocol,
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

describe('createChunks', () => {
    const chunkHeader = Buffer.from([63]);

    test('small packet = one chunk', () => {
        const result = createChunks(Buffer.alloc(63).fill(0x12), chunkHeader, 64);
        expect(result.length).toBe(1);
        expect(result[0].toString('hex')).toBe('12'.repeat(63) + '00');
    });

    test('exact packet = one chunk', () => {
        const result = createChunks(Buffer.alloc(64), chunkHeader, 64);
        expect(result.length).toBe(1);
    });

    test('byte overflow = two chunks', () => {
        const result = createChunks(Buffer.alloc(65).fill('a0a1'), chunkHeader, 64);
        expect(result.length).toBe(2);
        // header + last byte from data
        expect(result[1].subarray(0, 2).toString('hex')).toBe('3f61');
        // the rest is filled with 00
        expect(result[1].subarray(2).toString('hex')).toBe('00'.repeat(62));
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
        expect(result[2].subarray(0, 8).toString('hex')).toBe('7373737373737312');
        expect(result[2].subarray(8).toString('hex')).toBe('00'.repeat(64 - 8));
    });

    test('chunkSize not set = one chunk', () => {
        const result = createChunks(Buffer.alloc(128).fill(0x12), Buffer.alloc(7).fill(0x73), 0);
        expect(result.length).toBe(1);
        expect(result[0].byteLength).toBe(128);
    });
});
