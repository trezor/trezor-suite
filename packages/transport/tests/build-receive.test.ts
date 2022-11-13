import * as protobuf from 'protobufjs/light';

import { buildOne, buildBuffers } from '../src/lowlevel/send';
import { receiveOne, receiveAndParse } from '../src/lowlevel/receive';

const messages = {
    StellarPaymentOp: {
        fields: {
            source_account: {
                type: 'string',
                id: 1,
            },
            destination_account: {
                rule: 'required',
                type: 'string',
                id: 2,
            },
            asset: {
                rule: 'required',
                type: 'StellarAsset',
                id: 3,
            },
            amount: {
                rule: 'required',
                type: 'sint64',
                id: 4,
            },
        },
    },
    StellarAssetType: {
        values: {
            NATIVE: 0,
            ALPHANUM4: 1,
            ALPHANUM12: 2,
        },
    },
    StellarAsset: {
        fields: {
            type: {
                rule: 'required',
                type: 'StellarAssetType',
                id: 1,
            },
            code: {
                type: 'string',
                id: 2,
            },
            issuer: {
                type: 'string',
                id: 3,
            },
        },
    },
    MessageType: {
        values: {
            MessageType_StellarSignTx: 202,
            MessageType_StellarTxOpRequest: 203,
            MessageType_StellarGetAddress: 207,
            MessageType_StellarAddress: 208,
            MessageType_StellarCreateAccountOp: 210,
            MessageType_StellarPaymentOp: 211,
            MessageType_StellarPathPaymentOp: 212,
            MessageType_StellarManageOfferOp: 213,
            MessageType_StellarCreatePassiveOfferOp: 214,
            MessageType_StellarSetOptionsOp: 215,
            MessageType_StellarChangeTrustOp: 216,
            MessageType_StellarAllowTrustOp: 217,
            MessageType_StellarAccountMergeOp: 218,
            MessageType_StellarManageDataOp: 220,
            MessageType_StellarBumpSequenceOp: 221,
            MessageType_StellarSignedTx: 230,
        },
    },
};

const fixtures = [
    {
        name: 'StellarPaymentOp',
        in: {
            source_account: 'meow'.repeat(100), // make message longer then 63 bytes
            destination_account: 'wuff',
            asset: {
                type: 'NATIVE',
                code: 'hello',
                issuer: 'world',
            },
            amount: 10,
        },
    },
];

const parsedMessages = protobuf.Root.fromJSON({
    nested: { hw: { nested: { trezor: { nested: { messages: { nested: messages } } } } } },
});

describe('encoding json -> protobuf -> json', () => {
    fixtures.forEach(f => {
        describe(f.name, () => {
            test('buildOne - receiveOne', () => {
                // encoded message
                const encodedMessage = buildOne(parsedMessages, f.name, f.in);
                // then decode message and check, whether decoded message matches original json
                const decodedMessage = receiveOne(parsedMessages, encodedMessage.toString('hex'));
                expect(decodedMessage.type).toEqual(f.name);
                expect(decodedMessage.message).toEqual(f.in);
            });

            test('buildBuffers - receiveAndParse', async () => {
                const result = buildBuffers(parsedMessages, f.name, f.in);
                result.forEach(r => {
                    expect(r.byteLength).toBeLessThanOrEqual(63);
                });
                let i = -1;
                const decoded = await receiveAndParse(parsedMessages, () => {
                    i++;
                    return Promise.resolve(result[i]);
                });
                // then decode message and check, whether decoded message matches original json
                expect(decoded.type).toEqual(f.name);
                expect(decoded.message).toEqual(f.in);
            });
        });
    });
});
