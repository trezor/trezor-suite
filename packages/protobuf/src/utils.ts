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
    const messageTypes = messages.lookupEnum('MessageType');
    let messageTypeId = messageTypes.values[name];

    if (typeof messageTypeId !== 'number' && Message.options) {
        messageTypeId = Message.options['(wire_type)'];
    }

    return {
        Message,
        messageType: messageTypeId ?? name,
    };
};

export const createMessageFromType = (messages: protobuf.Root, messageType: number | string) => {
    if (typeof messageType === 'string') {
        const Message = messages.lookupType(messageType);

        return {
            Message,
            messageName: messageType as MessageFromTrezor['type'],
        };
    }

    const messageTypes = messages.lookupEnum('MessageType');

    const messageName = messageTypes.valuesById[messageType] as MessageFromTrezor['type'];

    const Message = messages.lookupType(messageName);

    return {
        Message,
        messageName,
    };
};
