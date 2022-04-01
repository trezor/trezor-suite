export default {
    method: 'nemSignTransaction',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: 'simple',
            params: {
                path: "m/44'/1'/0'/0'/0'",
                transaction: {
                    timeStamp: 74649215,
                    amount: '2000000',
                    fee: 2000000,
                    recipient: 'TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J',
                    type: 0x0101,
                    deadline: 74735615,
                    message: {
                        payload: '746573745f6e656d5f7472616e73616374696f6e5f7472616e73666572',
                        type: 1,
                    },
                    version: -1744830464,
                },
            },
            result: {
                data: '01010000010000987f0e730420000000edfd32f6e760648c032f9acb4b30d514265f6a5b5f8a7154f2618922b406208480841e0000000000ff5f74042800000054414c49434532474d4133344358484437584c4a513533364e4d35554e4b5148544f524e4e54324a80841e000000000025000000010000001d000000746573745f6e656d5f7472616e73616374696f6e5f7472616e73666572',
                signature:
                    '9cda2045324d05c791a4fc312ecceb62954e7740482f8df8928560d63cf273dea595023640179f112de755c79717757ef76962175378d6d87360ddb3f3e5f70f',
            },
        },
        {
            description: 'xem as mosaic',
            params: {
                path: "m/44'/1'/0'/0'/0'",
                transaction: {
                    timeStamp: 76809215,
                    amount: '5000000',
                    fee: 1000000,
                    recipient: 'TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J',
                    type: 0x0101,
                    deadline: 76895615,
                    message: {},
                    mosaics: [
                        {
                            mosaicId: {
                                namespaceId: 'nem',
                                name: 'xem',
                            },
                            quantity: 9000000,
                        },
                    ],
                    version: -1744830464,
                },
            },
            result: {
                data: '0101000002000098ff03940420000000edfd32f6e760648c032f9acb4b30d514265f6a5b5f8a7154f2618922b406208440420f00000000007f5595042800000054414c49434532474d4133344358484437584c4a513533364e4d35554e4b5148544f524e4e54324a404b4c000000000000000000010000001a0000000e000000030000006e656d0300000078656d4054890000000000',
                signature:
                    '7b25a84b65adb489ea55739f1ca2d83a0ae069c3c58d0ea075fc30bfe8f649519199ad2324ca229c6c3214191469f95326e99712124592cae7cd3a092c93ac0c',
            },
        },
        {
            description: 'unknown mosaic',
            params: {
                path: "m/44'/1'/0'/0'/0'",
                transaction: {
                    timeStamp: 76809215,
                    amount: '2000000',
                    fee: 1000000,
                    recipient: 'TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J',
                    type: 0x0101,
                    deadline: 76895615,
                    message: {},
                    mosaics: [
                        {
                            mosaicId: {
                                namespaceId: 'xxx',
                                name: 'aa',
                            },
                            quantity: 3500000,
                        },
                    ],
                    version: -1744830464,
                },
            },
            result: {
                data: '0101000002000098ff03940420000000edfd32f6e760648c032f9acb4b30d514265f6a5b5f8a7154f2618922b406208440420f00000000007f5595042800000054414c49434532474d4133344358484437584c4a513533364e4d35554e4b5148544f524e4e54324a80841e00000000000000000001000000190000000d00000003000000787878020000006161e067350000000000',
                signature:
                    '2f0280420eceb41ef9e5d94fa44ddda9cdc70b8f423ae18af577f6d85df64bb4aaf40cf24fc6eef47c63b0963611f8682348cecdc49a9b64eafcbe7afcb49102',
            },
        },
        {
            description: 'known mosaic',
            params: {
                path: "m/44'/1'/0'/0'/0'",
                transaction: {
                    timeStamp: 76809215,
                    amount: '3000000',
                    fee: 1000000,
                    recipient: 'NDMYSLXI4L3FYUQWO4MJOVL6BSTJJXKDSZRMT4LT',
                    type: 0x0101,
                    deadline: 76895615,
                    message: {},
                    mosaics: [
                        {
                            mosaicId: {
                                namespaceId: 'dim',
                                name: 'token',
                            },
                            quantity: 111000,
                        },
                    ],
                    version: 1744830464,
                },
            },
            result: {
                data: '0101000002000068ff03940420000000edfd32f6e760648c032f9acb4b30d514265f6a5b5f8a7154f2618922b406208440420f00000000007f559504280000004e444d59534c5849344c3346595551574f344d4a4f564c364253544a4a584b44535a524d54344c54c0c62d000000000000000000010000001c000000100000000300000064696d05000000746f6b656e98b1010000000000',
                signature:
                    'e7f14ef8c39727bfd257e109cd5acac31542f2e41f2e5deb258fc1db602b690eb1cabca41a627fe2adc51f3193db85c76b41c80bb60161eb8738ebf20b507104',
            },
        },
        {
            description: 'known mosaic with levy',
            params: {
                path: "m/44'/1'/0'/0'/0'",
                transaction: {
                    timeStamp: 76809215,
                    amount: '2000000',
                    fee: 1000000,
                    recipient: 'NDMYSLXI4L3FYUQWO4MJOVL6BSTJJXKDSZRMT4LT',
                    type: 0x0101,
                    deadline: 76895615,
                    message: {},
                    mosaics: [
                        {
                            mosaicId: {
                                namespaceId: 'dim',
                                name: 'coin',
                            },
                            quantity: 222000,
                        },
                    ],
                    version: 1744830464,
                },
            },
            result: {
                data: '0101000002000068ff03940420000000edfd32f6e760648c032f9acb4b30d514265f6a5b5f8a7154f2618922b406208440420f00000000007f559504280000004e444d59534c5849344c3346595551574f344d4a4f564c364253544a4a584b44535a524d54344c5480841e000000000000000000010000001b0000000f0000000300000064696d04000000636f696e3063030000000000',
                signature:
                    'd3222dd7b83d66bda0539827ac6f909d06e40350b5e5e893d6fa762f954e9bf7da61022ef04950e7b6dfa88a2278f2f8a1b21df2bc3af22b388cb3a90bf76f07',
            },
        },
        {
            description: 'multiple mosaics',
            params: {
                path: "m/44'/1'/0'/0'/0'",
                transaction: {
                    timeStamp: 76809215,
                    amount: '2000000',
                    fee: 1000000,
                    recipient: 'NDMYSLXI4L3FYUQWO4MJOVL6BSTJJXKDSZRMT4LT',
                    type: 0x0101,
                    deadline: 76895615,
                    message: {},
                    mosaics: [
                        {
                            mosaicId: {
                                namespaceId: 'nem',
                                name: 'xem',
                            },
                            quantity: 3000000,
                        },
                        {
                            mosaicId: {
                                namespaceId: 'abc',
                                name: 'mosaic',
                            },
                            quantity: 200,
                        },
                        {
                            mosaicId: {
                                namespaceId: 'nem',
                                name: 'xem',
                            },
                            quantity: 30000,
                        },
                        {
                            mosaicId: {
                                namespaceId: 'abc',
                                name: 'mosaic',
                            },
                            quantity: 2000000,
                        },
                        {
                            mosaicId: {
                                namespaceId: 'breeze',
                                name: 'breeze-token',
                            },
                            quantity: 111000,
                        },
                    ],
                    version: 1744830464,
                },
            },
            result: {
                data: '0101000002000068ff03940420000000edfd32f6e760648c032f9acb4b30d514265f6a5b5f8a7154f2618922b406208440420f00000000007f559504280000004e444d59534c5849344c3346595551574f344d4a4f564c364253544a4a584b44535a524d54344c5480841e000000000000000000030000001d0000001100000003000000616263060000006d6f7361696348851e0000000000260000001a00000006000000627265657a650c000000627265657a652d746f6b656e98b10100000000001a0000000e000000030000006e656d0300000078656df03b2e0000000000',
                signature:
                    'b2b9319fca87a05bee17108edd9a8f78aeffef74bf6b4badc6da5d46e8ff4fe82e24bf69d8e6c4097d072adf39d0c753e7580f8afb21e3288ebfb7c4d84e470d',
            },
        },
    ],
};
