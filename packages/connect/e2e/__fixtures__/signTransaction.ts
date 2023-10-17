const { ADDRESS_N, TX_CACHE } = global.TestUtils;

// vectors from https://github.com/trezor/trezor-firmware/blob/main/tests/device_tests/test_msg_signtx.py

const outputs = [];
const total = 255;
for (let i = 0; i < total; i++) {
    const output = {
        address: 'momtnzR3XqXgDSsFmd8gkGxUiHZLde3RmA',
        amount: 7129,
        script_type: 'PAYTOADDRESS',
    };

    outputs.push(output);
}

let serializedTx =
    '01000000018eacb9dc2bfa59e34b57ed9c49a14b4e783ad77fc8e43e5483cf25135d6ad558010000006a47304402203a0a7d9ab337770aa4f4f55834cfb6bb001be5574c88227e66f95d9867c7df11022029a84f1a03e6762649b07d5df1ae77b9f816a39927ae7844e4517916a424ac190121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0fffffffffdff00';
serializedTx += 'd91b0000000000001976a9145a9452b8db22e7fb606adafc731f5d4b482f9e8d88ac'.repeat(
    total,
);
serializedTx += '00000000';

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'Bitcoin (P2PKH): 1 input, 1 output, no change',
            params: {
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/0'/5'/0/9"),
                        prev_hash:
                            '0dac366fd8a67b2a89fbb0d31086e7acded7a5bbf9ef9daa935bc873229ef5b5',
                        prev_index: 0,
                        amount: 63988,
                    },
                ],
                outputs: [
                    {
                        address: '13Hbso8zgV5Wmqn3uA7h3QVtmPzs47wcJ7',
                        amount: 50248,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['0dac36']),
                coin: 'btc',
            },
            result: {
                serializedTx:
                    '0100000001b5f59e2273c85b93aa9deff9bba5d7deace78610d3b0fb892a7ba6d86f36ac0d000000006b483045022100dd4dd136a70371bc9884c3c51fd52f4aed9ab8ee98f3ac7367bb19e6538096e702200c56be09c4359fc7eb494b4bdf8f2b72706b0575c4021373345b593e9661c7b6012103d7f3a07085bee09697cf03125d5c8760dfed65403dba787f1d1d8b1251af2cbeffffffff0148c40000000000001976a91419140511436e947448be994ab7fda9f98623e68e88ac00000000',
            },
        },
        {
            description: 'Testnet (P2PKH): 1 input, 1 output, 1 change',
            params: {
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        prev_hash:
                            'e5040e1bc1ae7667ffb9e5248e90b2fb93cd9150234151ce90e14ab2f5933bcd',
                        prev_index: 0,
                        amount: '31000000',
                    },
                ],
                outputs: [
                    {
                        address: 'msj42CCGruhRsFrGATiUuh25dtxYtnpbTx',
                        amount: '30090000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/1/0"),
                        amount: '900000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['e5040e']),
                coin: 'Testnet',
            },
            result: {
                serializedTx:
                    '0100000001cd3b93f5b24ae190ce5141235091cd93fbb2908e24e5b9ff6776aec11b0e04e5000000006b483045022100eba3bbcbb82ab1ebac88a394e8fb53b0263dadbb3e8072f0a21ee62818c911060220686a9b7f306d028b54a228b5c47cc6c27b1d01a3b0770440bcc64d55d8bace2c0121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0ffffffff021023cb01000000001976a91485eb47fe98f349065d6f044e27a4ac541af79ee288aca0bb0d00000000001976a9143d3cca567e00a04819742b21a696a67da796498b88ac00000000',
            },
        },
        {
            description: 'Testnet (P2PKH): fee to high warning',
            params: {
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/7"),
                        prev_hash:
                            '25fee583181847cbe9d9fd9a483a8b8626c99854a72d01de848ef40508d0f3bc',
                        prev_index: 0,
                        amount: 129999808,
                    },
                ],
                outputs: [
                    {
                        address: 'mnY26FLTzfC94mDoUcyDJh1GVE3LuAUMbs',
                        amount: 129999808 - 2500000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['25fee5']),
                coin: 'Testnet',
            },
            result: {
                serializedTx:
                    '0100000001bcf3d00805f48e84de012da75498c926868b3a489afdd9e9cb47181883e5fe25000000006a47304402201602fd17c6e1d8c785ce150d6c0ec97f8a93fb71f6294f3a1de7dd52a52e27fe022079c05bc14f7b94771d195cb330a4dd7c0765290c6e183ae6aa169e4d5ccf2a3a0121035169c4d6a36b6c4f3e210f46d329efa1cb7a67ffce7d62062d4a8a17c23756e1ffffffff01207e9907000000001976a9144cfc772f24b600762f905a1ee799ce0e9c26831f88ac00000000',
            },
        },
        {
            description: 'Bitcoin (P2PKH): 1 input, 1 output, 1 change',
            params: {
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/0'/0'/0/5"),
                        prev_hash:
                            '50f6f1209ca92d7359564be803cb2c932cde7d370f7cee50fd1fad6790f6206d',
                        prev_index: 1,
                        amount: '50000',
                    },
                ],
                outputs: [
                    {
                        address_n: ADDRESS_N("m/44'/0'/0'/1/3"),
                        amount: '30000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: '1Up15Msx4sbvUCGm8Xgo2Zp5FQim3wE59',
                        amount: '10000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['50f6f1']),
                coin: 'btc',
            },
            result: {
                serializedTx:
                    '01000000016d20f69067ad1ffd50ee7c0f377dde2c932ccb03e84b5659732da99c20f1f650010000006a47304402203429bd3ce7b38c5c1e8a15340edd79ced41a2939aae62e259d2e3d18e0c5ee7602201b83b10ebc4d6dcee3f9eb42ba8f1ef8a059a05397e0c1b9223d1565a3e6ec01012102a7a079c1ef9916b289c2ff21a992c808d0de3dfcf8a9f163205c5c9e21f55d5cffffffff0230750000000000001976a914954820f1de627a703596ac0396f986d958e3de4c88ac10270000000000001976a91405427736705cfbfaff76b1cff48283707fb1037088ac00000000',
            },
        },
        {
            description: 'Testnet (P2PKH): 1 input, 3 outputs',
            params: {
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/1'/0/21"),
                        prev_hash:
                            'bb5169091f09e833e155b291b662019df56870effe388c626221c5ea84274bc4',
                        prev_index: 0,
                        amount: 1183825,
                    },
                ],
                outputs: [
                    {
                        address: 'mgCyjvJaTgVwKoxEaFaDLeFQpZc7qdKXpZ',
                        amount: 100100,
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: 'n4qJziM7S8ydGbXKKRJADHuSeAjbx5c1Dp',
                        amount: 100100,
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: ADDRESS_N("m/44'/1'/1'/1/21"),
                        amount: 1183825 - 100100 - 100100 - 10000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['bb5169']),
                coin: 'testnet',
            },
            result: {
                serializedTx:
                    '0100000001c44b2784eac52162628c38feef7068f59d0162b691b255e133e8091f096951bb000000006b483045022100d9d870e818bf892b76bcb0e68368ce2a1854526e02b8f8b9a480a2bd6f30c6c302204f771373744d00bd7320237878446e5567cb2359db5fbd6a46d35e37a98b16c0012102eee6b3ec6435f42ca071707eb1b14647d2121e0f8a53fa7fa9f92a691227a3d9ffffffff0304870100000000001976a9140791d872b21bf1ae4d7bda4a5c16edefa0b5754488ac04870100000000001976a914ffc3a922d44ced4fcf40df09479e36ee136ec44a88ac39db0e00000000001976a914d7d945b35976a9dbf3f16f2243b5d3da1965538988ac00000000',
            },
        },
        {
            description: 'Bitcoin (P2PKH): 2 inputs, 1 output, 1 change',
            params: {
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/0'/0'/0/55"),
                        prev_hash:
                            'ac4ca0e7827a1228f44449cb57b4b9a809a667ca044dc43bb124627fed4bc10a',
                        prev_index: 1,
                        amount: 10000,
                    },
                    {
                        address_n: ADDRESS_N("m/44'/0'/0'/1/7"),
                        prev_hash:
                            'ac4ca0e7827a1228f44449cb57b4b9a809a667ca044dc43bb124627fed4bc10a',
                        prev_index: 0,
                        amount: 83130,
                    },
                ],
                outputs: [
                    {
                        address_n: ADDRESS_N("m/44'/0'/0'/1/8"),
                        amount: 71790,
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: '1ByqmhXkC6U5GuUNnAhJsuEVjHt5GhEuJL',
                        amount: 10000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['ac4ca0']),
                coin: 'btc',
            },
            result: {
                serializedTx:
                    '01000000020ac14bed7f6224b13bc44d04ca67a609a8b9b457cb4944f428127a82e7a04cac010000006b483045022100c6dea23b4f43b7aa9ee1b1bb73da8b5e0f16a1160bf0ff1b0493fc7f5d52d79702202dd70a38530ba8ac16f8f5fceab593574241593c8368c27e63325c77417f4a5b01210352b08794e4ac7c33ffa00772e6d1ac6495ec1ffec6f94e76810d6d758749cb0dffffffff0ac14bed7f6224b13bc44d04ca67a609a8b9b457cb4944f428127a82e7a04cac000000006a4730440220050a20fb7d2d5ab57b730fe9f39c3dfe56bd368e38309a41aeb739831dd75e1e02205cfc7608b08dd7236641851a648573623e53b4cbcdbc2a7fbcb0e1f5d067a6e3012102f4c0b068cb14b4d8264097c9ebf262cee4b3e70cf078b49fb29b37cd1d90e6bbffffffff026e180100000000001976a9147c108a5a090dcf88c0df6a6fe1a846ee3193972d88ac10270000000000001976a9147871436e524916ac9faed014a181b20d74723bb588ac00000000',
            },
        },
        {
            // Tests if device implements serialization of len(outputs) correctly
            // See tx c63e24ed820c5851b60c54613fbc4bcb37df6cd49b4c96143e99580a472f79fb
            // See tx 39a29e954977662ab3879c66fb251ef753e0912223a83d1dcb009111d28265e5
            description: 'Testnet (P2PKH): 1 input, 255 outputs',
            customTimeout: 1000000,
            params: {
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        prev_hash:
                            '58d56a5d1325cf83543ee4c87fd73a784e4ba1499ced574be359fa2bdcb9ac8e',
                        prev_index: 1,
                        amount: 1827955,
                    },
                ],
                outputs,
                refTxs: TX_CACHE(['58d56a']),
                coin: 'testnet',
            },
            result: {
                serializedTx,
            },
        },
        // TODO: lots of inputs,
        // TODO: lots of change,
        {
            description: 'Bitcoin (P2PKH): fee too high',
            params: {
                coin: 'Bitcoin',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/0'/0'/0/10"),
                        prev_hash:
                            '1f326f65768d55ef146efbb345bd87abe84ac7185726d0457a026fc347a26ef3',
                        prev_index: 0,
                        amount: 3801747,
                    },
                ],
                outputs: [
                    {
                        address: '1DXKPgQU6ACQiww48chz7iPJhoV5L5bjRC',
                        amount: 3801747 - 510000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['1f326f']),
            },
            result: {
                serializedTx:
                    '0100000001f36ea247c36f027a45d0265718c74ae8ab87bd45b3fb6e14ef558d76656f321f000000006a4730440220342860add2f161c74a67462cd209783557ab5affafe12fa53436a924eb2b2bcb022032be926c63df8532464e9e4adf0cf8f4609f959e230c58fdf306302f3b7fa60a0121038bac33bcdaeec5626e2f2c5680a9fdc5e551d4e1167f272825bea98e6158d4c8ffffffff01633a3200000000001976a914895d571ebb79808367bfd2a70742ac08f519cb6088ac00000000',
            },
        },
        // TODO hardfail, skip T1B1
        {
            description: 'Bitcoin (P2PKH): not enough funds',
            params: {
                coin: 'Bitcoin',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/0'/0'/0/0"),
                        prev_hash:
                            'd5f65ee80147b4bcc70b75e4bbf2d7382021b871bd8867ef8fa525ef50864882',
                        prev_index: 0,
                        amount: '390000',
                    },
                ],
                outputs: [
                    {
                        address: '1MJ2tj2ThBE62zXbBYA5ZaN3fdve5CPAz1',
                        amount: '400000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['d5f65e']),
            },
            result: false,
        },
        {
            description: 'Testnet (P2PKH): spend coinbase',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        prev_hash:
                            '005f6f7ff4b70aa09a15b3bc36607d378fad104c4efa4f0a1c8e970538622b3e',
                        prev_index: 0,
                        amount: 2500278230,
                    },
                ],
                outputs: [
                    {
                        address: 'mm6FM31rM5Vc3sw5D7kztiBg3jHUzyqF1g',
                        amount: 2500278230 - 10000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['005f6f'], true), // Fake tx
            },
            result: {
                serializedTx:
                    '01000000013e2b623805978e1c0a4ffa4e4c10ad8f377d6036bcb3159aa00ab7f47f6f5f00000000006b483045022100a9a3e743017256fa7da39f73e7fd477edd9ba173055b32c99c99da59c23f2cde022023e4d28392f8a11967eaf8548883f9ffbb08dc7722937eb91db732fa1bef4b5b0121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0ffffffff01c6100795000000001976a9143d2496e67f5f57a924353da42d4725b318e7a8ea88ac00000000',
            },
        },
        {
            // tx e5040e1bc1ae766v7ffb9e5248e90b2fb93cd9150234151ce90e14ab2f5933bcd
            description: 'Testnet (P2PKH): two changes',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        prev_hash:
                            'e5040e1bc1ae7667ffb9e5248e90b2fb93cd9150234151ce90e14ab2f5933bcd',
                        prev_index: 0,
                        amount: '31000000',
                    },
                ],
                outputs: [
                    {
                        address: 'msj42CCGruhRsFrGATiUuh25dtxYtnpbTx',
                        amount: '30090000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        // change
                        address_n: ADDRESS_N("m/44'/1'/0'/1/0"),
                        amount: '900000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        // change
                        address_n: ADDRESS_N("m/44'/1'/0'/1/1"),
                        amount: '10000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['e5040e']),
            },
            result: {
                serializedTx:
                    '0100000001cd3b93f5b24ae190ce5141235091cd93fbb2908e24e5b9ff6776aec11b0e04e5000000006a47304402200358ba90bd197fd99355d52762b5554a3d31ba9eacfabcccbb1aba1c30205c430220202d3fd4dea2b41cc776f96e04625419b145b4b8fdbaa8bf5b7fddac96bc58870121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0ffffffff031023cb01000000001976a91485eb47fe98f349065d6f044e27a4ac541af79ee288aca0bb0d00000000001976a9143d3cca567e00a04819742b21a696a67da796498b88ac10270000000000001976a9142bfe432c30de9a4635917cece22e8a7b93a86f3188ac00000000',
            },
        },
        {
            description: 'Testnet (P2PKH): p2pkh input, p2sh output',
            params: {
                coin: 'testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/2"),
                        prev_hash:
                            '58d56a5d1325cf83543ee4c87fd73a784e4ba1499ced574be359fa2bdcb9ac8e',
                        prev_index: 0,
                        amount: 50000,
                    },
                ],
                outputs: [
                    {
                        address: '2N4sUHkkx1GgWtMMgjVD5Ljw2yDs7GumT2S',
                        amount: 50000 - 10000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['58d56a']),
            },
            result: {
                serializedTx:
                    '01000000018eacb9dc2bfa59e34b57ed9c49a14b4e783ad77fc8e43e5483cf25135d6ad558000000006a473044022029b7d07f068501dc7a5dcf5148167a286a949483cac88b6f85b3ae92baa3346902203488709587453467248d52d0f18fa36d43909854ee1958feef5c9b78c509d15d012103f5008445568548bd745a3dedccc6048969436bf1a49411f60938ff1938941f14ffffffff01409c00000000000017a9147f844bdb0b8fd54b64e3d16c85dc1170f1ff97c18700000000',
            },
        },
        {
            description: 'Testnet (P2PKH): big amount',
            params: {
                coin: 'testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/6"),
                        prev_hash:
                            '074b0070939db4c2635c1bef0c8e68412ccc8d3c8782137547c7a2bbde073fc0',
                        prev_index: 1,
                        amount: 4500000000,
                    },
                ],
                outputs: [
                    {
                        address: '2N5daLhptwpXPBY84TQ2AjeLLkL8ru7n6ai',
                        amount: 4500000000 - 10000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['074b00']),
            },
            result: {
                serializedTx:
                    '0100000001c03f07debba2c747751382873c8dcc2c41688e0cef1b5c63c2b49d9370004b07010000006b483045022100a2c79eaed632746fd514aa09eae51c0294bdf66c74619306e0273cd1a470c9e7022050c78dec6acd65b42150dba70e2b546dfd737d77f46975a97427999cb2b8280401210344e14b3da8f5fe77a5465d0f8fe089d64ed5517d1f1f989edd00f530938a2c22ffffffff01f065380c0100000017a91487dba64df7e9386d0b0f3ef557269833e12d1b7a8700000000',
            },
        },
        {
            description: 'Testnet (P2PKH): change on mainchain allowed',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        prev_hash:
                            'e5040e1bc1ae7667ffb9e5248e90b2fb93cd9150234151ce90e14ab2f5933bcd',
                        prev_index: 0,
                        amount: '31000000',
                    },
                ],
                outputs: [
                    {
                        address: 'msj42CCGruhRsFrGATiUuh25dtxYtnpbTx',
                        amount: '30090000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        // change on main chain is allowed => treated as a change
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        amount: '900000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['e5040e']),
            },
            result: {
                serializedTx:
                    '0100000001cd3b93f5b24ae190ce5141235091cd93fbb2908e24e5b9ff6776aec11b0e04e5000000006a473044022068d9e1500a528bf6a27bb1f41bf2fa98610f089e0fcabf92633dcf2da79d751e022072d01aa62908b2d109bc7b87bbbd3529ada89126022be733ba183f465e9f1a790121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0ffffffff021023cb01000000001976a91485eb47fe98f349065d6f044e27a4ac541af79ee288aca0bb0d00000000001976a914a579388225827d9f2fe9014add644487808c695d88ac00000000',
            },
        },
    ],
};
