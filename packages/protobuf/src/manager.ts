import {
    type AnyDesc,
    type DescEnum,
    type DescExtension,
    type DescField,
    type DescMessage,
    ScalarType,
    fromBinary,
    fromJson,
    toBinary,
    toJson,
} from '@bufbuild/protobuf';

import type { MessageResponse } from './definitions';

const patchLongValue = (value: unknown) => {
    if (typeof value === 'number') {
        return value;
    }

    const numericValue = Number(value);
    if (typeof value === 'bigint') {
        return Number.isSafeInteger(numericValue) ? numericValue : value.toString();
    }

    if (typeof value === 'string') {
        if (Number.isSafeInteger(numericValue)) {
            try {
                if (BigInt(value) === BigInt(numericValue)) {
                    return numericValue;
                }
            } catch {
                return value;
            }
        }

        return value;
    }

    return value;
};

const patchFieldForEncode = (field: DescField, value: unknown) => {
    if (value === undefined) {
        return value;
    }

    if (field.scalar === ScalarType.STRING) {
        if (typeof value === 'number') {
            return value.toString(); // Features.model
        }

        return value;
    }

    if (field.scalar === ScalarType.BYTES) {
        // Protobuf bytes fields are represented as hex strings in Suite payloads.
        // Convert to raw bytes before calling fromJson().
        if (typeof value === 'string') {
            return value.length === 0 ? Buffer.alloc(0) : Buffer.from(value, 'hex');
        }

        return Buffer.from(value as Uint8Array | number[]);
    }

    return value;
};

const patchFieldForDecode = (field: DescField, value: unknown) => {
    // [compatibility]: optional undefined keys should be null. Example: Features.fw_major.
    if (value === undefined) {
        return null;
    }

    if (field.scalar === ScalarType.BYTES) {
        // Keep backward compatibility: consumers expect bytes as lower-level hex strings.
        if (typeof value === 'string') {
            return Buffer.from(value, 'base64').toString('hex');
        }

        return Buffer.from(value as Uint8Array | number[]).toString('hex');
    }

    if (field.scalar === ScalarType.UINT32 || field.scalar === ScalarType.SINT32) {
        return Number(value);
    }

    if (
        field.scalar === ScalarType.INT64 ||
        field.scalar === ScalarType.UINT64 ||
        field.scalar === ScalarType.SINT64 ||
        field.scalar === ScalarType.FIXED64 ||
        field.scalar === ScalarType.SFIXED64
    ) {
        return patchLongValue(value);
    }

    return value;
};

const transformSchemaFields = (
    schema: DescMessage,
    sourceData: Record<string, unknown> | undefined,
    transformField: (field: DescField, value: unknown) => unknown,
) => {
    const transformedData: Record<string, unknown> = {};

    schema.fields.forEach(schemaField => {
        const fieldValue = sourceData?.[schemaField.name];

        if (schemaField.fieldKind === 'list') {
            if (!Array.isArray(fieldValue)) {
                transformedData[schemaField.name] = [];
            } else if (schemaField.listKind === 'message') {
                transformedData[schemaField.name] = fieldValue.map(item =>
                    transformSchemaFields(
                        schemaField.message,
                        item as Record<string, unknown> | undefined,
                        transformField,
                    ),
                );
            } else if (schemaField.listKind === 'scalar') {
                transformedData[schemaField.name] = fieldValue.map(item =>
                    transformField(schemaField, item),
                );
            } else {
                transformedData[schemaField.name] = fieldValue; // enum
            }
        } else if (schemaField.fieldKind === 'message') {
            transformedData[schemaField.name] = fieldValue
                ? transformSchemaFields(
                      schemaField.message,
                      fieldValue as Record<string, unknown>,
                      transformField,
                  )
                : undefined;
        } else if (schemaField.fieldKind === 'scalar') {
            transformedData[schemaField.name] = transformField(schemaField, fieldValue);
        } else if (schemaField.fieldKind === 'enum') {
            transformedData[schemaField.name] = fieldValue;
        } else {
            transformedData[schemaField.name] = fieldValue; // map
        }

        if (transformedData[schemaField.name] === undefined) {
            delete transformedData[schemaField.name];
        }
    });

    return transformedData;
};

