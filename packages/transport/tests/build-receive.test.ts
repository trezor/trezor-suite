import * as protobuf from 'protobufjs/light';
import { v1 as v1Protocol, bridge as bridgeProtocol } from '@trezor/protocol';
import { buildBuffers } from '../src/utils/send';
import { receiveAndParse } from '../src/utils/receive';

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

const fixtures = Array(100)
    .fill(undefined)
    .map((_u, i) => ({
        name: 'StellarPaymentOp',
        in: {
            source_account: 'm'.repeat(13 * i), // make message longer then 64 bytes
            destination_account: 'wuff',
            asset: {
                type: 'NATIVE',
                code: 'hello',
                issuer: 'world',
            },
            amount: 10,
        },
    }));

const parsedMessages = protobuf.Root.fromJSON({
    nested: { hw: { nested: { trezor: { nested: { messages: { nested: messages } } } } } },
});

describe('encoding json -> protobuf -> json', () => {
    fixtures.forEach(f => {
        describe(`${f.name} - payload length ${f.in.source_account.length}`, () => {
            test('bridgeProtocol: buildBuffers - receiveAndParse', async () => {
                const result = buildBuffers(parsedMessages, f.name, f.in, bridgeProtocol.encode);
                // bridgeProtocol returns only one big chunk
                expect(result.length).toBe(1);
                const [chunk] = result;
                const { length } = Buffer.from(f.in.source_account);
                // chunk length cannot be less than message header/constant (28) + variable source_account length
                // additional bytes are expected (encoded Uint32) if message length is greater
                expect(chunk.buffer.length).toBeGreaterThanOrEqual(28 + length);
                let i = -1;
                const decoded = await receiveAndParse(
                    parsedMessages,
                    () => {
                        i++;
                        return Promise.resolve(result[i].buffer);
                    },
                    bridgeProtocol.decode,
                );
                // then decode message and check, whether decoded message matches original json
                expect(decoded.type).toEqual(f.name);
                expect(decoded.message).toEqual(f.in);
            });

            test('v1Protocol: buildBuffers - receiveAndParse', async () => {
                const result = buildBuffers(parsedMessages, f.name, f.in, v1Protocol.encode);
                // each protocol chunks are equal 64 bytes
                result.forEach(chunk => {
                    expect(chunk.buffer.length).toEqual(64);
                });
                let i = -1;
                const decoded = await receiveAndParse(
                    parsedMessages,
                    () => {
                        i++;
                        return Promise.resolve(result[i].buffer);
                    },
                    v1Protocol.decode,
                );
                // then decode message and check, whether decoded message matches original json
                expect(decoded.type).toEqual(f.name);
                expect(decoded.message).toEqual(f.in);
            });
        });
    });
});
