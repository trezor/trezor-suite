import { AnyDesc } from '@bufbuild/protobuf';

import { ProtobufManager } from '../src/manager';

const getAllProtoModules = () => {
    const protoFiles = [
        'messages-bitcoin',
        'messages-ble',
        'messages-bootloader',
        'messages-cardano',
        'messages-common',
        'messages-crypto',
        'messages-debug',
        'messages-definitions',
        'messages-eos',
        'messages-ethereum-eip712',
        'messages-ethereum',
        'messages-evolu',
        'messages-management',
        'messages-monero',
        'messages',
        'messages-ripple',
        'messages-solana',
        'messages-stellar',
        'messages-telemetry',
        'messages-tezos',
        'messages-thp',
        'messages-tron',
        'options',
    ];

    return protoFiles.map(
        name => require(`../src/definitions/${name}_pb`) as Record<string, AnyDesc>,
    );
};

const protobufManager = ProtobufManager();
protobufManager.load(getAllProtoModules());

const bytesHex =
    '851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e3100';

// Fixtures test encoding of real protobuf message types using known hex-encoded binary outputs
const basicFixtures = [
    {
        name: 'Address',
        description: 'string field',
        in: { address: 'foo' },
        encoded: '0a03666f6f',
    },
    {
        name: 'GetPublicKey',
        description: 'uint32 field (address_n)',
        in: { address_n: [4294967295] },
        encoded: '08ffffffff0f',
    },
    {
        name: 'GetPublicKey',
        description: 'bool field (show_display true)',
        in: { address_n: [], show_display: true },
        encoded: '1801',
    },
    {
        name: 'GetPublicKey',
        description: 'bool field (show_display false)',
        in: { address_n: [], show_display: false },
        encoded: '1800',
    },
    {
        name: 'TxAckPrevExtraData',
        description: 'bytes field',
        in: {
            tx: {
                extra_data_chunk: bytesHex,
            },
        },
        encoded:
            '0a424240851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e3100',
    },
    {
        name: 'CardanoTxWitnessRequest',
        description: 'sint32 field (path with high values)',
        in: {
            path: [2147485500, 2147485463, 2147483648, 2, 0],
        },
        encoded: '08bc8e80800808978e80800808808080800808020800',
    },
];

