import { protobufManager } from '@trezor/protobuf';
import { v1 as protocolV1 } from '@trezor/protocol';

import {
    LEGACY_ETHEREUM_MESSAGE_NAMES,
    createLegacyEthereumSchemas,
} from './legacyEthereumMessages';
import { loadProtobufDefinitions } from './protobufDefinitions';
import { mockLegacyEthereumWireVectors } from '../../mocks/mockLegacyEthereumWireVectors';

const encodeWireMessage = (name: string, data: Record<string, unknown>) => {
    const { messageType, message } = protobufManager.encode(name, data);

    return { messageType, wireHex: protocolV1.encode(message, { messageType }).toString('hex') };
};

describe('legacy Ethereum messages', () => {
    beforeAll(() => {
        loadProtobufDefinitions();
    });

    it.each(mockLegacyEthereumWireVectors)(
        '$description',
        ({ name, data, messageType, wireHex }) => {
            expect(encodeWireMessage(name, data)).toEqual({ messageType, wireHex });
        },
    );

    it('maps every legacy message to the id old firmware uses', () => {
        expect(
            LEGACY_ETHEREUM_MESSAGE_NAMES.map(name => protobufManager.findSchema(name).messageType),
        ).toEqual([56, 57, 58, 59, 60]);
    });

    it('declares the fields with the numbers and types compiled into the firmware', () => {
        const schemas = createLegacyEthereumSchemas();
        const describeFields = (name: keyof typeof schemas) =>
            schemas[name].fields.map(({ name: fieldName, number, fieldKind, scalar }) => [
                fieldName,
                number,
                fieldKind,
                scalar,
            ]);

        expect(describeFields('EthereumSignTxSchema')).toEqual([
            ['address_n', 1, 'list', 13],
            ['nonce', 2, 'scalar', 12],
            ['gas_price', 3, 'scalar', 12],
            ['gas_limit', 4, 'scalar', 12],
            ['to', 5, 'scalar', 12],
            ['value', 6, 'scalar', 12],
            ['data_initial_chunk', 7, 'scalar', 12],
            ['data_length', 8, 'scalar', 13],
            ['chain_id', 9, 'scalar', 13],
        ]);
        expect(describeFields('EthereumAddressSchema')).toEqual([['address', 1, 'scalar', 12]]);
    });

    it('decodes the 20 address bytes of EthereumAddress as hex', () => {
        const address = 'd8da6bf26964af9d7eed9e03e53415d37aa96045';

        expect(protobufManager.decode(57, Buffer.from(`0a14${address}`, 'hex'))).toEqual({
            type: 'EthereumAddress',
            message: { address },
        });
    });

    it('decodes the signature fields of EthereumTxRequest', () => {
        const r = '11'.repeat(32);
        const s = '22'.repeat(32);
        // signature_v 38 = 1 + 2 * 1 + 35, as firmware with chain id 1 returns it.
        const payload = Buffer.from(`1026${`1a20${r}`}${`2220${s}`}`, 'hex');

        expect(protobufManager.decode(59, payload)).toEqual({
            type: 'EthereumTxRequest',
            message: { data_length: null, signature_v: 38, signature_r: r, signature_s: s },
        });
    });

    it('reports a data_length when the firmware asks for more data', () => {
        expect(protobufManager.decode(59, Buffer.from('08ff07', 'hex'))).toEqual({
            type: 'EthereumTxRequest',
            message: { data_length: 1023, signature_v: null, signature_r: null, signature_s: null },
        });
    });
});
