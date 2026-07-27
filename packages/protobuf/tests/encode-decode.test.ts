import { ProtobufManager } from '../src/manager';

const protobufManager = ProtobufManager();
protobufManager.load([
    require('../src/definitions/messages-bitcoin_pb'),
    require('../src/definitions/messages-cardano_pb'),
    require('../src/definitions/messages-management_pb'),
]);

const fixtures = [
    {
        name: 'Initialize',
        in: {},
        encoded: '',
        out: { session_id: null },
    },
    {
        name: 'Address',
        in: { address: 'abcd' },
        encoded: '0a0461626364',
        out: { address: 'abcd' },
    },
    {
        name: 'GetAddress',
        in: {
            address_n: [1],
            coin_name: 'btc',
            show_display: null,
            ignore_xpub_magic: null,
            multisig: {
                pubkeys: [
                    {
                        node: {
                            depth: 1,
                            fingerprint: 1,
                            child_num: 1,
                            chain_code:
                                '851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e3100',
                            private_key:
                                '851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e3100',
                            public_key:
                                '851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e3100',
                        },
                        address_n: [1],
                    },
                ],
                signatures: [
                    '851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e3100',
                ],
                m: 1,
                nodes: [
                    {
                        depth: 1,
                        fingerprint: 1,
                        child_num: 1,
                        chain_code:
                            '851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e3100',
                        private_key:
                            '851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e3100',
                        public_key:
                            '851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e3100',
                    },
                ],
                address_n: [1],
            },
        },
        encoded:
            '0801120362746322e9030ad1010acc010801100118012240851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e31002a40851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e31003240851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e310010011240851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e3100180122cc010801100118012240851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e31002a40851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e31003240851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e31002801',
    },
    {
        name: 'TxRequest',
        in: {
            request_type: 0,
            details: { request_index: 0 },
            serialized: {
                serialized_tx:
                    '851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e3100',
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
                serialized_tx:
                    '851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e3100',
                signature: null,
                signature_index: null,
            },
        },
    },
    {
        // taken from TrezorConnect fixtures signTransactionsMultisig.js. There is interesting part signatures: ['', '', ''];
        name: 'MultisigRedeemScriptType',
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
            // additional field. todo: not sure if shouldn't be omitted
            address_n: [],
            // additional field. todo: not sure if shouldn't be omitted
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
                        // additional field to maintain backwards compatibility
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
                        // additional field to maintain backwards compatibility
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
                        // additional field to maintain backwards compatibility
                        private_key: null,
                    },
                    address_n: [0, 0],
                },
            ],
            // point of interest.
            // signatures are repeated bytes. if they sent from TrezorConnect as empty strings, encoding them as bytes makes trezor not accept this message
            signatures: ['', '', ''],
            m: 2,
        },
    },
    {
        name: 'Features',
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
        name: 'CardanoTxWitnessRequest',
        in: {
            path: [2147485500, 2147485463, 2147483648, 2, 0],
        },
        encoded: '08bc8e80800808978e80800808808080800808020800',
        out: {
            path: [2147485500, 2147485463, 2147483648, 2, 0],
        },
    },
    {
        name: 'TxAckPrevExtraData',
        in: {
            tx: {
                extra_data_chunk:
                    '851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e3100',
            },
        },
        encoded:
            '0a424240851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e3100',
        out: {
            tx: {
                extra_data_chunk:
                    '851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e3100',
            },
        },
    },
];

describe('Real messages', () => {
    fixtures.forEach(f => {
        describe(f.name, () => {
            test('encode and decode', () => {
                // serialize
                // const encoded = encode(Message, f.in);
                const encoded = protobufManager.encode(f.name, f.in);
                expect(encoded.message.toString('hex')).toEqual(f.encoded);
                // deserialize
                const decoded = protobufManager.decode(f.name, encoded.message);
                expect(decoded.message).toMatchObject(f.out ? f.out : f.in);
            });
        });
    });

    test('without Messages object', () => {
        expect(() => {
            // @ts-expect-error
            encode(null, {});
        }).toThrow();
    });
});
