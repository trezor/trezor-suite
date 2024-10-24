import * as protobuf from 'protobufjs/light';
import { v1 as v1Protocol, v2 as v2Protocol, bridge as bridgeProtocol } from '@trezor/protocol';
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
                    protocol: v1Protocol,
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

    it.only('v1Protocol: unexpected chunk header', async () => {
        const msg = buildMessage({
            messages: parsedMessages,
            name: 'StellarPaymentOp',
            data: {
                source_account: 'm'.repeat(100), // make message longer then 64 bytes
                asset: {
                    type: 'NATIVE',
                },
            },
            protocol: v1Protocol,
        });

        // const customName = buildMessage({
        //     messages: parsedMessages,
        //     name: 'Foo',
        //     data: {},
        //     encode: v1Protocol.encode,
        // });

        const chunks = createChunks(msg, v1Protocol.getChunkHeader(msg), 64);
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
            v1Protocol,
        );

        await expect(decodedWithError).rejects.toThrow('Unexpected chunk header ff');
    });

    it('v2Protocol THP encoded message', async () => {
        // const protobufRoot = getMessages({
        //     ThpCreateNewSession: {
        //         fields: {},
        //     },
        //     MessageType: {
        //         values: {},
        //     },
        // });
        const protobufRoot = protobuf.Root.fromJSON({
            nested: {
                ThpCreateNewSession: {
                    fields: {
                        passphrase: {
                            type: 'string',
                            id: 1,
                        },
                        on_device: {
                            type: 'bool',
                            id: 2,
                        },
                    },
                },
                ThpNewSession: {
                    fields: {
                        new_session_id: {
                            type: 'uint32',
                            id: 1,
                        },
                    },
                },
                MessageType: {
                    values: {
                        MessageType_ThpCreateNewSession: 1006,
                        MessageType_ThpNewSession: 1007,
                    },
                },
            },
        });
        // const chunks = buildBuffers(
        //     protobufRoot,
        //     'ThpCreateNewSession',
        //     {
        //         on_device: false,
        //         passphrase: 'pass1234',
        //     },
        //     v2Protocol.encode,
        //     Buffer.from('1234', 'hex'),
        //     0,
        // );

        // const decodedChunks = await receiveAndParse(
        //     protobufRoot,
        //     () => {
        //         return Promise.resolve(chunks[0]);
        //     },
        //     v2Protocol.decode,
        // );
        // expect(decodedChunks.type).toEqual('ThpCreateNewSession');

        const decodedResponse = await receiveAndParse(
            protobufRoot,
            () => {
                // ThpHandshakeInit request
                return Promise.resolve({
                    success: true,
                    payload: Buffer.from(
                        '00123600240011223344556677001122334455667700112233445566770011223344556677bcd7510a',
                        'hex',
                    ),
                });
                // ThpHandshakeInit response
                // return Promise.resolve(
                //     Buffer.from(
                //         '0212340064000102030405060708091011121314151617181920212223242526272829303100010203040506070809101112131415161718192021222324252627282930313233343536373839404142434445464700010203040506070809101112131415f3a834980000000000000000000000000000000000000000',
                //         'hex',
                //     ),
                // );
                // ThpNewSession
                // return Promise.resolve(
                //     Buffer.from(
                //         '02123400190003ef0801a0a1a2a3a4a5a6a7a8a9b0b1b2b3b4b52d1e734300000000000000000000000000000000000000000000000000000000000000000000',
                //         'hex',
                //     ),
                // );
            },
            v2Protocol,
            // a => v2Protocol.decode(a, { messageType: 'ThpHandshakeInitRequest' }),
            // a => v2Protocol.decode(a, { messageType: 'ThpHandshakeInitResponse' }),
            // v2Protocol.decode,
        );
        console.warn('Desko', decodedResponse);
        // expect(decodedResponse.type).toEqual('ThpNewSession');
        // expect(decodedResponse.message).toEqual({ new_session_id: 1 });
    });

    it.skip('Control bit test', () => {
        const setControlBit = (magic: number, cb: number) => {
            return magic | (cb << 4);
        };
        const clearControlBit = (magic: number) => {
            return magic & ~(1 << 4);
        };
        const getControlBit = (magic: number) => {
            return (magic & (1 << 4)) === 0 ? 0 : 1;
        };

        const b = Buffer.from([0x20]);
        const val = b.readUint8();

        const evenBit = setControlBit(val, 0);
        const oddBit = setControlBit(val, 1);
        console.warn(
            'mask',
            val,
            evenBit,
            oddBit,
            clearControlBit(evenBit),
            clearControlBit(oddBit),
            getControlBit(evenBit),
            getControlBit(oddBit),
            Buffer.from([evenBit]),
            Buffer.from([oddBit]),
        );
    });

    it('v2Protocol THP decode encrypted chunked message', async () => {
        const protobufRoot = protobuf.Root.fromJSON({
            nested: {
                Features: {
                    fields: {},
                },
                MessageType: {
                    values: {
                        MessageType_Features: 17,
                    },
                },
            },
        });

        const chunks = [
            '04123400f40100110a097472657a6f722e696f1002180720013218333535433831373531304330454142463246313437313435380040014a05656e2d55536001',
            '8012346a14aa460940bddfe140c6c8f0b3c8eae17c6e0b19a4800101980100a00100aa010154ca0108454d554c41544f52d80100e00100e80100f00101f00102',
            '801234f00103f00104f00105f00107f00109f0010bf0010cf0010df0010ef0010ff00110f00111f00112f00113f0010af00106f80100800201880200900200a0',
            '8012340200a80200b002c0cf24b80200c00200c80200d00202d80200e2020454325431f802f0018003f001900301a0a1a2a3a4a5a6a7a8a9b0b1b2b3b4b5206e',
            '801234c7250000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        ];

        let i = 0;

        const decodedResponse = await receiveAndParse(
            protobufRoot,
            () => {
                const data = chunks[i];
                i++;

                return Promise.resolve({ success: true, payload: Buffer.from(data, 'hex') });
            },
            v2Protocol,
        );
        console.warn('Desko', decodedResponse);
    });

    it('v2Protocol THP decode message', () => {
        const protobufRoot = protobuf.Root.fromJSON({
            nested: {
                ThpCreateNewSession: {
                    fields: {
                        passphrase: {
                            type: 'string',
                            id: 1,
                        },
                        on_device: {
                            type: 'bool',
                            id: 2,
                        },
                    },
                },
                ThpNewSession: {
                    fields: {
                        new_session_id: {
                            type: 'uint32',
                            id: 1,
                        },
                    },
                },
                ThpPairingMethod: {
                    values: {
                        NoMethod: 1,
                        CodeEntry: 2,
                        QrCode: 3,
                        NFC_Unidirectional: 4,
                    },
                },
                ThpDeviceProperties: {
                    fields: {
                        internal_model: {
                            type: 'string',
                            id: 1,
                        },
                        model_variant: {
                            type: 'uint32',
                            id: 2,
                        },
                        bootloader_mode: {
                            type: 'bool',
                            id: 3,
                        },
                        protocol_version: {
                            type: 'uint32',
                            id: 4,
                        },
                        pairing_methods: {
                            rule: 'repeated',
                            type: 'ThpPairingMethod',
                            id: 5,
                            options: {
                                packed: false,
                            },
                        },
                    },
                },
                MessageType: {
                    values: {
                        MessageType_ThpCreateNewSession: 1006,
                        MessageType_ThpNewSession: 1007,
                    },
                },
            },
        });

        const payloads = [
            // {
            //     mt: undefined, // ThpCreateChannel request
            //     data: '40ffff000caec4aa900a8b52c2e9c11503',
            // },
            // {
            //     mt: undefined, // ThpCreateChannel response
            //     data: '41ffff001eaec4aa900a8b52c212360a0454335731100518002001280128028418cccc',
            // },
            // {
            //     mt: 'ThpHandshakeInitRequest',
            //     data: '00123600240011223344556677001122334455667700112233445566770011223344556677bcd7510a',
            // },
            // 01123500640001020304050607080910111213141516171819202122232425262728293031000102030405060708091011121314151617181920212223242526
            // 801235272829303132333435363738394041424344454647000102030405060708091011121314154ee1a35a0000000000000000000000000000000000000000
            {
                mt: undefined, // 'ThpHandshakeInitResponse',
                data: '01123500640001020304050607080910111213141516171819202122232425262728293031000102030405060708091011121314151617181920212223242526',
            },
        ];

        payloads.forEach(async f => {
            const decodedResponse = await receiveAndParse(
                protobufRoot,
                () => {
                    return Promise.resolve({ success: true, payload: Buffer.from(f.data, 'hex') });
                },
                // a => v2Protocol.decode(a, { messageType: f.mt }),
                v2Protocol,
            );
            console.warn('Desko', decodedResponse);
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