const advancedFixtures = [
    {
        name: 'Ping',
        description: 'optional field present',
        in: { message: 'hello' },
        encoded: '0a0568656c6c6f',
        out: { message: 'hello' },
    },
    {
        name: 'Ping',
        description: 'optional field absent',
        in: {},
        encoded: '',
        out: { message: null },
    },
    {
        name: 'Features',
        description: 'repeated enum field',
        in: {
            capabilities: ['Capability_Bitcoin'],
            safety_checks: 'Strict',
            major_version: 1,
            minor_version: 0,
            patch_version: 0,
        },
        encoded: '100118002000f00101a80200',
        out: { capabilities: ['Capability_Bitcoin'], safety_checks: 'Strict' },
    },
    {
        name: 'TxRequest',
        description: 'nested message with enum and optional fields',
        in: {
            request_type: 0,
            details: { request_index: 0 },
            serialized: {
                serialized_tx: bytesHex,
            },
        },
        encoded:
            '0800120208001a421a40851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e3100',
        out: {
            request_type: 'TXINPUT',
            details: {
                request_index: 0,
                tx_hash: null,
                extra_data_len: null,
                extra_data_offset: null,
            },
            serialized: {
                serialized_tx: bytesHex,
                signature: null,
                signature_index: null,
            },
        },
    },
    {
        name: 'MultisigRedeemScriptType',
        description: 'complex nested with repeated bytes (empty signatures)',
        in: {
            pubkeys: [
                {
                    node: {
                        depth: 4,
                        child_num: 2147483648,
                        fingerprint: 2559962404,
                        public_key:
                            '02d598ec0f8f418c80859b690e8ee731e2bf7c8e2233d7fa722249bc3f27a65151',
                        chain_code:
                            'fd5fd24c06088bce57f3d817df206d0891adf5a77f5391bdc12793ef1917460e',
                    },
                    address_n: [0, 0],
                },
                {
                    node: {
                        depth: 4,
                        child_num: 2147483648,
                        fingerprint: 3563901430,
                        public_key:
                            '03e2a1f110b6e42de5bcf7a15881c66e2455fb62137e55678692a5f690fc8de10f',
                        chain_code:
                            'ca9268e9c323cfceb971ee96c418a91b2f3415dfbb0dc1d11dd8fcdff73a9ab9',
                    },
                    address_n: [0, 0],
                },
                {
                    node: {
                        depth: 4,
                        child_num: 2147483648,
                        fingerprint: 598174955,
                        public_key:
                            '032b9bdd9510f75f4d32631ffe11a56b11d332c8c0f0e0801b686f6eec806e7a2f',
                        chain_code:
                            '267ba0b69f9b0c9aa6add7d7162ff5ac675aa420c8d7a468778a6630d5c82f60',
                    },
                    address_n: [0, 0],
                },
            ],
            signatures: ['', '', ''],
            m: 2,
        },
        encoded:
            '0a590a53080410a4dad7c4091880808080082220fd5fd24c06088bce57f3d817df206d0891adf5a77f5391bdc12793ef1917460e322102d598ec0f8f418c80859b690e8ee731e2bf7c8e2233d7fa722249bc3f27a65151100010000a590a53080410f6a3b3a30d1880808080082220ca9268e9c323cfceb971ee96c418a91b2f3415dfbb0dc1d11dd8fcdff73a9ab9322103e2a1f110b6e42de5bcf7a15881c66e2455fb62137e55678692a5f690fc8de10f100010000a590a53080410ebd99d9d021880808080082220267ba0b69f9b0c9aa6add7d7162ff5ac675aa420c8d7a468778a6630d5c82f603221032b9bdd9510f75f4d32631ffe11a56b11d332c8c0f0e0801b686f6eec806e7a2f100010001200120012001802',
        out: {
            address_n: [],
            nodes: [],
            pubkeys: [
                {
                    node: {
                        depth: 4,
                        child_num: 2147483648,
                        fingerprint: 2559962404,
                        public_key:
                            '02d598ec0f8f418c80859b690e8ee731e2bf7c8e2233d7fa722249bc3f27a65151',
                        chain_code:
                            'fd5fd24c06088bce57f3d817df206d0891adf5a77f5391bdc12793ef1917460e',
                        private_key: null,
                    },
                    address_n: [0, 0],
                },
                {
                    node: {
                        depth: 4,
                        child_num: 2147483648,
                        fingerprint: 3563901430,
                        public_key:
                            '03e2a1f110b6e42de5bcf7a15881c66e2455fb62137e55678692a5f690fc8de10f',
                        chain_code:
                            'ca9268e9c323cfceb971ee96c418a91b2f3415dfbb0dc1d11dd8fcdff73a9ab9',
                        private_key: null,
                    },
                    address_n: [0, 0],
                },
                {
                    node: {
                        depth: 4,
                        child_num: 2147483648,
                        fingerprint: 598174955,
                        public_key:
                            '032b9bdd9510f75f4d32631ffe11a56b11d332c8c0f0e0801b686f6eec806e7a2f',
                        chain_code:
                            '267ba0b69f9b0c9aa6add7d7162ff5ac675aa420c8d7a468778a6630d5c82f60',
                        private_key: null,
                    },
                    address_n: [0, 0],
                },
            ],
            signatures: ['', '', ''],
            m: 2,
        },
    },
];

describe('basic encode/decode', () => {
    describe('primitives', () => {
        basicFixtures.forEach(f => {
            test(`${f.name} - ${f.description}`, () => {
                const encoded = protobufManager.encode(f.name, f.in);
                expect(encoded.message.toString('hex')).toEqual(f.encoded);

                const decoded = protobufManager.decode(f.name, encoded.message);
                expect(decoded.message).toMatchObject(f.in);
            });
        });

        test('bytes field accepts Buffer', () => {
            const encoded = protobufManager.encode('TxAckPrevExtraData', {
                tx: { extra_data_chunk: Buffer.from(bytesHex, 'hex') },
            });
            const encodedFromHex = protobufManager.encode('TxAckPrevExtraData', {
                tx: { extra_data_chunk: bytesHex },
            });
            expect(encoded.message.toString('hex')).toEqual(encodedFromHex.message.toString('hex'));
        });

        test('bytes field accepts Uint8Array', () => {
            const encoded = protobufManager.encode('TxAckPrevExtraData', {
                tx: { extra_data_chunk: new Uint8Array(Buffer.from(bytesHex, 'hex')) },
            });
            const encodedFromHex = protobufManager.encode('TxAckPrevExtraData', {
                tx: { extra_data_chunk: bytesHex },
            });
            expect(encoded.message.toString('hex')).toEqual(encodedFromHex.message.toString('hex'));
        });
    });

    describe('advanced', () => {
        advancedFixtures.forEach(f => {
            test(`${f.name} - ${f.description}`, () => {
                const encoded = protobufManager.encode(f.name, f.in);
                expect(encoded.message.toString('hex')).toEqual(f.encoded);

                const decoded = protobufManager.decode(f.name, encoded.message);
                expect(decoded.message).toMatchObject(f.out);
            });
        });
    });
});
