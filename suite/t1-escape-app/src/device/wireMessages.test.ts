import { inputToTrezor } from '@trezor/connect-core/src/api/bitcoin/inputs';
import { protobufManager } from '@trezor/protobuf';
import { v1 as protocolV1 } from '@trezor/protocol';

import { loadProtobufDefinitions } from './protobufDefinitions';
import { mockUtxo } from '../../mocks/mockUtxo';
import { mockWireMessageVectors } from '../../mocks/mockWireMessageVectors';

const encodeWireMessage = (name: string, data: Record<string, unknown>) => {
    const { messageType, message } = protobufManager.encode(name, data);

    return { messageType, wireHex: protocolV1.encode(message, { messageType }).toString('hex') };
};

describe('wire bytes of the messages sent to old firmware', () => {
    beforeAll(() => {
        loadProtobufDefinitions();
    });

    it.each(mockWireMessageVectors)('$description', ({ name, data, messageType, wireHex }) => {
        expect(encodeWireMessage(name, data)).toEqual({ messageType, wireHex });
    });

    it('covers every message the migration sends', () => {
        const coveredNames = new Set(mockWireMessageVectors.map(({ name }) => name));

        expect([...coveredNames].toSorted()).toEqual([
            'ButtonAck',
            'Cancel',
            'GetPublicKey',
            'Initialize',
            'LockDevice',
            'PassphraseAck',
            'PinMatrixAck',
            'SignTx',
            'TxAckInput',
            'TxAckOutput',
            'TxAckPrevInput',
            'TxAckPrevMeta',
            'TxAckPrevOutput',
        ]);
    });

    it('encodes an input built by the shared helper exactly like the stored vector', () => {
        const input = inputToTrezor(
            mockUtxo({
                txid: 'aa'.repeat(32),
                vout: 1,
                amount: '123456789',
                path: "m/44'/0'/0'/0/5",
            }),
        );
        const vector = mockWireMessageVectors.find(({ description }) =>
            description.startsWith('TxAckInput for a legacy input'),
        );

        expect(encodeWireMessage('TxAckInput', { tx: { input } }).wireHex).toBe(vector?.wireHex);
    });

    it('decodes the answers of old firmware, including fields the schema no longer has', () => {
        // Features as firmware 1.3.6 sends them. The `coins` list is gone from today's schema.
        const features = Buffer.from(
            [
                '0a11626974636f696e7472657a6f722e636f6d', // vendor = "bitcointrezor.com"
                '1001', // major_version = 1
                '1803', // minor_version = 3
                '2006', // patch_version = 6
                '320441424344', // device_id = "ABCD"
                '3801', // pin_protection = true
                '4000', // passphrase_protection = false
                '5a090a07426974636f696e', // coins = [{ coin_name: "Bitcoin" }]
                '6001', // initialized = true
                '800100', // pin_cached = false
                '880100', // passphrase_cached = false
            ].join(''),
            'hex',
        );

        expect(protobufManager.decode(17, features)).toMatchObject({
            type: 'Features',
            message: {
                vendor: 'bitcointrezor.com',
                major_version: 1,
                minor_version: 3,
                patch_version: 6,
                device_id: 'ABCD',
                pin_protection: true,
                passphrase_protection: false,
                initialized: true,
                unlocked: false,
                bootloader_mode: null,
            },
        });
    });

    it('decodes a transaction request and a failure by their legacy message ids', () => {
        // TxRequest: request_type = TXMETA, details = { request_index: 0, tx_hash: aa..aa }.
        const txRequest = Buffer.from(`0802122408001220${'aa'.repeat(32)}`, 'hex');

        expect(protobufManager.decode(21, txRequest)).toMatchObject({
            type: 'TxRequest',
            message: {
                request_type: 'TXMETA',
                details: { request_index: 0, tx_hash: 'aa'.repeat(32) },
            },
        });

        // Failure: code = 7 (invalid PIN), message = "Invalid PIN".
        const failure = Buffer.from('0807120b496e76616c69642050494e', 'hex');

        expect(protobufManager.decode(3, failure)).toEqual({
            type: 'Failure',
            message: { code: 'Failure_PinInvalid', message: 'Invalid PIN' },
        });
    });
});
