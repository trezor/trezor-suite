// https://github.com/trezor/trezor-firmware/blob/master/tests/device_tests/bitcoin/test_getownershipproof.py

const legacyResults = [
    {
        // getOwnershipProof not supported on T1B1 and T2T1 below 2.5.3
        rules: ['1', '<2.5.3'],
        success: false,
    },
];

export default {
    method: 'getOwnershipProof',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'Bitcoin (Bech32/P2WPKH): ownership proof',
            params: {
                path: "m/84'/0'/0'/1/0",
                coin: 'btc',
            },
            result: {
                ownership_proof:
                    '534c00190001a122407efc198211c81af4450f40b235d54775efd934d16b9e31c6ce9bad57070002483045022100c0dc28bb563fc5fea76cacff75dba9cb4122412faae01937cdebccfb065f9a7002202e980bfbd8a434a7fc4cd2ca49da476ce98ca097437f8159b1a386b41fcdfac50121032ef68318c8f6aaa0adec0199c69901f0db7d3485eb38d9ad235221dc3d61154b',
            },
            legacyResults,
        },
        {
            description: 'Bitcoin (Bech32/P2WPKH): ownership proof with user confirmation',
            params: {
                path: "m/84'/0'/0'/1/0",
                coin: 'btc',
                userConfirmation: true,
            },
            result: {
                ownership_proof:
                    '534c00190101a122407efc198211c81af4450f40b235d54775efd934d16b9e31c6ce9bad5707000247304402201c8d141bcb99660d5de876e51d929abd2954a2eb79adde83d25cc5e94f085ace02207b14736cd0515a11571bcecfbd44f11ca8a2d661b5235fd27837b74ca5071a120121032ef68318c8f6aaa0adec0199c69901f0db7d3485eb38d9ad235221dc3d61154b',
            },
            legacyResults,
        },
        {
            description: 'Bitcoin (Bech32/P2WPKH): ownership proof with commitment data',
            params: {
                path: "m/84'/0'/0'/1/0",
                coin: 'btc',
                userConfirmation: true,
                commitmentData: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
            },
            result: {
                ownership_proof:
                    '534c00190101a122407efc198211c81af4450f40b235d54775efd934d16b9e31c6ce9bad57070002483045022100b41c51d130d1e4e179679734b7fcb39abe8859727de10a782fac3f9bae82c31802205b0697eb1c101a1f5a3b103b7b6c34568adface1dbbb3512b783c66bb52f0c920121032ef68318c8f6aaa0adec0199c69901f0db7d3485eb38d9ad235221dc3d61154b',
            },
            legacyResults,
        },
        {
            description: 'Bitcoin (Taproot/P2TR): ownership proof',
            params: {
                path: "m/86'/0'/0'/1/0",
                coin: 'btc',
            },
            result: {
                ownership_proof:
                    '534c00190001dc18066224b9e30e306303436dc18ab881c7266c13790350a3fe415e438135ec000140647d6af883107a870417e808abe424882bd28ee04a28ba85a7e99400e1b9485075733695964c2a0fa02d4439ab80830e9566ccbd10f2597f5513eff9f03a0497',
            },
            legacyResults,
        },
        {
            description: 'Bundle of ownership proofs',
            params: {
                bundle: [
                    { path: "m/84'/0'/0'/1/0", coin: 'btc' },
                    { path: "m/86'/0'/0'/1/0", coin: 'btc' },
                    { path: "m/49'/1'/0'/0/0", coin: 'testnet' },
                    { path: "m/44'/1'/0'/0/0", coin: 'testnet' },
                ],
            },
            result: [
                {
                    ownership_proof:
                        '534c00190001a122407efc198211c81af4450f40b235d54775efd934d16b9e31c6ce9bad57070002483045022100c0dc28bb563fc5fea76cacff75dba9cb4122412faae01937cdebccfb065f9a7002202e980bfbd8a434a7fc4cd2ca49da476ce98ca097437f8159b1a386b41fcdfac50121032ef68318c8f6aaa0adec0199c69901f0db7d3485eb38d9ad235221dc3d61154b',
                },
                {
                    ownership_proof:
                        '534c00190001dc18066224b9e30e306303436dc18ab881c7266c13790350a3fe415e438135ec000140647d6af883107a870417e808abe424882bd28ee04a28ba85a7e99400e1b9485075733695964c2a0fa02d4439ab80830e9566ccbd10f2597f5513eff9f03a0497',
                },
                {
                    ownership_proof:
                        '534c001900011256b336c58c55d75984d73757f4954dd6eff86031986fcbf5ac6a7e103ae2c0171600140099a7ecbd938ed1839f5f6bf6d50933c6db9d5c02473044022047cba424b2f433ca53911efae5d51877ab29dad473faf5bd40c5d0de22f5379d02207618a5d23036c5ebd3154662a960574390420dfbc2503829308e5d9a39f10c790121033add1f0e8e3c3136f7428dd4a4de1057380bd311f5b0856e2269170b4ffa65bf',
                },
                {
                    ownership_proof:
                        '534c00190001dc7320db52b35530d9903e967cc863c4c962903f702c1cffd225630c444a5ba96a473044022033b0786c8d5ddf402396a53ebd6cedf2d0e291cc464d8576387eda5e254df11a0220304b968da695f96f6389adfaea6866d56296999e76df0089216bb9fc0719a83e0121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd000',
                },
            ],
            legacyResults,
        },
    ],
};
