const { ADDRESS_N, TX_CACHE } = global.TestUtils;

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_12',
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
                    '3045022100ecaa81efe52d31cb0b9cf49a3a5ef4e4b3c6c6d4379deaa0be7c1d80fa65b44d022035ed7ca3a05d91ec554baab6f0bb2950ca8570887bb2a7252c1cb2e2e523aa10',
                ],
                serializedTx:
                    '0100000001781a716b1e15b41b07157933e5d777392a75bf87132650cb2e7d46fb8dc237bc000000006b483045022100ecaa81efe52d31cb0b9cf49a3a5ef4e4b3c6c6d4379deaa0be7c1d80fa65b44d022035ed7ca3a05d91ec554baab6f0bb2950ca8570887bb2a7252c1cb2e2e523aa1041210322228eeb50bf798b7020df33447086fcb670d4c5bc1b87ba92ac0c86280a7257ffffffff0272ee1c00000000001976a914ae5be3cc383aa6a0d42849fbf4770bd41817430f88acec1e0100000000001976a914d51eca49695cdf47e7f4b55507893e3ad53fe9d888ac00000000',
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
                    '30440220390cfc34868254d1c241ef84af706bd387d3a7bbbc6049a7b99d70cc6f4e62ea022071a820ce96251df00e5a2b9ec2b4f41c813ad5beda3e5a02f605796f066e58c7',
                    '3045022100aba0d278cf9cb86d24f415bbd16c8f2b3e44d8fb517522efe8c7ff45b28428e302206a788e77c2abd24573cc0b899f0c6b923b769f009afd54bb897d33ccafc3e7d3',
                ],
                serializedTx:
                    '01000000022c06cf6f215c5cbfd7caa8e71b1b32630cabf1f816a4432815b037b277852e50000000006a4730440220390cfc34868254d1c241ef84af706bd387d3a7bbbc6049a7b99d70cc6f4e62ea022071a820ce96251df00e5a2b9ec2b4f41c813ad5beda3e5a02f605796f066e58c7412102183f94f532d059b1d9b1c13128c0e5153251b697d7d5613382b82e74c08d8514ffffffff2c06cf6f215c5cbfd7caa8e71b1b32630cabf1f816a4432815b037b277852e50010000006b483045022100aba0d278cf9cb86d24f415bbd16c8f2b3e44d8fb517522efe8c7ff45b28428e302206a788e77c2abd24573cc0b899f0c6b923b769f009afd54bb897d33ccafc3e7d3412102f33aeb90a28b991307a1cbad8dbc5da1cd064c2f6c90f9907ec4cef6015acdf3ffffffff0170861d00000000001976a91434e9cec317896e818619ab7dc99d2305216ff4af88ac00000000',
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