export const ProtobufManager = () => {
    const messages: Record<string, DescMessage | undefined> = {};
    const extensions: Record<string, DescExtension | undefined> = {};
    const enums: Record<string, DescEnum | undefined> = {};

    const load = (modules: Record<string, AnyDesc> | Record<string, AnyDesc>[]) => {
        if (Array.isArray(modules)) {
            modules.forEach(m => load(m));
        } else {
            Object.keys(modules).forEach(key => {
                const def = modules[key];
                if (def.kind && def.kind !== 'file') {
                    if (def.kind === 'message') {
                        messages[key] = def;
                    } else if (def.kind === 'extension') {
                        extensions[key] = def;
                    } else if (def.kind === 'enum') {
                        enums[def.name] = def;
                    }
                }
            });
        }
    };

    // (wire_type) is a custom option this is why it is to be found in '$unknown' options
    // as { no: option_id, data: Uint8Array }
    const getWireTypeOverride = (schema: AnyDesc) => {
        const unknownOptions = schema.proto.options?.['$unknown'] ?? [];
        if (unknownOptions.length === 0) {
            return;
        }

        const wireTypeExtension = extensions['wire_type'];
        const wireTypeOption = unknownOptions.find(o => o.no === wireTypeExtension?.number);

        return wireTypeOption ? wireTypeOption.data[0] : undefined;
    };

    const findEnum = (enumName: string) => enums[enumName];

    const findSchema = (nameOrId: number | string) => {
        const messageTypeEnum = findEnum('MessageType');
        const thpMessageTypeEnum = findEnum('ThpMessageType');

        if (typeof nameOrId === 'string') {
            const schemaKey = `${nameOrId}Schema`;
            const schema = messages[schemaKey];

            if (!schema) {
                throw new Error(`Schema ${nameOrId} not found`);
            }

            // Try to find message type enum value
            // -1 is expected for ThpMessageType and other non-standard messages
            let messageType = -1;
            if (thpMessageTypeEnum) {
                const thpEnum = thpMessageTypeEnum.values.find(
                    k => k.name === 'ThpMessageType_' + schema.name,
                );
                if (thpEnum) {
                    messageType = thpEnum.number;
                }
            }

            if (messageType === -1 && messageTypeEnum) {
                const mtEnum = messageTypeEnum.values.find(
                    k => k.name === 'MessageType_' + schema.name,
                );
                if (mtEnum) {
                    messageType = mtEnum.number;
                }
            }

            return {
                schema,
                messageType: getWireTypeOverride(schema) || messageType,
                messageName: nameOrId,
            };
        }

        // Lookup by numeric ID
        let matchedMessageType = messageTypeEnum?.value[nameOrId];
        if (!matchedMessageType && thpMessageTypeEnum) {
            matchedMessageType = thpMessageTypeEnum.value[nameOrId];
        }

        if (!matchedMessageType) {
            throw new Error(
                `MessageType with ID ${nameOrId} not found. Check MessageType and ThpMessageType enums.`,
            );
        }

        const messageName = matchedMessageType.name
            .replace('ThpMessageType_', '')
            .replace('MessageType_', '');
        const schemaKey = messageName + 'Schema';
        const schema = messages[schemaKey];

        if (!schema) {
            throw new Error(
                `Schema "${messageName}" (from ID ${nameOrId}) not found. Available: ${Object.keys(messages).length}`,
            );
        }

        return {
            schema,
            messageType: getWireTypeOverride(schema) || nameOrId,
            messageName,
        };
    };

    const encode = (messageName: string, data: Record<string, unknown>) => {
        const { schema, messageType } = findSchema(messageName);

        const normalizedPayload = transformSchemaFields(schema, data, patchFieldForEncode);
        const messageJson = fromJson(schema, normalizedPayload as Parameters<typeof fromJson>[1]);
        const encodedBytes = toBinary(schema, messageJson);

        return {
            messageType,
            message: Buffer.from(encodedBytes),
        };
    };

    const decode = (type: string | number, data: Buffer | Uint8Array) => {
        const { schema, messageName } = findSchema(type);
        const binaryPayload = Buffer.isBuffer(data) ? data : Buffer.from(data);

        // FW issue: THP codec_v1 sends Failure_InvalidProtocol as 20 bytes instead of 2
        // https://github.com/trezor/trezor-firmware/pull/6549
        const patchedPayload =
            messageName === 'Failure' &&
            binaryPayload.subarray(0, 2).compare(Buffer.from('0811', 'hex')) === 0
                ? binaryPayload.subarray(0, 2)
                : binaryPayload;

        const decoded = fromBinary(schema, patchedPayload, { readUnknownFields: false }); // , { readUnknownFields: true }
        const json = toJson(schema, decoded, { useProtoFieldName: true });
        const message = transformSchemaFields(
            schema,
            json as Record<string, unknown>,
            patchFieldForDecode,
        );

        return {
            type: messageName,
            message,
        } as MessageResponse;
    };

    return {
        load,
        findSchema,
        findEnum,
        encode,
        decode,
    };
};
