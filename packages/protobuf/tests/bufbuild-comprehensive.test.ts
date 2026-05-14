/**
 * Comprehensive Unit Tests for ProtobufManager (@bufbuild implementation)
 * Tests verify that all message types can be encoded/decoded, enums are available,
 * and error handling works correctly.
 */

import { AnyDesc, ScalarType } from '@bufbuild/protobuf';

import { ProtobufManager } from '../src/manager';

type TestPayload = Record<string, unknown>;

const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

const getAllProtoModules = () => {
    const protoFiles = [
        'messages-bitcoin',
        'messages-ble',
        'messages-bootloader',
        'messages-cardano',
        'messages-common',
        'messages-crypto',
        'messages-debug',
        'messages-definitions',
        'messages-eos',
        'messages-ethereum-eip712',
        'messages-ethereum',
        'messages-evolu',
        'messages-management',
        'messages-monero',
        'messages',
        'messages-ripple',
        'messages-solana',
        'messages-stellar',
        'messages-telemetry',
        'messages-tezos',
        'messages-thp',
        'messages-tron',
        'options',
    ];

    return protoFiles.map(
        name => require(`../src/definitions/${name}_pb`) as Record<string, AnyDesc>,
    );
};

describe('ProtobufManager comprehensive tests', () => {
    const allProtoModules = getAllProtoModules();
    const protobufManager = ProtobufManager();
    protobufManager.load(allProtoModules);

    const getAllMessageNames = (): string[] => {
        const names: string[] = [];
        allProtoModules.forEach(mod => {
            Object.values(mod).forEach(desc => {
                if (desc.kind === 'message') {
                    names.push(desc.name);
                }
            });
        });

        return [...new Set(names)];
    };

    const getRequiredFieldNames = (messageName: string): string[] => {
        try {
            const { schema } = protobufManager.findSchema(messageName);

            return schema.fields.filter(f => f.presence === 'LEGACY_REQUIRED').map(f => f.name);
        } catch {
            return [];
        }
    };

    const buildPayloadFromBufSchema = (schema: { fields?: Array<any> }): TestPayload => {
        const payload: TestPayload = {};

        schema.fields?.forEach(field => {
            if (field.fieldKind === 'list') {
                if (field.name === 'address_n') {
                    payload[field.name] = [1];
                } else {
                    payload[field.name] = [];
                }

                return;
            }

            if (field.fieldKind === 'message' && field.message) {
                payload[field.name] = buildPayloadFromBufSchema(field.message);

                return;
            }

            if (field.fieldKind === 'enum') {
                payload[field.name] = field.enum.values[0]?.number ?? 0;

                return;
            }

            if (field.scalar === ScalarType.STRING) {
                payload[field.name] = 'test';
            } else if (field.scalar === ScalarType.BYTES) {
                payload[field.name] = Buffer.from('aa', 'hex');
            } else if (field.scalar === ScalarType.INT32 || field.scalar === ScalarType.SINT32) {
                payload[field.name] = 0;
            } else if (field.scalar === ScalarType.UINT32) {
                payload[field.name] = 0;
            } else if (
                field.scalar === ScalarType.INT64 ||
                field.scalar === ScalarType.SINT64 ||
                field.scalar === ScalarType.UINT64
            ) {
                payload[field.name] = BigInt(0);
            } else if (field.scalar === ScalarType.BOOL) {
                payload[field.name] = false;
            } else if (field.scalar === ScalarType.FLOAT || field.scalar === ScalarType.DOUBLE) {
                payload[field.name] = 0.0;
            } else {
                payload[field.name] = null;
            }
        });

        return payload;
    };

    const buildMinimalTestData = (messageName: string): TestPayload | null => {
        try {
            const { schema } = protobufManager.findSchema(messageName);
            if (!schema?.fields) {
                return null;
            }

            return buildPayloadFromBufSchema(schema);
        } catch {
            return null;
        }
    };

    describe('messages -> JSON round-trip', () => {
        const allMessages = getAllMessageNames();

        allMessages.forEach(messageName => {
            const testData = buildMinimalTestData(messageName);
            const requiredFields = getRequiredFieldNames(messageName);

            if (!testData || Object.keys(testData).length === 0) {
                return;
            }

            it(`encode ${messageName} (required: ${requiredFields.join(', ') || 'none'})`, () => {
                try {
                    const result = protobufManager.encode(messageName, testData);
                    expect(result.message).toBeDefined();
                    expect(result.messageType).toBeDefined();
                } catch (error) {
                    console.warn(`${messageName}: ${getErrorMessage(error)}`);
                    throw error;
                }
            });

            it(`decode ${messageName} (required: ${requiredFields.join(', ') || 'none'})`, () => {
                try {
                    const encoded = protobufManager.encode(messageName, testData);
                    const decoded = protobufManager.decode(messageName, encoded.message);
                    expect(decoded.message).toBeDefined();
                    expect(decoded.type).toBe(messageName);
                } catch (error) {
                    console.warn(`${messageName}: ${getErrorMessage(error)}`);
                    throw error;
                }
            });
        });
    });

    describe('nested messages', () => {
        it('GetAddress with multisig (nested)', () => {
            const data = {
                address_n: [44, 0, 0],
                coin_name: 'Bitcoin',
                multisig: {
                    m: 1,
                    nodes: [
                        {
                            depth: 0,
                            fingerprint: 0,
                            child_num: 0,
                            chain_code: '00',
                            public_key: '00',
                        },
                    ],
                    pubkeys: [
                        {
                            address_n: [1],
                            node: {
                                depth: 1,
                                fingerprint: 1,
                                child_num: 1,
                                chain_code: '11',
                                public_key: '11',
                            },
                        },
                    ],
                    signatures: [''],
                    address_n: [0],
                    pubkeys_order: 'LEXICOGRAPHIC',
                },
            };

            const encoded = protobufManager.encode('GetAddress', data);
            const decoded = protobufManager.decode('GetAddress', encoded.message);
            expect(decoded.message).toMatchObject(data);
        });

        it('TxAckInput with nested input', () => {
            const data = {
                tx: {
                    input: {
                        prev_hash: '00',
                        prev_index: 0,
                        amount: 1000,
                    },
                },
            };

            const encoded = protobufManager.encode('TxAckInput', data);
            expect(encoded.message).toBeDefined();

            const decoded = protobufManager.decode('TxAckInput', encoded.message);
            expect(decoded.message).toMatchObject(data);
        });
    });

    describe('enum availability', () => {
        const criticalEnums = [
            'MessageType',
            'ThpMessageType',
            'InputScriptType',
            'OutputScriptType',
        ];

        criticalEnums.forEach(enumName => {
            it(`${enumName} - should exist in @bufbuild definitions`, () => {
                const enumDef = protobufManager.findEnum(enumName);
                expect(enumDef).toBeDefined();

                const valueCount = enumDef ? Object.keys(enumDef.values || {}).length : 0;
                expect(enumDef).toBeDefined();
                expect(valueCount).toBeGreaterThan(0);
            });
        });
    });

    describe('string encoding in ThpPairingRequest', () => {
        const messageName = 'ThpPairingRequest';

        const cases = [
            {
                description: 'encodes ASCII host_name and app_name',
                data: { host_name: 'Chrome', app_name: 'Trezor Suite' },
            },
            {
                description: 'encodes Unicode host_name',
                data: { host_name: 'Prohlížeč', app_name: 'Suite' },
            },
            {
                description: 'encodes empty strings',
                data: { host_name: '', app_name: '' },
            },
            {
                description: 'encodes host_name at 32-byte boundary',
                data: { host_name: 'a'.repeat(32), app_name: 'app' },
            },
            {
                description: 'encodes special characters in host_name',
                data: { host_name: 'My Browser (v1.0)', app_name: 'Trezor Suite - Desktop' },
            },
        ];

        cases.forEach(({ description, data }) => {
            it(description, () => {
                const encoded = protobufManager.encode(messageName, data);
                const decoded = protobufManager.decode(messageName, encoded.message);
                expect(decoded.message).toEqual(data);
            });
        });
    });

    describe('real device binary decode', () => {
        it('decodes real Features response from OneKey device', () => {
            const realDeviceBytes = Buffer.from(
                '0a097472657a6f722e696f1002186320633218343632444644393544434333363133323437423732463833380140004a02656e520a4f6e654b65792050726f60016a141ab6e1bf23f6b2b1187819b35d93fd1601d8adcd800101980100a00100aa010154d80100e00100e80100f00101f00102f00103f00104f00105f00106f00107f0010af0010bf0010cf0010df0010ef0010ff00110f001e807f00111f80100800201880200900200a00200a80200b002e0d403b80200c00200c80200aa1f0850726f2044304336b21f05322e332e36b81f01e21f06342e31392e30f21f05322e382e33fa1f0b5443423335423036313142b2200731616236653162ba2005312e362e32d0203ad82001e020e0a712c02505c82500d22505312e362e32e22505322e382e33f22505312e312e378a2606342e31392e30a2260b5052423335423036313142b2260850726f2044304336ba2605322e332e36d22605312e312e33da2605312e312e33e22605312e312e37882700902700',
                'hex',
            );

            const decoded = protobufManager.decode('Features', realDeviceBytes);
            expect(decoded.type).toBe('Features');
            expect(decoded.message).toBeDefined();
            // Verify key fields from the real device response
            expect(decoded.message).toMatchObject({
                vendor: 'trezor.io',
                major_version: 2,
                patch_version: 99,
                label: 'OneKey Pro',
                device_id: '462DFD95DCC3613247B72F83',
                pin_protection: true,
                initialized: true,
            });
        });
    });

    describe('error handling', () => {
        it('throws error for unknown message type on encode', () => {
            expect(() => {
                protobufManager.encode('NonexistentMessage', {});
            }).toThrow();
        });

        it('throws error for unknown message type on decode', () => {
            expect(() => {
                protobufManager.decode('NonexistentMessage', Buffer.from('00'));
            }).toThrow();
        });

        it('throws error for invalid message ID', () => {
            expect(() => {
                protobufManager.decode(9999, Buffer.from('00'));
            }).toThrow();
        });

        it('findEnum returns undefined for missing enum', () => {
            const result = protobufManager.findEnum('NonexistentEnum');
            expect(result).toBeUndefined();
        });

        it('handles unsafe uint64 decode', () => {
            const encoded = protobufManager.encode('CardanoToken', {
                asset_name_bytes: 'aa',
                amount: '9223372036854775807',
            });
            const decoded = protobufManager.decode('CardanoToken', encoded.message);
            expect(decoded.message).toMatchObject({
                asset_name_bytes: 'aa',
                amount: '9223372036854775807',
            });
        });

        it('handles unsafe sint64 decode', () => {
            const encoded = protobufManager.encode('CardanoToken', {
                asset_name_bytes: 'aa',
                mint_amount: '-9223372036854775807',
            });
            const decoded = protobufManager.decode('CardanoToken', encoded.message);
            expect(decoded.message).toMatchObject({
                asset_name_bytes: 'aa',
                mint_amount: '-9223372036854775807',
            });
        });
    });
});
