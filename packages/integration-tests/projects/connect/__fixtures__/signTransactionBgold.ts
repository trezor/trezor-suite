const { ADDRESS_N, TX_CACHE } = global.TestUtils;

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_12',
        settings: {
            safety_checks: 2,
        },
    },
    tests: [
        {
            description: 'Bgold: 1 input, 1output, 1 change',
            params: {
                coin: 'Bgold',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/156'/0'/0/0"),
                        amount: '1252382934',
                        prev_hash:
                            '25526bf06c76ad3082bba930cf627cdd5f1b3cd0b9907dd7ff1a07e14addc985',
                        prev_index: 0,
                        script_type: 'SPENDADDRESS',
                    },
                ],
                outputs: [
                    {
                        address_n: ADDRESS_N("m/44'/156'/0'/1/0"),
                        amount: '1896050',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: 'GfDB1tvjfm3bukeoBTtfNqrJVFohS2kCTe',
                        amount: '1250485884',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['25526b']),
            },
            result: {
                serializedTx:
                    '010000000185c9dd4ae1071affd77d90b9d03c1b5fdd7c62cf30a9bb8230ad766cf06b5225000000006a4730440220199a1d14abaf2cc756ec0edfd1e59399225b181aa869a9fc6777f74ffad6744f0220560e79fddd50d3d3a6ad5ad4d079d052345b6c0452124864286a72e88810fc044121021659b2309dcfb7ff4b88e2dc1a18471fca2aa3da64d1c85515fabcc82904d476ffffffff0272ee1c00000000001976a9143f0cf98e116e3a4049c7e78f05f1e935802df01088ac7ce6884a000000001976a914ea5f904d195079a350b534db4446433b3cec222e88ac00000000',
            },
        },
        {
            description: 'Bgold: 2 inputs, 1 output, no change',
            params: {
                coin: 'Bgold',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/156'/0'/1/0"),
                        amount: '1252382934',
                        prev_hash:
                            '25526bf06c76ad3082bba930cf627cdd5f1b3cd0b9907dd7ff1a07e14addc985',
                        prev_index: 0,
                        script_type: 'SPENDADDRESS',
                    },
                    {
                        address_n: ADDRESS_N("m/44'/156'/0'/1/1"),
                        amount: '38448607',
                        prev_hash:
                            'db77c2461b840e6edbe7f9280043184a98e020d9795c1b65cb7cef2551a8fb18',
                        prev_index: 0,
                        script_type: 'SPENDADDRESS',
                    },
                ],
                outputs: [
                    {
                        address: 'GfDB1tvjfm3bukeoBTtfNqrJVFohS2kCTe',
                        amount: '1270830541',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['25526b', 'db77c2']),
            },
            result: {
                serializedTx:
                    '010000000285c9dd4ae1071affd77d90b9d03c1b5fdd7c62cf30a9bb8230ad766cf06b5225000000006a47304402203ae0f1c4188035a26507833679208f7ad577c4812bbba2ed50c54666ac386bfc022059be1525cd142dc709d5f7a1577e90b243e712460374b524d979b200422eef67412102cf2b28fa22872ab35cb6e0728b51fb4c5d18e99284d030bc64b890859c645d5dffffffff18fba85125ef7ccb651b5c79d920e0984a18430028f9e7db6e0e841b46c277db000000006b4830450221009c85769f815dd4c0fdeb6c7c6a2ec0a20b5aaf2be1e67e06ee0ff31bf9b8847202204fba481222bbbc70a4d1412bdfa2acc4e215a63080b0ee16bd163d79f99be8f94121025a639d0293154eecd7afc45dce239f2bc387c3c45b3844ee98eda272fd32d7aeffffffff01cd55bf4b000000001976a914ea5f904d195079a350b534db4446433b3cec222e88ac00000000',
            },
        },
        {
            description: 'Bgold (P2SH): 1 input, 2 outputs, no change',
            params: {
                coin: 'Bgold',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/49'/156'/0'/1/0"),
                        amount: '1252382934',
                        prev_hash:
                            '25526bf06c76ad3082bba930cf627cdd5f1b3cd0b9907dd7ff1a07e14addc985',
                        prev_index: 0,
                        script_type: 'SPENDP2SHWITNESS',
                    },
                ],
                outputs: [
                    {
                        address: 'GfDB1tvjfm3bukeoBTtfNqrJVFohS2kCTe',
                        amount: '12300000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: 'GZFLExxrvWFuFT1xRzhfwQWSE2bPDedBfn',
                        amount: '1240071934',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['25526b']),
            },
            result: {
                serializedTx:
                    '0100000000010185c9dd4ae1071affd77d90b9d03c1b5fdd7c62cf30a9bb8230ad766cf06b52250000000017160014bcf764faafca9982aba3612eb91370d091cddb4affffffff02e0aebb00000000001976a914ea5f904d195079a350b534db4446433b3cec222e88acfefee949000000001976a914a8f757819ec6779409f45788f7b4a0e8f51ec50488ac024730440220666b06c1bd8d3cc899ef95dccebeab394833c52bc13cb94074926e88e879936202201d0d0abda057f2e4244b1de913cb771d0e77f612aa305e73933e3c5d402fbb91412103e4c2e99d4d9a36f949e947d94391d01bd016826afd87132b3257a660139b3b8a00000000',
            },
        },
        {
            description: 'Bgold (P2SH): 1 input, 1output, 1 change',
            params: {
                coin: 'Bgold',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/49'/156'/0'/1/0"),
                        amount: '1252382934',
                        prev_hash:
                            '25526bf06c76ad3082bba930cf627cdd5f1b3cd0b9907dd7ff1a07e14addc985',
                        prev_index: 0,
                        script_type: 'SPENDP2SHWITNESS',
                    },
                ],
                outputs: [
                    {
                        address: 'GfDB1tvjfm3bukeoBTtfNqrJVFohS2kCTe',
                        amount: '12300000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: ADDRESS_N("m/49'/156'/0'/1/0"),
                        amount: '1240071934',
                        script_type: 'PAYTOP2SHWITNESS',
                    },
                ],
                refTxs: TX_CACHE(['25526b']),
            },
            result: {
                serializedTx:
                    '0100000000010185c9dd4ae1071affd77d90b9d03c1b5fdd7c62cf30a9bb8230ad766cf06b52250000000017160014bcf764faafca9982aba3612eb91370d091cddb4affffffff02e0aebb00000000001976a914ea5f904d195079a350b534db4446433b3cec222e88acfefee9490000000017a914fea1579ecdf0e50674819c9924fcc0007e7ec12b8702483045022100b494a98cf4f715432ae007b1bf43a6c918dfaf7a13257e8513422a4559451da9022036490ed9cd6f1aa418739a4c1df9b4b034287046456715daa74cd7c67c5c1fd0412103e4c2e99d4d9a36f949e947d94391d01bd016826afd87132b3257a660139b3b8a00000000',
            },
        },
        {
            description: 'Bgold (P2SH): spend multisig input',
            params: {
                coin: 'Bgold',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/49'/156'/1'/1/0"),
                        prev_hash:
                            '25526bf06c76ad3082bba930cf627cdd5f1b3cd0b9907dd7ff1a07e14addc985',
                        prev_index: 0,
                        script_type: 'SPENDP2SHWITNESS',
                        amount: '1252382934',
                        multisig: {
                            pubkeys: [
                                {
                                    node: 'xpub6BiJ9mt9dwmdCmLgwJBZgkBTacEkXiRE1LqiCLQZ98bp4nYsascxnmqKaXZZngo8cS9xxi4HJ4JQ9a6bHqaD3dA8BJ4afh4Ser75abaip3x',
                                    address_n: [1, 0],
                                },
                                {
                                    node: 'xpub6BiJ9mt9dwmdEeh7XMzJrgNGrxopkeaqAYeeohsAstAxowpNRPcRsL4G4bxMoU7v7u8XySLDMc7bugTja9aMQv7MkqmnAyvRi8VCcUDq9yt',
                                    address_n: [1, 0],
                                },
                                {
                                    node: 'xpub6BiJ9mt9dwmdHaW7EvKzmmgVogWw3FaEaMqVXPmSqNSxkCeJXsbt9vMcxv6KFme9nXkSo9fTmqHMHNKGJUbgG7csXcWtoQr9yHmbFqxF9qQ',
                                    address_n: [1, 0],
                                },
                            ],
                            signatures: ['', '', ''],
                            m: 2,
                        },
                    },
                ],
                outputs: [
                    {
                        address: 'GfDB1tvjfm3bukeoBTtfNqrJVFohS2kCTe',
                        amount: '1252381934',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['25526b']),
            },
            result: {
                signatures: [
                    '304402205c00ecc582981e3cb638fe65c937e30b9d1a01444e638ad41d197de4d274d30f02205bd2e2ab81840b1aef71d317c4b978cf2c1136e1c11dcfd0ce56eccbb7109657',
                ],
                serializedTx:
                    '0100000000010185c9dd4ae1071affd77d90b9d03c1b5fdd7c62cf30a9bb8230ad766cf06b52250000000023220020198a360103afea9552366b867e1f73767f4dd685208a4409613209a40f275ca6ffffffff01eed4a54a000000001976a914ea5f904d195079a350b534db4446433b3cec222e88ac030047304402205c00ecc582981e3cb638fe65c937e30b9d1a01444e638ad41d197de4d274d30f02205bd2e2ab81840b1aef71d317c4b978cf2c1136e1c11dcfd0ce56eccbb71096574169522103416827b81cd4f7d29c630aab60e8a70e600c515c2b6c897832547f40bbf91a6a2103bcaa12ef301c4d8289eda14dbb79f4d0a21933208c164afc90d8a287757a18b9210253c598baf64b3f0dad28d545c2169d6fdec59f870305aff6fd57818b1c86eee353ae00000000',
            },
        },
    ],
};
