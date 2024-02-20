// Module for loading the protobuf description from serialized description

import * as protobuf from 'protobufjs/light';

import type { MessageFromTrezor } from './types';

const primitiveTypes = [
    'bool',
    'string',
    'bytes',
    'int32',
    'int64',
    'uint32',
    'uint64',
    'sint32',
    'sint64',
    'fixed32',
    'fixed64',
    'sfixed32',
    'sfixed64',
    'double',
    'float',
];

/**
 * Determines whether given field is "primitive"
 * bool, strings, uint32 => true
 * HDNodeType => false
 */
export const isPrimitiveField = (field: any) => primitiveTypes.includes(field);

export function parseConfigure(data: protobuf.INamespace) {
    if (typeof data === 'string') {
        return protobuf.Root.fromJSON(JSON.parse(data));
    }

    return protobuf.Root.fromJSON(data);
}

export const createMessageFromName = (messages: protobuf.Root, name: string) => {
    const Message = messages.lookupType(name);
    const MessageType = messages.lookupEnum('MessageType');
    let messageType = MessageType.values[`MessageType_${name}`];

    if (!messageType && Message.options) {
        messageType = Message.options['(wire_type)'];
    }

    return {
        Message,
        messageType,
    };
};

export const createMessageFromType = (messages: protobuf.Root, typeId: number) => {
    const MessageType = messages.lookupEnum('MessageType');

    const messageName = MessageType.valuesById[typeId].replace(
        'MessageType_',
        '',
    ) as MessageFromTrezor['type'];

    const Message = messages.lookupType(messageName);

    return {
        Message,
        messageName,
    };
};
