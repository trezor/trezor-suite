/**
 * Comprehensive Unit Tests for ProtobufManager (@bufbuild implementation)
 * Tests verify equivalence with protobufjs implementation using REAL messages from messages.json
 *
 * This test should be removed once we have confidence in the new implementation and full coverage of all messages and enums.
 */

import { AnyDesc, ScalarType } from '@bufbuild/protobuf';
import * as ProtoBuf from 'protobufjs/light';

import * as messagesJson from '../messages.json';
import { RULE_PATCH } from '../scripts/protobuf-patches';
import { decode as decodeProtobufJs } from '../src/decode';
import { encode as encodeProtobufJs } from '../src/encode';
import { ProtobufManager } from '../src/manager';

type JsonFieldDefinition = {
    type?: string;
    rule?: string;
};

type JsonMessageDefinition = {
    fields?: Record<string, JsonFieldDefinition>;
    nested?: Record<string, JsonMessageDefinition | JsonEnumDefinition>;
};

type JsonEnumDefinition = {
    values?: Record<string, number>;
};

type JsonSchema = {
    nested?: Record<string, JsonMessageDefinition | JsonEnumDefinition>;
};

type TestPayload = Record<string, unknown>;

const messagesJsonSchema = messagesJson as unknown as JsonSchema;

const isJsonMessageDefinition = (
    definition: JsonMessageDefinition | JsonEnumDefinition | undefined,
): definition is JsonMessageDefinition => !!definition && 'fields' in definition;

const getMessageDefinition = (messageName: string): JsonMessageDefinition | undefined => {
    const definition = messagesJsonSchema.nested?.[messageName];
    if (!isJsonMessageDefinition(definition)) {
        return undefined;
    }

    return definition;
};

const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

const getDefaultValueForScalarType = (scalarType?: string): unknown => {
    switch (scalarType) {
        case 'string':
            return 'test';
        case 'bytes':
            return 'aa';
        case 'uint32':
        case 'int32':
        case 'sint32':
            return 0;
        case 'uint64':
        case 'int64':
        case 'sint64':
            return '0';
        case 'bool':
            return false;
        case 'float':
        case 'double':
            return 0.0;
        default:
            return undefined;
    }
};

const getAllProtoModules = () => {
    const modules: Record<string, Record<string, AnyDesc>> = {};

    // All available proto definition files
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

    protoFiles.forEach(name => {
        modules[name] = require(`../src/definitions/${name}_pb`);
    });

    return Object.values(modules);
};

