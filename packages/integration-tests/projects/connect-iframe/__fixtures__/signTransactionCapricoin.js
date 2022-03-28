// deprecated. not supported anymore

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            // See tx 1bf227e6e24fe1f8ac98849fe06a2c5b77762e906fcf7e82787675f7f3a10bb8
            description: 'Capricoin: sign',
            params: {
                coin: 'Capricoin',
                timestamp: 1540316262,
                inputs: [
                    {
                        address_n: [2147483692, 2147483937, 2147483648, 0, 0],
                        prev_hash:
                            '3bf506c81ce84eda891679ddc797d162c17c60b15d6c0ac23be5e31369e7235f',
                        prev_index: 0,
                    },
                    {
                        address_n: [2147483692, 2147483937, 2147483648, 0, 0],
                        prev_hash:
                            'f3a6e6411f1b2dffd76d2729bae8e056f8f9ecf8996d3f428e75a6f23f2c5e8c',
                        prev_index: 1,
                    },
                ],
                outputs: [
                    {
                        address: 'CUGi8RGPWxbHM6FxF4eMEfqmQ6Bs5VjCdr',
                        amount: '2980000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                // since Capricoin doesn't have blockbook v2 implemented
                refTxs: [
                    {
                        hash: '3bf506c81ce84eda891679ddc797d162c17c60b15d6c0ac23be5e31369e7235f',
                        inputs: [
                            {
                                prev_hash:
                                    '915340ecc7466d287596f1f5b1fa0c1fa78c5b76ede0dff978fd6a1ca31eee24',
                                prev_index: 0,
                                script_sig:
                                    '483045022100c48a9689e2fc28c354d567390c15b94b86923f3c94b7674a69c20113cc83d16102202d0b12d451a4c28fd6c092bb46bf64e242a0c5898420e59c8d7799261ae449a9012103b3a1b0304d81f5a8366281c9a5516d8b3f1cfe6a720f3bf7a222e3a46a87f2c3',
                                sequence: 4294967295,
                            },
                        ],
                        bin_outputs: [
                            {
                                amount: '1000000',
                                script_pubkey: '76a914369df3cc0eb7acd7f0e0491a225a2ddad5ce3d4a88ac',
                            },
                            {
                                amount: '49452200',
                                script_pubkey: '76a91452546e612e890e3028ee4b3d8b6333bb6912bfae88ac',
                            },
                        ],
                        version: 1,
                        timestamp: 1540315430,
                        lock_time: 0,
                    },
                    {
                        hash: 'f3a6e6411f1b2dffd76d2729bae8e056f8f9ecf8996d3f428e75a6f23f2c5e8c',
                        inputs: [
                            {
                                prev_hash:
                                    '3bf506c81ce84eda891679ddc797d162c17c60b15d6c0ac23be5e31369e7235f',
                                prev_index: 1,
                                script_sig:
                                    '473044022064cc095beb149568f08d4f0b42fea2c41d5864a7c71e5770467c6e07dc03bc5702201ff7f2654ad7a09efca5483b7a7584fffccda9f79b6e9cdb77e407e66e07f71e012103e8d2aee7293fa37e85692b9f41d2fda52787f10cbe486642a0a7543cc478160b',
                                sequence: 4294967295,
                            },
                        ],
                        bin_outputs: [
                            {
                                amount: '47440250',
                                script_pubkey: '76a91483259afffb250f9dee12cd0240956ae5e0f351e088ac',
                            },
                            {
                                amount: '2000000',
                                script_pubkey: '76a914369df3cc0eb7acd7f0e0491a225a2ddad5ce3d4a88ac',
                            },
                        ],
                        version: 1,
                        timestamp: 1540315682,
                        lock_time: 0,
                    },
                ],
            },
            result: {
                serializedTx:
                    '01000000665ccf5b025f23e76913e3e53bc20a6c5db1607cc162d197c7dd791689da4ee81cc806f53b000000006b483045022100fce7ccbeb9524f36d118ebcfebcb133a05c236c4478e2051cfd5c9632920aee602206921b7be1a81f30cce3d8e7dba4597fc16a2761c42321c49d65eeacdfe3781250121021fcf98aee04939ec7df5762f426dc2d1db8026e3a73c3bbe44749dacfbb61230ffffffff8c5e2c3ff2a6758e423f6d99f8ecf9f856e0e8ba29276dd7ff2d1b1f41e6a6f3010000006a473044022015d967166fe9f89fbed8747328b1c4658aa1d7163e731c5fd5908feafe08e9a6022028af30801098418bd298cc60b143c52c48466f5791256721304b6eba4fdf0b3c0121021fcf98aee04939ec7df5762f426dc2d1db8026e3a73c3bbe44749dacfbb61230ffffffff01a0782d00000000001976a914818437acfd15780debd31f3fd21d4ca678bb36d188ac00000000',
            },
        },
        {
            // See tx 8302cb4b32815ac47e0d1a63081a7bbef843efeb7e29c414975f33dfe8b50e35
            description: 'Capricoin: 1 input, 2 outputs, fee',
            params: {
                coin: 'Capricoin',
                timestamp: 1540206900,
                inputs: [
                    {
                        address_n: [2147483692, 2147483937, 2147483648, 0, 0],
                        prev_hash:
                            '915340ecc7466d287596f1f5b1fa0c1fa78c5b76ede0dff978fd6a1ca31eee24',
                        prev_index: 0,
                    },
                ],
                outputs: [
                    {
                        address: 'CZ49j4UcZJffuHwxrbb31zs7qHVAD5ugKv',
                        amount: '479000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: [2147483692, 2147483937, 2147483648, 0, 4],
                        amount: '1000000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: [
                    {
                        hash: '915340ecc7466d287596f1f5b1fa0c1fa78c5b76ede0dff978fd6a1ca31eee24',
                        inputs: [
                            {
                                prev_index: 0,
                                sequence: 4294967295,
                                prev_hash:
                                    '4d3931b7232533e92ca1b222766616a2f4780fdcb4eedfb97de9e8841a3d6c79',
                                script_sig:
                                    '483045022100be4a22ea26f1c667485172069714aea89e9bae9c7249193eefc7005bd805a24f02204c3d16512f650752fc3fa9a2a6c695f2bbf28791dc5fb30e1516170953d527cf0121023c75a1a14d4dd8e38cba58b9b84a47677dea099cf4bd3772bab1b6e6253fcbf2',
                            },
                        ],
                        bin_outputs: [
                            {
                                amount: '50464150',
                                script_pubkey: '76a91427fb71078c68487b68448ff938c8f8e5e63dd36188ac',
                            },
                            {
                                amount: '1500000',
                                script_pubkey: '76a914369df3cc0eb7acd7f0e0491a225a2ddad5ce3d4a88ac',
                            },
                        ],
                        version: 1,
                        lock_time: 0,
                        timestamp: 1539867895,
                    },
                ],
            },
            result: {
                serializedTx:
                    '0100000034b1cd5b0124ee1ea31c6afd78f9dfe0ed765b8ca71f0cfab1f5f19675286d46c7ec405391000000006b483045022100d1ea4b08fa18b6c672d859939b4729f6c7aedb86ccf6dec8fd951cf49116415502206690a32ae8e0a02bbcae6102cedae0d14d2291f758eff786f85eb4642145a2f50121021fcf98aee04939ec7df5762f426dc2d1db8026e3a73c3bbe44749dacfbb61230ffffffff02184f0700000000001976a914b5fcce71b52fe2a05479610906e6aa81f4a6e76488ac40420f00000000001976a914544e87b53141b883b392d114168c5403899756c488ac00000000',
            },
        },
        {
            // See tx f65956f14d960fce26dc03948306516c606dd33b7612d063008fea390d48b12b
            description: 'Capricoin: 2 inputs, 2 outputs, fee',
            params: {
                coin: 'Capricoin',
                timestamp: 1540222966,
                inputs: [
                    {
                        address_n: [2147483692, 2147483937, 2147483648, 0, 0],
                        prev_hash:
                            '3d00cb457a7a0d8f491296340696271b9440a4b50e5429cf5e51fe128bce10d8',
                        prev_index: 0,
                    },
                    {
                        address_n: [2147483692, 2147483937, 2147483648, 0, 1],
                        prev_hash:
                            '8c4553a62d28a2aa605dc82e80c8e30fdadd49bf950d902c37c34428d5ff58a1',
                        prev_index: 0,
                    },
                ],
                outputs: [
                    {
                        address_n: [2147483692, 2147483937, 2147483648, 0, 1],
                        amount: '910000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: [2147483692, 2147483937, 2147483648, 0, 2],
                        amount: '5000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: [
                    {
                        hash: '3d00cb457a7a0d8f491296340696271b9440a4b50e5429cf5e51fe128bce10d8',
                        inputs: [
                            {
                                prev_index: 0,
                                sequence: 4294967295,
                                prev_hash:
                                    'f8a9bb54de8295de3cd681d89b69834812eb5222d04b3fec206eb273f69ffdbb',
                                script_sig:
                                    '483045022100d4302192de219a5a2d3c0ff9a6e60669031243bf94eae5cdad0031c813f0baea02204656145c113c6d144af80e6d9d2cfd0caa394180afa90ffd2197ec08bcf807380121034e9fef46313529347cddd19994817f446a3667a0652e57dc8cfe24a8c903f0f1',
                            },
                        ],
                        bin_outputs: [
                            {
                                amount: '990000',
                                script_pubkey: '76a914369df3cc0eb7acd7f0e0491a225a2ddad5ce3d4a88ac',
                            },
                        ],
                        version: 1,
                        lock_time: 0,
                        timestamp: 1540210634,
                    },
                    {
                        hash: '8c4553a62d28a2aa605dc82e80c8e30fdadd49bf950d902c37c34428d5ff58a1',
                        inputs: [
                            {
                                prev_index: 1,
                                sequence: 4294967295,
                                prev_hash:
                                    '55c64b250d22d5186f03da220ff806fe552454c6ff26379d607a77d24c564807',
                                script_sig:
                                    '483045022100f6249138c591442a9b84dec08d861b330f3c0746df50930c1780a3baaa22d31b022010d87b88336bfa853960ad4aab1a732f9b3304b8d16c7fb0a3e26774544747740121021fcf98aee04939ec7df5762f426dc2d1db8026e3a73c3bbe44749dacfbb61230',
                            },
                        ],
                        bin_outputs: [
                            {
                                amount: '9000',
                                script_pubkey: '76a914818437acfd15780debd31f3fd21d4ca678bb36d188ac',
                            },
                            {
                                amount: '90000',
                                script_pubkey: '76a9148f3990613fd894745994594346b646d0f2f886a788ac',
                            },
                        ],
                        version: 1,
                        lock_time: 0,
                        timestamp: 1536574600,
                    },
                ],
            },
            result: {
                serializedTx:
                    '01000000f6efcd5b02d810ce8b12fe515ecf29540eb5a440941b279606349612498f0d7a7a45cb003d000000006a47304402202a69b2ec8eba6f3b71b3064571f712093d41aa9058e4ac241c0afea3d6da77b0022026c07274b4a65059082373e515fc2fe0631ff12c35fdbe6b7007d17f41fa155c0121021fcf98aee04939ec7df5762f426dc2d1db8026e3a73c3bbe44749dacfbb61230ffffffffa158ffd52844c3372c900d95bf49ddda0fe3c8802ec85d60aaa2282da653458c000000006a473044022010ef754dd83044a2e5ccca4b25193cd2662461a0a02c00b7d88b2a73c6d388c602205a8f8844fe1eb1f1f5b1c199165a1487879b82fb012c831809e2a822ec32ca070121034e9fef46313529347cddd19994817f446a3667a0652e57dc8cfe24a8c903f0f1ffffffff02b0e20d00000000001976a914818437acfd15780debd31f3fd21d4ca678bb36d188ac88130000000000001976a914fe251c9c3f10efafe8ede9b2a6d58c326622cc7388ac00000000',
            },
        },
        {
            // See tx 915340ecc7466d287596f1f5b1fa0c1fa78c5b76ede0dff978fd6a1ca31eee24
            description: 'Capricoin: not enough funds',
            params: {
                coin: 'Capricoin',
                timestamp: 1539868245,
                inputs: [
                    {
                        address_n: [2147483692, 2147483937, 2147483648, 0, 0],
                        prev_hash:
                            '915340ecc7466d287596f1f5b1fa0c1fa78c5b76ede0dff978fd6a1ca31eee24',
                        prev_index: 1,
                    },
                ],
                outputs: [
                    {
                        address_n: [2147483692, 2147483937, 2147483648, 0, 1],
                        amount: '51976101',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: [
                    {
                        hash: '915340ecc7466d287596f1f5b1fa0c1fa78c5b76ede0dff978fd6a1ca31eee24',
                        inputs: [
                            {
                                prev_index: 0,
                                sequence: 4294967295,
                                prev_hash:
                                    '4d3931b7232533e92ca1b222766616a2f4780fdcb4eedfb97de9e8841a3d6c79',
                                script_sig:
                                    '483045022100be4a22ea26f1c667485172069714aea89e9bae9c7249193eefc7005bd805a24f02204c3d16512f650752fc3fa9a2a6c695f2bbf28791dc5fb30e1516170953d527cf0121023c75a1a14d4dd8e38cba58b9b84a47677dea099cf4bd3772bab1b6e6253fcbf2',
                            },
                        ],
                        bin_outputs: [
                            {
                                amount: '50464150',
                                script_pubkey: '76a91427fb71078c68487b68448ff938c8f8e5e63dd36188ac',
                            },
                            {
                                amount: '1500000',
                                script_pubkey: '76a914369df3cc0eb7acd7f0e0491a225a2ddad5ce3d4a88ac',
                            },
                        ],
                        version: 1,
                        lock_time: 0,
                        timestamp: 1539867895,
                    },
                ],
            },
            result: false,
        },
        {
            // See tx 1570416eb4302cf52979afd5e6909e37d8fdd874301f7cc87e547e509cb1caa6
            description: 'Capricoin: fee too high',
            params: {
                coin: 'Capricoin',
                timestamp: 1540210634,
                inputs: [
                    {
                        address_n: [2147483692, 2147483937, 2147483648, 0, 1],
                        prev_hash:
                            'f8a9bb54de8295de3cd681d89b69834812eb5222d04b3fec206eb273f69ffdbb',
                        prev_index: 0,
                    },
                ],
                outputs: [
                    {
                        address_n: [2147483692, 2147483937, 2147483648, 0, 0],
                        amount: '990000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: [
                    {
                        hash: 'f8a9bb54de8295de3cd681d89b69834812eb5222d04b3fec206eb273f69ffdbb',
                        inputs: [
                            {
                                prev_index: 1,
                                sequence: 4294967295,
                                prev_hash:
                                    '4d3931b7232533e92ca1b222766616a2f4780fdcb4eedfb97de9e8841a3d6c79',
                                script_sig:
                                    '4830450221009a7a8b6397b90a18e99d06d1acd4f76d0f2ae07f02731c824c5004bb4343c64a02203de54283ff92653cb9b02dce1f448bd44768d2810c3dc1f734806176d12aeb5a0121021fcf98aee04939ec7df5762f426dc2d1db8026e3a73c3bbe44749dacfbb61230',
                            },
                        ],
                        bin_outputs: [
                            {
                                amount: '1990000',
                                script_pubkey: '76a914818437acfd15780debd31f3fd21d4ca678bb36d188ac',
                            },
                        ],
                        version: 1,
                        lock_time: 0,
                        timestamp: 1539876340,
                    },
                ],
            },
            result: {
                serializedTx:
                    '01000000cabfcd5b01bbfd9ff673b26e20ec3f4bd02252eb124883699bd881d63cde9582de54bba9f8000000006b483045022100d4302192de219a5a2d3c0ff9a6e60669031243bf94eae5cdad0031c813f0baea02204656145c113c6d144af80e6d9d2cfd0caa394180afa90ffd2197ec08bcf807380121034e9fef46313529347cddd19994817f446a3667a0652e57dc8cfe24a8c903f0f1ffffffff01301b0f00000000001976a914369df3cc0eb7acd7f0e0491a225a2ddad5ce3d4a88ac00000000',
            },
        },
    ],
};
