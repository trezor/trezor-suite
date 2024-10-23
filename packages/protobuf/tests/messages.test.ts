import * as protobuf from 'protobufjs/light';

import { createMessageFromName, createMessageFromType } from '../src/utils';

const json = {
    nested: {
        hw: {
            nested: {
                trezor: {
                    nested: {
                        messages: {
                            nested: {
                                TxAckPrevExtraData: {
                                    options: {
                                        '(wire_type)': 22,
                                        '(include_in_bitcoin_only)': true,
                                    },
                                    fields: {
                                        tx: {
                                            rule: 'required',
                                            type: 'TxAckPrevExtraDataWrapper',
                                            id: 1,
                                        },
                                    },
                                    nested: {
                                        TxAckPrevExtraDataWrapper: {
                                            fields: {
                                                extra_data_chunk: {
                                                    rule: 'required',
                                                    type: 'bytes',
                                                    id: 8,
                                                },
                                            },
                                        },
                                    },
                                },
                                Initialize: {
                                    fields: {
                                        session_id: {
                                            type: 'bytes',
                                            id: 1,
                                        },
                                    },
                                },
                                MessageWithoutId: {
                                    fields: {},
                                },
                                MessageType: {
                                    values: {
                                        Initialize: 0,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};

describe('messages', () => {
    test('createMessageFromName (wire_type case)', () => {
        const messages = protobuf.Root.fromJSON(json);
        const name = 'TxAckPrevExtraData';

        expect(() => createMessageFromName(messages, name)).not.toThrow();
    });

    test('createMessageFromName (message without id)', () => {
        const messages = protobuf.Root.fromJSON(json);
        const name = 'MessageWithoutId'; // this message has no id defined in MessageType.MessageType_xxx
        const result = createMessageFromName(messages, name);

        expect(result.messageType).toEqual(name);
    });

    test('createMessageFromType (messageType as number and string)', () => {
        const messages = protobuf.Root.fromJSON(json);
        const asNumber = createMessageFromType(messages, 0);
        const asString = createMessageFromType(messages, 'Initialize');

        expect(asNumber.messageName).toEqual(asString.messageName);
    });
});
