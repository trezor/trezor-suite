const { ADDRESS_N, TX_CACHE } = global.TestUtils;

// vectors from https://github.com/trezor/trezor-firmware/blob/master/tests/device_tests/test_msg_signtx.py

const outputs = [];
const total = 255;
for (let i = 0; i < total; i++) {
    const output = {
        address: '1NwN6UduuVkJi6sw3gSiKZaCY5rHgVXC2h',
        amount: Math.floor((100000 + 2540000 - 39000) / total).toString(),
        script_type: 'PAYTOADDRESS',
    };

    outputs.push(output);
}

let serializedTx =
    '0100000002fb792f470a58993e14964c9bd46cdf37cb4bbc3f61540cb651580c82ed243ec6010000006b483045022100f7b7eed8b39ef3859615b8d191053b202da022839500bf4227a292f62ea553860220590e82e847c6d161195a1e95af70270d9a42cc6e808960f13879e584759167830121034fd90850dfab2ae698c9cf58ce3182d4d06676e1abf012331659c9434098100affffffffe56582d2119100cb1d3da8232291e053f71e25fb669c87b32a667749959ea239010000006b483045022100e6d0c72941ece2756f5bb3bbcc3e93f7dc1c8a600800dcc7208c323781bfd1c102205ddc3c397f52924d3d5f1fdef7264504db3b9120af362c137b0093dc5a5607e80121039649f4e976edf6daced9d8e9c747d60059d12d6665ef7cc5abd3a833eeffdc67fffffffffdff00';
