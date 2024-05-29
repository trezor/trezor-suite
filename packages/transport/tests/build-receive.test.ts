import { parseConfigure } from '@trezor/protobuf';
import * as protocols from '@trezor/protocol';

import { receiveAndParse } from '../src/utils/receive';
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

// const getMessages = (nested: Record<string, any>) => {
//     return protobuf.Root.fromJSON({
//         nested: { hw: { nested: { trezor: { nested: { messages: { nested: nested } } } } } },
//     });
// };

describe('encoding json -> protobuf -> json', () => {
    fixtures.slice(0, 0).forEach(f => {
        describe(`${f.name} - payload length ${f.in.source_account.length}`, () => {
            test('bridgeProtocol: buildMessage - receiveAndParse', async () => {
                const result = buildMessage({
                    messages: parsedMessages,
                    name: f.name,
                    data: f.in,
                    protocol: protocols.bridge,
                });
                const { length } = Buffer.from(f.in.source_account);
                // result length cannot be less than message header/constant (28) + variable source_account length
                // additional bytes are expected (encoded Uint32) if message length is greater
                expect(result.length).toBeGreaterThanOrEqual(28 + length);
                const decoded = await receiveAndParse(
                    parsedMessages,
                    () => Promise.resolve({ success: true, payload: result }),
                    protocols.bridge,
                );
                if (!decoded.success) {
                    throw new Error('Decoding failed');
                }
                const { type, message } = decoded.payload;
                // then decode message and check, whether decoded message matches original json
                expect(type).toEqual(f.name);
                expect(message).toEqual(f.in);
            });

            test('protocol-v1: buildMessage - createChunks - receiveAndParse', async () => {
                const result = buildMessage({
                    messages: parsedMessages,
                    name: f.name,
                    data: f.in,
                    protocol: protocols.v1,
                });
                const [, chunkHeader] = protocols.v1.getHeaders(result);
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

                        return Promise.resolve({ success: true, payload: chunks[i] });
                    },
                    protocols.v1,
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

    it('protocol-v1: unexpected chunk header', async () => {
        const msg = buildMessage({
            messages: parsedMessages,
            name: 'StellarPaymentOp',
            data: {
                source_account: 'm'.repeat(100), // make message longer then 64 bytes
                asset: {
                    type: 'NATIVE',
                },
            },
            protocol: protocols.v1,
        });

        // const customName = buildMessage({
        //     messages: parsedMessages,
        //     name: 'Foo',
        //     data: {},
        //     encode: protocolV1.encode,
        // });

        const chunks = createChunks(msg, protocols.v1.getHeaders(msg)[1], 64);
        let i = -1;
        const decodedWithError = receiveAndParse(
            parsedMessages,
            () => {
                i++;
                // second chunk starts with invalid header
                if (i > 0)
                    return Promise.resolve({
                        success: true,
                        payload: Buffer.from('FF00000000', 'hex'),
                    });

                return Promise.resolve({ success: true, payload: chunks[i] });
            },
            protocols.v1,
        );

        await expect(decodedWithError).rejects.toThrow('Unexpected chunkHeader ff');
    });

    it('protocol-v2 THP encoded message', async () => {
        const protobufRoot = parseConfigure({
            nested: protocols.thp.getProtobufDefinitions(),
        });

        const decodedResponse = await receiveAndParse(
            protobufRoot,
            () =>
                // ThpHandshakeInit request
                Promise.resolve({
                    success: true,
                    // ThpCreateChannelResponse
                    payload: Buffer.from(
                        '41ffff0020b06fe019f6f7e1a333d60a0454335731180220002802280328042801ab2d478b000000000000000000000000000000000000000000000000000000',
                        'hex',
                    ),
                }),
            protocols.v2,
            new protocols.thp.ThpState(),
        );
        if (!decodedResponse.success) throw new Error(decodedResponse.error);

        expect(decodedResponse.payload.type).toEqual('ThpCreateChannelResponse');
    });

    it('protocol-v2 THP decode encrypted chunked message', async () => {
        const protobufRoot = parseConfigure({
            nested: {
                Features: {
                    fields: {
                        model: {
                            type: 'string',
                            id: 21,
                        },
                    },
                },
                MessageType: {
                    values: {
                        Features: 17,
                    },
                },
            },
        });

        const fromHex = (s: string) => Buffer.from(s, 'hex');
        const readChunks = [
            '0433d901131e67a0c3fee04d1b2d3b2999300e090bd1b49ecd4d74bd1f73a147b248bcb27699ae3d5cae4b8ecfc25003a6de486a08ffca1d68d2210caec3d8d3',
            '8033d93a29831a282fb6a5bd21eb2967260a9b3cf9218d53896a4d38a185a1f2003399e2f1503824015bc5c1bf169b8a438864f3db4d9502bb9fa4b4768ab358',
            '8033d93e3f61c07fea1b8d0a0a50666bec47b71a0bbf189b281d55ceaaca5fee3fb05c271834e7b3ec5d8fc81d8c52d1f17aab09fc271d2f8831448f37ab7fb0',
            '8033d97dff911d03897a76f6856e9d9542dfbad6db11bbd05ab3512745ab5e0b3e3d0e928283b3f125c3c0a255abe583889c8df61988885fcc245d3f98774c86',
            '8033d93c2d057312ce835973a7bb65ab4d54e1531fdfc8a8562b6ea4f6efa6eaa6e54df300000000000000000000000000000000000000000000000000000000',
        ];

        const thpState = new protocols.thp.ThpState();
        thpState.deserialize({
            expectedResponses: [4, 128],
            channel: '33d9',
            sendBit: 0,
            sendNonce: 8,
            recvBit: 0,
            recvNonce: 9,
            credentials: [],
        });

        thpState.updateHandshakeCredentials({
            pairingMethods: [2, 3, 4, 1],
            handshakeHash: Buffer.from(
                '4ae329700a8e44b29f9ba5dd0b061981c28afbb53e4b08321f227e9b02e6ce1b',
                'hex',
            ),
            handshakeCommitment: fromHex(
                '84f9d23a4ae55abe0d64bfd638bfe957fa411e3dffe3d55ea18b406a81b1c0e8',
            ),
            codeEntryChallenge: fromHex(
                'cda6bf1ef424b0d5e386bba84168dc836aca8fd2461b9dca6094d3873a5169b1',
            ),
            trezorEncryptedStaticPubkey: fromHex(
                'abf87ff8f12b60250082de24d72acfe93f011edad992c6a623cac5f92bae2ac9c167ecabfd1b8a5e1cc84ec127f8b9f3',
            ),
            hostEncryptedStaticPubkey: fromHex(
                '13904b6ed122e80fc30406d392a96f97905497b07b52ac805fffee164fe55bf5053ca372131fcf3455381c08aa9eb45e',
            ),
            staticKey: fromHex('0007070707070707070707070707070707070707070707070707070707070747'),
            hostStaticPublicKey: fromHex(
                '13be4feaeaf204c7fd3358fc9c00721881d174278128227ec674f37f7fe97b6d',
            ),
            hostKey: fromHex('2551bf5f45be0a48cdf95b8f05343644190e2f3a6c8ff035289e3cf8c1278768'),
            trezorKey: fromHex('278f29355fc9a15c04e1a37bcc0544e6bb9a513e699cbe0944980932d4e96b25'),
            trezorCpacePublicKey: fromHex(
                '9f1694714ba53db340bebe4d29ed89a14a5f2def0e159ac4ceb7da756bfa0135',
            ),
        });

        let i = 0;
        const decodedResponse = await receiveAndParse(
            protobufRoot,
            () => {
                const data = readChunks[i];
                i++;

                return Promise.resolve({ success: true, payload: fromHex(data) });
            },
            protocols.v2,
            thpState,
        );
        if (!decodedResponse.success) throw new Error(decodedResponse.error);

        expect(decodedResponse.payload.type).toEqual('Features');
        expect(decodedResponse.payload.message).toEqual({
            model: 'T3W1',
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
