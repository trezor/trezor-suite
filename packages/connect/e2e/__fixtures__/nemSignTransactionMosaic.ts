import * as NEM from '@trezor/connect/lib/constants/nem';

export default {
    method: 'nemSignTransaction',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: 'supply change',
            params: {
                path: "m/44'/1'/0'/0'/0'",
                transaction: {
                    timeStamp: 74649215,
                    fee: 2000000,
                    type: NEM.TxType.SUPPLY_CHANGE,
                    deadline: 74735615,
                    message: {},
                    mosaicId: {
                        namespaceId: 'hellom',
                        name: 'Hello mosaic',
                    },
                    supplyType: 1,
                    delta: 1,
                    version: NEM.TxVersion.testnet,
                    creationFeeSink: 'TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J',
                    creationFee: 1500,
                },
            },
            result: {
                data: '02400000010000987f0e730420000000edfd32f6e760648c032f9acb4b30d514265f6a5b5f8a7154f2618922b406208480841e0000000000ff5f74041a0000000600000068656c6c6f6d0c00000048656c6c6f206d6f73616963010000000100000000000000',
                signature:
                    '928b03c4a69fff35ecf0912066ea705895b3028fad141197d7ea2b56f1eef2a2516455e6f35d318f6fa39e2bb40492ac4ae603260790f7ebc7ea69feb4ca4c0a',
            },
        },
        {
            description: 'creation',
            params: {
                path: "m/44'/1'/0'/0'/0'",
                transaction: {
                    timeStamp: 74649215,
                    fee: 2000000,
                    type: NEM.TxType.MOSAIC_CREATION,
                    deadline: 74735615,
                    message: {},
                    mosaicDefinition: {
                        id: {
                            namespaceId: 'hellom',
                            name: 'Hello mosaic',
                        },
                        levy: {},
                        properties: [],
                        description: 'lorem',
                    },
                    version: NEM.TxVersion.testnet,
                    creationFeeSink: 'TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J',
                    creationFee: 1500,
                },
            },
            result: {
                data: '01400000010000987f0e730420000000edfd32f6e760648c032f9acb4b30d514265f6a5b5f8a7154f2618922b406208480841e0000000000ff5f7404c100000020000000edfd32f6e760648c032f9acb4b30d514265f6a5b5f8a7154f2618922b40620841a0000000600000068656c6c6f6d0c00000048656c6c6f206d6f73616963050000006c6f72656d04000000150000000c00000064697669736962696c6974790100000030160000000d000000696e697469616c537570706c7901000000301a0000000d000000737570706c794d757461626c650500000066616c7365190000000c0000007472616e7366657261626c650500000066616c7365000000002800000054414c49434532474d4133344358484437584c4a513533364e4d35554e4b5148544f524e4e54324adc05000000000000',
                signature:
                    '537adf4fd9bd5b46e204b2db0a435257a951ed26008305e0aa9e1201dafa4c306d7601a8dbacabf36b5137724386124958d53202015ab31fb3d0849dfed2df0e',
            },
        },
        {
            description: 'creation properties',
            params: {
                path: "m/44'/1'/0'/0'/0'",
                transaction: {
                    timeStamp: 74649215,
                    fee: 2000000,
                    type: NEM.TxType.MOSAIC_CREATION,
                    deadline: 74735615,
                    message: {},
                    mosaicDefinition: {
                        id: {
                            namespaceId: 'hellom',
                            name: 'Hello mosaic',
                        },
                        levy: {},
                        properties: [
                            {
                                name: 'divisibility',
                                value: '4',
                            },
                            {
                                name: 'initialSupply',
                                value: '200',
                            },
                            {
                                name: 'supplyMutable',
                                value: 'false',
                            },
                            {
                                name: 'transferable',
                                value: 'true',
                            },
                        ],
                        description: 'lorem',
                    },
                    version: NEM.TxVersion.testnet,
                    creationFeeSink: 'TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J',
                    creationFee: 1500,
                },
            },
            result: {
                data: '01400000010000987f0e730420000000edfd32f6e760648c032f9acb4b30d514265f6a5b5f8a7154f2618922b406208480841e0000000000ff5f7404c200000020000000edfd32f6e760648c032f9acb4b30d514265f6a5b5f8a7154f2618922b40620841a0000000600000068656c6c6f6d0c00000048656c6c6f206d6f73616963050000006c6f72656d04000000150000000c00000064697669736962696c6974790100000034180000000d000000696e697469616c537570706c79030000003230301a0000000d000000737570706c794d757461626c650500000066616c7365180000000c0000007472616e7366657261626c650400000074727565000000002800000054414c49434532474d4133344358484437584c4a513533364e4d35554e4b5148544f524e4e54324adc05000000000000',
                signature:
                    'f17c859710060f2ea9a0ab740ef427431cf36bdc7d263570ca282bd66032e9f5737a921be9839429732e663be2bb74ccc16f34f5157ff2ef00a65796b54e800e',
            },
        },
        {
            description: 'creation levy',
            params: {
                path: "m/44'/1'/0'/0'/0'",
                transaction: {
                    timeStamp: 74649215,
                    fee: 2000000,
                    type: NEM.TxType.MOSAIC_CREATION,
                    deadline: 74735615,
                    message: {},
                    mosaicDefinition: {
                        id: {
                            namespaceId: 'hellom',
                            name: 'Hello mosaic',
                        },
                        levy: {
                            type: 1,
                            fee: 2,
                            recipient: 'TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J',
                            mosaicId: {
                                namespaceId: 'hellom',
                                name: 'Hello mosaic',
                            },
                        },
                        properties: [
                            {
                                name: 'divisibility',
                                value: '4',
                            },
                            {
                                name: 'initialSupply',
                                value: '200',
                            },
                            {
                                name: 'supplyMutable',
                                value: 'false',
                            },
                            {
                                name: 'transferable',
                                value: 'true',
                            },
                        ],
                        description: 'lorem',
                    },
                    version: NEM.TxVersion.testnet,
                    creationFeeSink: 'TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J',
                    creationFee: 1500,
                },
            },
            result: {
                data: '01400000010000987f0e730420000000edfd32f6e760648c032f9acb4b30d514265f6a5b5f8a7154f2618922b406208480841e0000000000ff5f74041801000020000000edfd32f6e760648c032f9acb4b30d514265f6a5b5f8a7154f2618922b40620841a0000000600000068656c6c6f6d0c00000048656c6c6f206d6f73616963050000006c6f72656d04000000150000000c00000064697669736962696c6974790100000034180000000d000000696e697469616c537570706c79030000003230301a0000000d000000737570706c794d757461626c650500000066616c7365180000000c0000007472616e7366657261626c65040000007472756556000000010000002800000054414c49434532474d4133344358484437584c4a513533364e4d35554e4b5148544f524e4e54324a1a0000000600000068656c6c6f6d0c00000048656c6c6f206d6f7361696302000000000000002800000054414c49434532474d4133344358484437584c4a513533364e4d35554e4b5148544f524e4e54324adc05000000000000',
                signature:
                    'b87aac1ddf146d35e6a7f3451f57e2fe504ac559031e010a51261257c37bd50fcfa7b2939dd7a3203b54c4807d458475182f5d3dc135ec0d1d4a9cd42159fd0a',
            },
        },
    ],
};
