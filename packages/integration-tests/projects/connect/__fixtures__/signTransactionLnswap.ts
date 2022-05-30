const { ADDRESS_N, TX_CACHE } = global.TestUtils;

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'Bitcoin (PAYTOLNSWAP): 1 input, 1 output, no change',
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
                        address: '3NtRY64WfQk2vZy8GUhwQzzMmyY9ZhNEVi',
                        amount: '60000',
                        script_type: 'PAYTOLNSWAP',
                        lnswap: {
                            invoice:
                                'lnbc538340n1p3q7l23pp57vysk3kakcfynz09du0zy87zy7n4gc6czqettc7c5v9v2fsrs9nqdpa2pskjepqw3hjq3r0deshgefqw3hjqjzjgcs8vv3qyq5y7unyv4ezqj2y8gszjxqy9ghlcqpjsp50lm6njtrm9qlyaac8252x4s4l3eu0aryx7zjjw4zrq6hgpk2evwqrzjqtesdx359t3gswn09838tur09zjk5m4zutvk7kyg5vnxg3xu74ptvzhchqqq3kgqqyqqqqqqqqqqqqgq9q9qyyssqlg84727az93gg8n37gv994w3r6dj0u8dk55qjlstappyuehq3mqjcafkyj2a39xp0w34mnzy04hzqnct7fecd380wfa0kc0en8v006sqxqchh5',
                            htlc: '02528a57b9b55e86f08562b2e49fe52649924600f865e14a41defac5cdc8d4a3ea',
                            cltv: 725891,
                            // bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk
                            swap_script_type: 'SPENDP2SHWITNESS',
                            refund_address_n: ADDRESS_N("m/84'/0'/0'/0/0"),
                            refund_script_type: 'SPENDWITNESS',
                        },
                    },
                ],
                refTxs: TX_CACHE(['0dac36']),
                coin: 'btc',
            },
            result: {
                serializedTx:
                    '0100000001b5f59e2273c85b93aa9deff9bba5d7deace78610d3b0fb892a7ba6d86f36ac0d000000006b483045022100b67aeab2efbd533606b6b808d7a990ca04ec73f84947d086ef954f36bb16425e02201578ce2f893f8c63812fc8438165044d68c4a2abca40f2f4e7ecd36f739bedf6012103d7f3a07085bee09697cf03125d5c8760dfed65403dba787f1d1d8b1251af2cbeffffffff0160ea00000000000017a914e882ed93fcb8ba83b088a04ff4180035671ef39d8700000000',
            },
        },
    ],
};
