export default {
    method: 'nemSignTransaction',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: 'importance transfer',
            params: {
                path: "m/44'/1'/0'/0'/0'",
                transaction: {
                    timeStamp: 12349215,
                    fee: 9900,
                    type: 0x0801,
                    deadline: 99,
                    message: {},
                    importanceTransfer: {
                        mode: 1,
                        publicKey:
                            'c5f54ba980fcbb657dbaaa42700539b207873e134d2375efeab5f1ab52f87844',
                    },
                    version: -1744830464,
                },
            },
            result: {
                data: '01080000010000981f6fbc0020000000edfd32f6e760648c032f9acb4b30d514265f6a5b5f8a7154f2618922b4062084ac26000000000000630000000100000020000000c5f54ba980fcbb657dbaaa42700539b207873e134d2375efeab5f1ab52f87844',
                signature:
                    'b6d9434ec5df80e65e6e45d7f0f3c579b4adfe8567c42d981b06e8ac368b1aad2b24eebecd5efd41f4497051fca8ea8a5e77636a79afc46ee1a8e0fe9e3ba90b',
            },
        },
        {
            description: 'provision namespace',
            params: {
                path: "m/44'/1'/0'/0'/0'",
                transaction: {
                    timeStamp: 74649215,
                    fee: 2000000,
                    type: 0x2001,
                    deadline: 74735615,
                    message: {},
                    newPart: 'ABCDE',
                    rentalFeeSink: 'TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J',
                    rentalFee: 1500,
                    version: -1744830464,
                },
            },
            result: {
                data: '01200000010000987f0e730420000000edfd32f6e760648c032f9acb4b30d514265f6a5b5f8a7154f2618922b406208480841e0000000000ff5f74042800000054414c49434532474d4133344358484437584c4a513533364e4d35554e4b5148544f524e4e54324adc05000000000000050000004142434445ffffffff',
                signature:
                    'f047ae7987cd3a60c0d5ad123aba211185cb6266a7469dfb0491a0df6b5cd9c92b2e2b9f396cc2a3146ee185ba02df4f9e7fb238fe479917b3d274d97336640d',
            },
        },
    ],
};
