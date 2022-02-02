// Module for loading the protobuf description from serialized description

import * as protobuf from 'protobufjs/light';

export function parseConfigure(data: protobuf.INamespace) {
    // @ts-ignore [compatiblity]: connect is sending stringified json
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

    const messageName = MessageType.valuesById[typeId].replace('MessageType_', '');

    const Message = messages.lookupType(messageName);

    return {
        Message,
        messageName,
    };
};