describe('ProtobufManager comprehensive tests', () => {
    const allProtoModules = getAllProtoModules();
    const protobufManager = ProtobufManager();
    protobufManager.load(allProtoModules);

    const protobufJs = ProtoBuf.Root.fromJSON(messagesJson);

    const lookupType = (messageName: string): ProtoBuf.Type => {
        const reflectionObject = protobufJs.lookup(messageName);
        if (!(reflectionObject instanceof ProtoBuf.Type)) {
            throw new Error(`Type ${messageName} not found in protobufjs root.`);
        }

        return reflectionObject;
    };

    const buildPayloadFromBufSchema = (schema: { fields?: Array<any> }): TestPayload => {
        const payload: TestPayload = {};

        schema.fields?.forEach(field => {
            if (field.fieldKind === 'list') {
                if (field.name === 'address_n') {
                    payload[field.name] = [1];
                } else if (field.listKind === 'message') {
                    payload[field.name] = [];
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

    const getAllMessageNames = (): string[] => Object.keys(messagesJsonSchema.nested ?? {});

    const getAllEnumNames = () => {
        const schema = messagesJsonSchema;
        const enums = new Set<string>();

        Object.keys(schema.nested ?? {}).forEach(key => {
            const item = schema.nested?.[key];
            if (item && 'values' in item && !('fields' in item)) {
                enums.add(key);
            }
        });

        return Array.from(enums);
    };

    const messageExistsInBufbuild = (messageName: string): boolean => {
        try {
            protobufManager.findSchema(messageName);

            return true;
        } catch {
            return false;
        }
    };

    const enumExistsInBufbuild = (enumName: string): boolean => {
        const enumDef = protobufManager.findEnum(enumName);

        return enumDef !== undefined;
    };

    const isFieldRequired = (messageName: string, fieldName: string): boolean => {
        const patchKey = `${messageName}.${fieldName}`;

        // Check if there's an explicit patch (highest priority)
        if (patchKey in RULE_PATCH) {
            return RULE_PATCH[patchKey as keyof typeof RULE_PATCH] === 'required';
        }

        // Fallback: Check messages.json as primary source for proto2 field rules
        const messageDef = getMessageDefinition(messageName);
        if (!messageDef?.fields) {
            return false;
        }

        const field = messageDef.fields?.[fieldName];
        if (!field) {
            return false;
        }

        // Repeated fields are always optional
        if (field.rule === 'repeated') {
            return false;
        }

        return field.rule === 'required';
    };

    const getRequiredFields = (messageName: string): string[] => {
        const messageDef = getMessageDefinition(messageName);
        if (!messageDef?.fields) {
            return [];
        }

        return Object.keys(messageDef.fields ?? {}).filter(fieldName =>
            isFieldRequired(messageName, fieldName),
        );
    };

    const buildPayloadFromJsonDefinition = (
        messageName: string,
        messageDefinition: JsonMessageDefinition,
        requiredOnly: boolean,
    ): TestPayload => {
        const payload: TestPayload = {};

        Object.entries(messageDefinition.fields ?? {}).forEach(([fieldName, field]) => {
            if (requiredOnly && !isFieldRequired(messageName, fieldName)) {
                return;
            }

            if (field.rule === 'repeated') {
                payload[fieldName] = [];

                return;
            }

            const scalarValue = getDefaultValueForScalarType(field.type);
            if (scalarValue !== undefined) {
                payload[fieldName] = scalarValue;

                return;
            }

            const nestedTypeName = field.type ?? '';
            const nestedDefinition = messageDefinition.nested?.[nestedTypeName];

            if (isJsonMessageDefinition(nestedDefinition)) {
                payload[fieldName] = buildPayloadFromJsonDefinition(
                    nestedTypeName,
                    nestedDefinition,
                    false,
                );

                return;
            }

            payload[fieldName] = {};
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
            const messageDef = getMessageDefinition(messageName);
            if (!messageDef?.fields) {
                return null;
            }

            return buildPayloadFromJsonDefinition(messageName, messageDef, true);
        }
    };

    it('identify all available and missing messages in @bufbuild definitions', () => {
        const allMessages = getAllMessageNames();
        const missingMessages: string[] = [];
        const availableMessages: Array<{ name: string; requirementStatus: string }> = [];

        allMessages.forEach(msgName => {
            const requiredFields = getRequiredFields(msgName);
            const hasRequired = requiredFields.length > 0;
            const requirementStatus = hasRequired
                ? `required=[${requiredFields.join(', ')}]`
                : 'optional_only';

            if (messageExistsInBufbuild(msgName)) {
                availableMessages.push({ name: msgName, requirementStatus });
            } else {
                missingMessages.push(msgName);
            }
        });

        const allEnums = getAllEnumNames();
        const missingEnums: string[] = [];
        const availableEnums: Array<{ name: string; valueCount: number }> = [];

        allEnums.forEach(enumName => {
            if (enumExistsInBufbuild(enumName)) {
                const enumDef = protobufManager.findEnum(enumName);
                const valueCount = enumDef ? Object.keys(enumDef.values || {}).length : 0;
                availableEnums.push({ name: enumName, valueCount });
            } else {
                missingEnums.push(enumName);
            }
        });
        const failures: string[] = [];

        availableMessages.slice(0, 10).forEach(({ name: messageName }) => {
            const testData = buildMinimalTestData(messageName);

            if (!testData || Object.keys(testData).length === 0) {
                console.warn(`   ⊘ ${messageName} - skipped (no required fields to test)`);

                return;
            }

            try {
                const pbLookup = lookupType(messageName);
                const newEncoded = protobufManager.encode(messageName, testData);
                const oldEncoded = encodeProtobufJs(pbLookup, testData);
                const encodesMatch = newEncoded.message.compare(oldEncoded) === 0;

                const newDecoded = protobufManager.decode(messageName, newEncoded.message);
                const oldDecoded = decodeProtobufJs(pbLookup, oldEncoded);
                const decodesMatch =
                    JSON.stringify(newDecoded.message) === JSON.stringify(oldDecoded);

                if (!encodesMatch || !decodesMatch) {
                    failures.push(messageName);
                }
            } catch {
                failures.push(messageName);
            }
        });

        expect(failures.length).toBe(0);
        expect(availableMessages.length).toBeGreaterThan(0);
        expect(availableEnums.length).toBeGreaterThan(0);
    });

    describe('messages -> JSON round-trip', () => {
        const allMessages = getAllMessageNames().filter(name => messageExistsInBufbuild(name));

        const samplesToTest = allMessages;

        samplesToTest.forEach(messageName => {
            const testData = buildMinimalTestData(messageName);
            const requiredFields = getRequiredFields(messageName);

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
        const compositionTests = [
            {
                description: 'GetAddress with multisig (nested)',
                messageName: 'GetAddress',
                data: {
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
                },
            },
            {
                description: 'TxAckInput with nested input',
                messageName: 'TxAckInput',
                data: {
                    tx: {
                        input: {
                            prev_hash: '00',
                            prev_index: 0,
                            amount: 1000,
                        },
                    },
                },
            },
        ];

        compositionTests.forEach(({ description, messageName, data }) => {
            if (!messageExistsInBufbuild(messageName)) {
                return;
            }

            it(description, () => {
                const newResult = protobufManager.encode(messageName, data);
                const oldResult = encodeProtobufJs(lookupType(messageName), data);

                expect(newResult.message.compare(oldResult)).toEqual(0);
            });
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
                const exists = enumExistsInBufbuild(enumName);
                expect(exists).toBe(true);

                const enumDef = protobufManager.findEnum(enumName);
                const valueCount = enumDef ? Object.keys(enumDef.values || {}).length : 0;
                expect(enumDef).toBeDefined();
                expect(valueCount).toBeGreaterThan(0);
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

        [
            {
                description: 'matches protobufjs for unsafe uint64 decode',
                payload: { asset_name_bytes: 'aa', amount: '9223372036854775807' },
            },
            {
                description: 'matches protobufjs for unsafe sint64 decode',
                payload: { asset_name_bytes: 'aa', mint_amount: '-9223372036854775807' },
            },
            {
                description: 'matches protobufjs for mixed safe and unsafe 64-bit decode',
                payload: {
                    asset_name_bytes: 'aa',
                    amount: 42,
                    mint_amount: '-9223372036854775807',
                },
            },
        ].forEach(({ description, payload }) => {
            it(description, () => {
                const messageType = lookupType('CardanoToken');
                const encoded = encodeProtobufJs(messageType, payload);

                const protobufJsDecoded = decodeProtobufJs(messageType, encoded);
                const managerDecoded = protobufManager.decode('CardanoToken', encoded).message;

                expect(managerDecoded).toEqual(protobufJsDecoded);
            });
        });
    });
});
