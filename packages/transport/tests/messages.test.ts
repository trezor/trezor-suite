import * as protobuf from 'protobufjs/light';

import { createMessageFromName } from '../src/lowlevel/protobuf/messages';

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
                                MessageType: {
                                    values: {
                                        MessageType_Initialize: 0,
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
});
