import { type DescMessage, create, createFileRegistry } from '@bufbuild/protobuf';
import {
    type FieldDescriptorProto,
    FieldDescriptorProtoSchema,
    FieldDescriptorProto_Label,
    FieldDescriptorProto_Type,
    FileDescriptorProtoSchema,
} from '@bufbuild/protobuf/wkt';

import { protobufManager } from '@trezor/protobuf';

/**
 * Names of the Ethereum messages as firmware 1.4.2 to 1.6.3 knows them. They have to match the
 * `MessageType` enum entries so that the manager maps them to ids 56 to 60.
 */
export const LEGACY_ETHEREUM_MESSAGE_NAMES = [
    'EthereumGetAddress',
    'EthereumAddress',
    'EthereumSignTx',
    'EthereumTxRequest',
    'EthereumTxAck',
] as const;

export type LegacyEthereumMessageName = (typeof LEGACY_ETHEREUM_MESSAGE_NAMES)[number];

type FieldSpec = {
    name: string;
    number: number;
    type: FieldDescriptorProto_Type;
    label?: FieldDescriptorProto_Label;
};

const { BOOL, BYTES, UINT32 } = FieldDescriptorProto_Type;
const { OPTIONAL, REPEATED } = FieldDescriptorProto_Label;

/**
 * Field layout of the messages exactly as compiled into the old firmware. The shared schema of
 * today differs in two places that matter: it reads the returned address as a string, and it
 * sends `to` as a string in field 11, which old firmware does not read. A transaction sent that
 * way is signed as a contract creation, so these definitions are kept separate and immutable.
 */
const LEGACY_ETHEREUM_MESSAGES: Record<LegacyEthereumMessageName, FieldSpec[]> = {
    EthereumGetAddress: [
        { name: 'address_n', number: 1, type: UINT32, label: REPEATED },
        { name: 'show_display', number: 2, type: BOOL },
    ],
    // The firmware declares `address` as required; presence is checked where it is read.
    EthereumAddress: [{ name: 'address', number: 1, type: BYTES }],
    EthereumSignTx: [
        { name: 'address_n', number: 1, type: UINT32, label: REPEATED },
        { name: 'nonce', number: 2, type: BYTES },
        { name: 'gas_price', number: 3, type: BYTES },
        { name: 'gas_limit', number: 4, type: BYTES },
        { name: 'to', number: 5, type: BYTES },
        { name: 'value', number: 6, type: BYTES },
        { name: 'data_initial_chunk', number: 7, type: BYTES },
        { name: 'data_length', number: 8, type: UINT32 },
        { name: 'chain_id', number: 9, type: UINT32 },
    ],
    EthereumTxRequest: [
        { name: 'data_length', number: 1, type: UINT32 },
        { name: 'signature_v', number: 2, type: UINT32 },
        { name: 'signature_r', number: 3, type: BYTES },
        { name: 'signature_s', number: 4, type: BYTES },
    ],
    EthereumTxAck: [{ name: 'data_chunk', number: 1, type: BYTES }],
};

const toFieldDescriptor = ({ name, number, type, label }: FieldSpec): FieldDescriptorProto =>
    create(FieldDescriptorProtoSchema, {
        name,
        number,
        type,
        label: label ?? OPTIONAL,
    });

/**
 * Builds the message descriptors at runtime. A proto2 file is declared so that repeated scalars
 * are written unpacked, one tag per item, the way the firmware's decoder expects them.
 */
export const createLegacyEthereumSchemas = (): Record<
    `${LegacyEthereumMessageName}Schema`,
    DescMessage
> => {
    const file = create(FileDescriptorProtoSchema, {
        name: 'messages-ethereum-legacy.proto',
        package: 'hw.trezor.messages.ethereum',
        syntax: 'proto2',
        messageType: LEGACY_ETHEREUM_MESSAGE_NAMES.map(name => ({
            name,
            field: LEGACY_ETHEREUM_MESSAGES[name].map(toFieldDescriptor),
        })),
    });
    const registry = createFileRegistry(file, () => undefined);

    const schemas = LEGACY_ETHEREUM_MESSAGE_NAMES.map(name => {
        const schema = registry.getMessage(`${file.package}.${name}`);
        if (!schema) throw new Error(`Legacy Ethereum schema ${name} could not be built`);

        return [`${name}Schema`, schema] as const;
    });

    return Object.fromEntries(schemas) as Record<`${LegacyEthereumMessageName}Schema`, DescMessage>;
};

/**
 * Registers the legacy Ethereum messages with the shared manager. The Ethereum module of
 * `@trezor/protobuf` must not be loaded alongside: the manager keeps one schema per name.
 */
export const loadLegacyEthereumDefinitions = () => {
    protobufManager.load(createLegacyEthereumSchemas());
};
