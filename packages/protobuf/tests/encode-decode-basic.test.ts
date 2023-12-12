import * as ProtoBuf from 'protobufjs/light';

import { encode } from '../src/encode';
import { decode } from '../src/decode';

const messages = {
    nested: {
        messages: {
            nested: {
                String: {
                    fields: {
                        field: {
                            rule: 'required',
                            type: 'string',
                            id: 1,
                        },
                    },
                },
                Uint32: {
                    fields: {
                        field: {
                            rule: 'required',
                            type: 'uint32',
                            id: 2,
                        },
                    },
                },
                Uint64: {
                    fields: {
                        field: {
                            rule: 'required',
                            type: 'uint64',
                            id: 3,
                        },
                    },
                },
                Bool: {
                    fields: {
                        field: {
                            rule: 'required',
                            type: 'bool',
                            id: 4,
                        },
                    },
                },
                Sint32: {
                    fields: {
                        field: {
                            rule: 'required',
                            type: 'sint32',
                            id: 5,
                        },
                    },
                },
                Sint64: {
                    fields: {
                        field: {
                            rule: 'required',
                            type: 'sint64',
                            id: 6,
                        },
                    },
                },
                Bytes: {
                    fields: {
                        field: {
                            rule: 'required',
                            type: 'bytes',
                            id: 7,
                        },
                    },
                },

                //  complex and real life examples
                ComplexFieldOfOptionals: {
                    fields: {
                        bool: {
                            rule: 'optional',
                            type: 'bool',
                            id: 8,
                        },
                        number: {
                            rule: 'optional',
                            type: 'uint32',
                            id: 9,
                        },
                    },
                },

                Repeated: {
                    fields: {
                        bool: {
                            rule: 'repeated',
                            type: 'bool',
                            id: 8,
                        },
                    },
                },

                Defaults: {
                    fields: {
                        string: {
                            type: 'string',
                            id: 8,
                            options: {
                                defaults: 'hello world',
                            },
                        },
                    },
                },
            },
        },
    },
};

const basicFixtures = [
    {
        name: 'String',
        params: { field: 'foo' },
        encoded: '0a03666f6f',
    },
    {
        name: 'Uint32',
        params: { field: 4294967295 },
        encoded: '10ffffffff0f',
    },
    {
        name: 'Uint64',
        params: { field: 1844674407370955 },
        encoded: '18cba19cd68bb7a303',
    },
    {
        name: 'Uint64',
        params: { field: '166054873161269248' }, // over Number.MAX_SAFE_INTEGER is sent as string
        encoded: '1880808080f0c0fca602',
    },
    {
        name: 'Sint64',
        params: { field: '-166054873161269248' }, // over Number.MAX_SAFE_INTEGER is sent as string
        encoded: '30ffffffffdf81f9cd04',
    },
    {
        name: 'Bool',
        params: { field: true },
        encoded: '2001',
    },
    {
        name: 'Bool',
        params: { field: false },
        encoded: '2000',
    },
    {
        name: 'Sint32',
        params: { field: -4294967 },
        encoded: '28eda48c04',
    },
    {
        name: 'Sint64',
        params: { field: -1844674407370955 },
        encoded: '3095c3b8ac97eec606',
    },
    {
        name: 'Bytes',
        params: {
            field: '851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e3100',
        },
        encoded:
            '3a40851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e3100',
    },
];

// note: difference in bool encoding. if type === bool && field = optional && not message of only one field, bool is encoded as ""
const advancedFixtures = [
    {
        name: 'ComplexFieldOfOptionals',
        in: { number: 1 },
        encoded: '4801',
        out: { bool: null, number: 1 },
    },
    {
        name: 'Repeated',
        in: { bool: [true, false, true, false] },
        encoded: '420401000100',
        out: { bool: [true, false, true, false] },
    },
    {
        name: 'Defaults',
        in: { string: '' },
        encoded: '4200',
        out: { string: '' },
    },
];

describe('basic concepts', () => {
    const Messages = ProtoBuf.Root.fromJSON(messages);

    describe('primitives encode/decode', () => {
        basicFixtures.forEach(f => {
            describe(f.name, () => {
                const Message = Messages.lookupType(`messages.${f.name}`);

                test(f.name, () => {
                    // serialize new way - this is to confirm new lib won't break old behavior
                    const encoded = encode(Message, f.params);
                    expect(encoded.toString('hex')).toEqual(f.encoded);

                    // deserialize new way - this is to confirm new lib won't break old behavior
                    const decoded = decode(Message, encoded);
                    expect(decoded).toEqual(f.params);
                });
            });
        });
    });

    describe('advanced', () => {
        advancedFixtures.forEach(f => {
            describe(f.name, () => {
                const Message = Messages.lookupType(`messages.${f.name}`);

                test(f.name, () => {
                    // serialize new way - this is to confirm new lib won't break old behavior
                    const encoded = encode(Message, f.in);

                    expect(encoded.toString('hex')).toEqual(f.encoded);

                    // deserialize new way - this is to confirm new lib won't break old behavior
                    const decoded = decode(Message, encoded);

                    expect(decoded).toEqual(f.out);
                });
            });
        });

        test('Different protobuf between receiving ends', () => {
            const customMessages = (fields?: any) => ({
                nested: {
                    messages: {
                        nested: {
                            ButtonRequest: {
                                fields: {
                                    code: {
                                        type: 'string',
                                        id: 1,
                                    },
                                    pages: {
                                        type: 'uint32',
                                        id: 2,
                                    },
                                    ...fields,
                                },
                            },
                        },
                    },
                },
            });

            const SenderMessages = ProtoBuf.Root.fromJSON(customMessages());
            const senderEncoded = encode(SenderMessages.lookupType('messages.ButtonRequest'), {
                type: 'foo',
                pages: 123,
            });

            // now change field type from uint32 to string
            const ReceiverMessages = ProtoBuf.Root.fromJSON(
                customMessages({ pages: { type: 'string', id: 2 } }),
            );

            expect(() => {
                decode(ReceiverMessages.lookupType('messages.ButtonRequest'), senderEncoded);
            }).toThrow();
        });
    });
});