serializedTx += 'd8270000000000001976a914f0a2b64e56ee2ff57126232f84af6e3a41d4055088ac'.repeat(
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
                        amount: '380000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['d5f65e']),
                coin: 'btc',
            },
            result: {
                serializedTx:
                    '010000000182488650ef25a58fef6788bd71b8212038d7f2bbe4750bc7bcb44701e85ef6d5000000006a47304402205711944d5ae2ec3acb9e4d6b4615ba197276424bc2ec2dc7da9ab7ecb6b9119302200bad5c4ee3495c36394c056931ae2c49f4f13ff045bfb4112d80fbcf65e8f4a1012103c6d9cc725bb7e19c026df03bf693ee1171371a8eaf25f04b7a58f6befabcd38cffffffff0160cc0500000000001976a914de9b2a8da088824e8fe51debea566617d851537888ac00000000',
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
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        prev_hash:
                            '6f90f3c7cbec2258b0971056ef3fe34128dbde30daa9c0639a898f9977299d54',
                        prev_index: 1,
                        amount: '1000000000',
                    },
                ],
                outputs: [
                    {
                        address: 'mfiGQVPcRcaEvQPYDErR34DcCovtxYvUUV',
                        amount: '492000000', // 1000000000 - 500000000 - 8000000
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/1/0"),
                        amount: '500000000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['6f90f3']),
                coin: 'Testnet',
            },
            result: {
                serializedTx:
                    '0100000001549d2977998f899a63c0a9da30dedb2841e33fef561097b05822eccbc7f3906f010000006b483045022100ed44faf22e1041b082bb3e38583dea9ef9ae377fe1e91efeca0775c931730b8a02204848fbfcd94f1d16d131dd7bc34477ed0330ca1deedf1f2b6aa997ea7e7ea6b40121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0ffffffff020053531d000000001976a9140223b1a09138753c9cb0baf95a0a62c82711567a88ac0065cd1d000000001976a9143d3cca567e00a04819742b21a696a67da796498b88ac00000000',
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
            description: 'Bitcoin (P2PKH): 1 input, 3 outputs',
            params: {
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
                        amount: '288000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: '13uaUYn6XAooo88QvAqAVsiVvr2mAXutqP',
                        amount: '12000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: ADDRESS_N("m/44'/0'/0'/1/0"),
                        amount: '80000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['d5f65e']),
                coin: 'btc',
            },
            result: {
                serializedTx:
                    '010000000182488650ef25a58fef6788bd71b8212038d7f2bbe4750bc7bcb44701e85ef6d5000000006a473044022016b4372cb011c5c5643ff00345b76d82c1b24a09fe45608fa27233f70215a7fb02204356d16c1103c473200b291822a94a3e1e00b6705b55210fd6ec3149e2f2f194012103c6d9cc725bb7e19c026df03bf693ee1171371a8eaf25f04b7a58f6befabcd38cffffffff0300650400000000001976a914de9b2a8da088824e8fe51debea566617d851537888ace02e0000000000001976a9141fe1d337fb81afca42818051e12fd18245d1b17288ac80380100000000001976a9148e46fd00f541077d9c1f6a87cb0427d38a4f09c388ac00000000',
            },
        },
        {
            description: 'Bitcoin (P2PKH): 2 inputs, 1 output, 1 change',
            params: {
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/0'/0'/0/0"),
                        prev_hash:
                            'c6be22d34946593bcad1d2b013e12f74159e69574ffea21581dad115572e031c',
                        prev_index: 1,
                        amount: '100000',
                    },
                    {
                        address_n: ADDRESS_N("m/44'/0'/0'/0/1"),
                        prev_hash:
                            '58497a7757224d1ff1941488d23087071103e5bf855f4c1c44e5c8d9d82ca46e',
                        prev_index: 1,
                        amount: '110000',
                    },
                ],
                outputs: [
                    {
                        address: '15Jvu3nZNP7u2ipw2533Q9VVgEu2Lu9F2B',
                        amount: '100000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: ADDRESS_N("m/44'/0'/0'/1/0"),
                        amount: '100000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['c6be22', '58497a']),
                coin: 'btc',
            },
            result: {
                serializedTx:
                    '01000000021c032e5715d1da8115a2fe4f57699e15742fe113b0d2d1ca3b594649d322bec6010000006a473044022075e05682b9e99086b213aa2d82003894ff1d5d91224285730ac888feab7fd8c102203219877ecbbb0412e34999924469947a03786d441532e4743a46f5e0c1a43750012103c6d9cc725bb7e19c026df03bf693ee1171371a8eaf25f04b7a58f6befabcd38cffffffff6ea42cd8d9c8e5441c4c5f85bfe50311078730d2881494f11f4d2257777a4958010000006a47304402207ad2d3f565a68b3ec27b14b0b952811b935152ac5b574d2049b1e2ced83af72b02207fa9677b7ac8a8ed50bfc2b91b83f8cc8b1df980f5be14f6cca54099a400d2da012102c651a011009e2c7e7b3ed2068857ca0a47cba35b73e06c32e3c06ef3aa67621dffffffff02a0860100000000001976a9142f4490d5263906e4887ca2996b9e207af3e7824088aca0860100000000001976a9148e46fd00f541077d9c1f6a87cb0427d38a4f09c388ac00000000',
            },
        },
        {
            // Tests if device implements serialization of len(outputs) correctly
            // See tx c63e24ed820c5851b60c54613fbc4bcb37df6cd49b4c96143e99580a472f79fb
            // See tx 39a29e954977662ab3879c66fb251ef753e0912223a83d1dcb009111d28265e5
            description: 'Bitcoin (P2PKH): 2 inputs, 255 outputs',
            customTimeout: 1000000,
            params: {
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/0'/1'/0/0"),
                        prev_hash:
                            'c63e24ed820c5851b60c54613fbc4bcb37df6cd49b4c96143e99580a472f79fb',
                        prev_index: 1,
                        amount: '100000',
                    },
                    {
                        address_n: ADDRESS_N("m/44'/0'/1'/0/1"),
                        prev_hash:
                            '39a29e954977662ab3879c66fb251ef753e0912223a83d1dcb009111d28265e5',
                        prev_index: 1,
                        amount: '2540000',
                    },
                ],
                outputs,
                refTxs: TX_CACHE(['c63e24', '39a29e']),
                coin: 'btc',
            },
            result: {
                serializedTx,
            },
        },
        // TODO: lots of inputs,
        // TODO: lots of change,
        {
            // See tx 1570416eb4302cf52979afd5e6909e37d8fdd874301f7cc87e547e509cb1caa6
            description: 'Bitcoin (P2PKH): fee too high',
            params: {
                coin: 'Bitcoin',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/0'/0'/0/0"),
                        prev_hash:
                            '1570416eb4302cf52979afd5e6909e37d8fdd874301f7cc87e547e509cb1caa6',
                        prev_index: 0,
                        amount: '100000000',
                    },
                ],
                outputs: [
                    {
                        address: '1MJ2tj2ThBE62zXbBYA5ZaN3fdve5CPAz1',
                        amount: '99490000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['157041']),
            },
            result: {
                serializedTx:
                    '0100000001a6cab19c507e547ec87c1f3074d8fdd8379e90e6d5af7929f52c30b46e417015000000006a47304402207055e55cca6cb638de36942b2031c46803a28e0d7a9c8bc31632e8117141962202202e40c412c2c5be6ff9fdc0b767203f171970cf960293fa3b7dbd9da31d9ce7bf012103c6d9cc725bb7e19c026df03bf693ee1171371a8eaf25f04b7a58f6befabcd38cffffffff01d018ee05000000001976a914de9b2a8da088824e8fe51debea566617d851537888ac00000000',
            },
        },
        // TODO hardfail, skip T1
        {
            // See tx d5f65ee80147b4bcc70b75e4bbf2d7382021b871bd8867ef8fa525ef50864882
            description: 'Bitcoin (P2PKH): not enough funds',
            params: {
                coin: 'Bitcoin',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
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
            // 25 TEST generated to m/1 (mfiGQVPcRcaEvQPYDErR34DcCovtxYvUUV)
            // See tx d6da21677d7cca5f42fbc7631d062c9ae918a0254f7c6c22de8e8cb7fd5b8236
            description: 'Testnet (P2PKH): spend coinbase',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        prev_hash:
                            'd6da21677d7cca5f42fbc7631d062c9ae918a0254f7c6c22de8e8cb7fd5b8236',
                        prev_index: 0,
                        amount: '2500278230',
                    },
                ],
                outputs: [
                    {
                        address: 'mm6FM31rM5Vc3sw5D7kztiBg3jHUzyqF1g',
                        amount: '2500268230',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['d6da21']),
            },
            result: {
                serializedTx:
                    '010000000136825bfdb78c8ede226c7c4f25a018e99a2c061d63c7fb425fca7c7d6721dad6000000006b483045022100b880610d115e4e17f6638f0e3a6d285d8f6b81119bf663db6392bf5a1c5312b70220214b5de941c3576c85c4c217672f861c89fb966d9dff3302682a8862e920d3810121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0ffffffff01c6100795000000001976a9143d2496e67f5f57a924353da42d4725b318e7a8ea88ac00000000',
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
            description: 'Bitcoin (P2PKH): p2pkh input, p2sh output',
            params: {
                coin: 'Bitcoin',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/0'/0'/0/0"),
                        prev_hash:
                            '54aa5680dea781f45ebb536e53dffc526d68c0eb5c00547e323b2c32382dfba3',
                        prev_index: 1,
                        amount: '400000',
                    },
                ],
                outputs: [
                    {
                        address: '3DKGE1pvPpBAgZj94MbCinwmksewUNNYVR',
                        amount: '390000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['54aa56']),
            },
            result: {
                serializedTx:
                    '0100000001a3fb2d38322c3b327e54005cebc0686d52fcdf536e53bb5ef481a7de8056aa54010000006b483045022100b417a8c4cc46e4bfe29b5f09e3a6d6f3b3262f6f3f315886a66ae060c057758e022019e2336d52a5691f4f335f5793b7ab742b29abdaebc32f053c68791ba9bd18e8012103c6d9cc725bb7e19c026df03bf693ee1171371a8eaf25f04b7a58f6befabcd38cffffffff0170f305000000000017a9147f844bdb0b8fd54b64e3d16c85dc1170f1ff97c18700000000',
            },
        },
        {
            description: 'Testnet (P2PKH): big amount',
            params: {
                coin: 'testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        prev_hash:
                            '2bac7ad1dec654579a71ea9555463f63ac7b7df9d8ba67b4682bba4e514d0f0c',
                        prev_index: 1,
                        amount: '411102528330',
                    },
                ],
                outputs: [
                    {
                        address: 'mopZWqZZyQc3F2Sy33cvDtJchSAMsnLi7b',
                        amount: '411102528330',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['2bac7a']),
            },
            result: {
                serializedTx:
                    '01000000010c0f4d514eba2b68b467bad8f97d7bac633f465595ea719a5754c6ded17aac2b010000006b4830450221008e3b926f04d8830bd5b67698af25c9e00c9db1b1ef3e5d69af794446753da94a02202d4a7509f26bba29ff643a7ac0d43fb128c1a632cc502b8f44eada8930fb9c9b0121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0ffffffff014ac39eb75f0000001976a9145b157a678a10021243307e4bb58f36375aa80e1088ac00000000',
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
