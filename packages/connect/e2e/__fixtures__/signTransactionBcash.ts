const { ADDRESS_N, TX_CACHE } = global.TestUtils;

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'Bcash: 1 input, 1 output, 1 change',
            params: {
                coin: 'Bcash',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/145'/0'/0/0"),
                        amount: '1995344',
                        prev_hash:
                            'bc37c28dfb467d2ecb50261387bf752a3977d7e5337915071bb4151e6b711a78',
                        prev_index: 0,
                        script_type: 'SPENDADDRESS',
                    },
                ],
                outputs: [
                    {
                        address_n: ADDRESS_N("m/44'/145'/0'/1/0"),
                        amount: '1896050',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: 'bitcoincash:qr23ajjfd9wd73l87j642puf8cad20lfmqdgwvpat4',
                        amount: '73452',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['bc37c2']),
            },
            result: {
                signatures: [
                    '3044022061aee4f17abe044d5df8c52c9ffd3b84e5a29743517e488b20ecf1ae0b3e4d3a02206bb84c55e407f3b684ff8d9bea0a3409cfd865795a19d10b3d3c31f12795c34a',
                ],
                serializedTx:
                    '0100000001781a716b1e15b41b07157933e5d777392a75bf87132650cb2e7d46fb8dc237bc000000006a473044022061aee4f17abe044d5df8c52c9ffd3b84e5a29743517e488b20ecf1ae0b3e4d3a02206bb84c55e407f3b684ff8d9bea0a3409cfd865795a19d10b3d3c31f12795c34a412103a020b36130021a0f037c1d1a02042e325c0cb666d6478c1afdcd9d913b9ef080ffffffff0272ee1c00000000001976a914b1401fce7e8bf123c88a0467e0ed11e3b9fbef5488acec1e0100000000001976a914d51eca49695cdf47e7f4b55507893e3ad53fe9d888ac00000000',
            },
        },
        {
            description: 'Bcash: 2 inputs, 1 output, no change',
            params: {
                coin: 'Bcash',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/145'/0'/1/0"),
                        amount: '1896050',
                        prev_hash:
                            '502e8577b237b0152843a416f8f1ab0c63321b1be7a8cad7bf5c5c216fcf062c',
                        prev_index: 0,
                        script_type: 'SPENDADDRESS',
                    },
                    {
                        address_n: ADDRESS_N("m/44'/145'/0'/0/1"),
                        amount: '73452',
                        prev_hash:
                            '502e8577b237b0152843a416f8f1ab0c63321b1be7a8cad7bf5c5c216fcf062c',
                        prev_index: 1,
                        script_type: 'SPENDADDRESS',
                    },
                ],
                outputs: [
                    {
                        address: 'bitcoincash:qq6wnnkrz7ykaqvxrx4hmjvayvzjzml54uyk76arx4',
                        amount: '1934960',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['502e85']),
            },
            result: {
                signatures: [
                    '304402207a2a955f1cb3dc5f03f2c82934f55654882af4e852e5159639f6349e9386ec4002205fb8419dce4e648eae8f67bc4e369adfb130a87d2ea2d668f8144213b12bb457',
                    '3044022062151cf960b71823bbe68c7ed2c2a93ad1b9706a30255fddb02fcbe056d8c26102207bad1f0872bc5f0cfaf22e45c925c35d6c1466e303163b75cb7688038f1a5541',
                ],
                serializedTx:
                    '01000000022c06cf6f215c5cbfd7caa8e71b1b32630cabf1f816a4432815b037b277852e50000000006a47304402207a2a955f1cb3dc5f03f2c82934f55654882af4e852e5159639f6349e9386ec4002205fb8419dce4e648eae8f67bc4e369adfb130a87d2ea2d668f8144213b12bb457412103174c61e9c5362507e8061e28d2c0ce3d4df4e73f3535ae0b12f37809e0f92d2dffffffff2c06cf6f215c5cbfd7caa8e71b1b32630cabf1f816a4432815b037b277852e50010000006a473044022062151cf960b71823bbe68c7ed2c2a93ad1b9706a30255fddb02fcbe056d8c26102207bad1f0872bc5f0cfaf22e45c925c35d6c1466e303163b75cb7688038f1a5541412102595caf9aeb6ffdd0e82b150739a83297358b9a77564de382671056ad9e5b8c58ffffffff0170861d00000000001976a91434e9cec317896e818619ab7dc99d2305216ff4af88ac00000000',
            },
        },
        {
            description: 'Bcash: legacy address in output',
            params: {
                coin: 'Bcash',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/145'/0'/1/0"),
                        amount: '1896050',
                        prev_hash:
                            '502e8577b237b0152843a416f8f1ab0c63321b1be7a8cad7bf5c5c216fcf062c',
                        prev_index: 0,
                        script_type: 'SPENDADDRESS',
                    },
                    {
                        address_n: ADDRESS_N("m/44'/145'/0'/0/1"),
                        amount: '73452',
                        prev_hash:
                            '502e8577b237b0152843a416f8f1ab0c63321b1be7a8cad7bf5c5c216fcf062c',
                        prev_index: 1,
                        script_type: 'SPENDADDRESS',
                    },
                ],
                outputs: [
                    {
                        address: '15pnEDZJo3ycPUamqP3tEDnEju1oW5fBCz',
                        amount: '1934960',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['502e85']),
            },
            result: false,
            // possible since 2.3.5?
            // skip: ['1', '<2.3.5'],
            // result: {
            //     signatures: [
            //         '30440220390cfc34868254d1c241ef84af706bd387d3a7bbbc6049a7b99d70cc6f4e62ea022071a820ce96251df00e5a2b9ec2b4f41c813ad5beda3e5a02f605796f066e58c7',
            //         '3045022100aba0d278cf9cb86d24f415bbd16c8f2b3e44d8fb517522efe8c7ff45b28428e302206a788e77c2abd24573cc0b899f0c6b923b769f009afd54bb897d33ccafc3e7d3',
            //     ],
            //     serializedTx: '01000000022c06cf6f215c5cbfd7caa8e71b1b32630cabf1f816a4432815b037b277852e50000000006a4730440220390cfc34868254d1c241ef84af706bd387d3a7bbbc6049a7b99d70cc6f4e62ea022071a820ce96251df00e5a2b9ec2b4f41c813ad5beda3e5a02f605796f066e58c7412102183f94f532d059b1d9b1c13128c0e5153251b697d7d5613382b82e74c08d8514ffffffff2c06cf6f215c5cbfd7caa8e71b1b32630cabf1f816a4432815b037b277852e50010000006b483045022100aba0d278cf9cb86d24f415bbd16c8f2b3e44d8fb517522efe8c7ff45b28428e302206a788e77c2abd24573cc0b899f0c6b923b769f009afd54bb897d33ccafc3e7d3412102f33aeb90a28b991307a1cbad8dbc5da1cd064c2f6c90f9907ec4cef6015acdf3ffffffff0170861d00000000001976a91434e9cec317896e818619ab7dc99d2305216ff4af88ac00000000',
            // },
        },
    ],
};
