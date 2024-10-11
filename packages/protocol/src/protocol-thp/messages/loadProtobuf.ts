import { getThpProtobufMessages } from './protobufDefinitions';

// partial { Root } from 'protobufjs/light';
type ProtobufRoot = {
    lookupType: (path: string | string[]) => any;
    lookupEnum: (path: string | string[]) => any;
    define: (path: string | string[], json?: any) => any;
};

export const loadProtobuf = (messages: ProtobufRoot) => {
    try {
        // check if thp one of the messages already exists
        return messages.lookupType('ThpDeviceProperties');
    } catch {
        // add thp definitions
    }

    let enumType: any | undefined;
    try {
        enumType = messages.lookupEnum('MessageType');
    } catch {}

    const thpMessages = getThpProtobufMessages();
    if (enumType) {
        const clone = { ...thpMessages, MessageType: undefined };
        delete clone.MessageType;
        messages.define('thp', clone);

        const thpMessageType = thpMessages.MessageType.values;
        (Object.keys(thpMessageType) as (keyof typeof thpMessageType)[]).forEach(messageName => {
            const messageValue = thpMessageType[messageName];
            if (!enumType.values[messageName] && !enumType.valuesById[messageValue]) {
                enumType.values[messageName] = messageValue;
                enumType.valuesById[messageValue] = messageName;
            } else {
                console.warn('MessageType already exists', messageName, messageValue);
            }
        });
    } else {
        messages.define('thp', thpMessages);
    }

    // and additionally extend existing MessageType enum
    // const thpMessageType = thpMessages.MessageType.values;
    // enumType = messages.lookupEnum('MessageType');
    // (Object.keys(thpMessageType) as (keyof typeof thpMessageType)[]).forEach(messageName => {
    //     const messageValue = thpMessageType[messageName];
    //     if (!enumType.values[messageName] && !enumType.valuesById[messageValue]) {
    //         enumType.values[messageName] = messageValue;
    //         enumType.valuesById[messageValue] = messageName;
    //     } else {
    //         console.warn('MessageType already exists', messageName, messageValue);
    //     }
    // });
};
