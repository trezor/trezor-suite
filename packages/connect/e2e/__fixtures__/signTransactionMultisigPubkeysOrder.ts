import { MultisigPubkeysOrder } from '@trezor/protobuf/src/messages';

const { TX_CACHE } = global.TestUtils;

// fixtures: https://github.com/trezor/trezor-firmware/blob/main/tests/device_tests/test_multisig.py
const PUBKEYS_2_OF_3 = [
    {
        // xpub: m/48'/1'/1'/0'
        node: 'tpubDF4tYm8PaDydbLMZZRqcquYZ6AvxFmyTv6RhSokPh6YxccaCxP1gF2VABKV9wsinAdUbsbdLx1vcXdJH8qRcQMM9VYd926rWM685CepPUdN',
        address_n: [0, 0],
    },
    {
        // xpub: m/48'/1'/2'/0'
        node: 'tpubDEhpbishBroZWzT7sQf9YuXiyCUSdkK6Cur95UkDdTRcyrJUhLtn69GhC8mJwrxmXRLSUitWAgsXcQ3Cb16EaqFyMob4LHPqzohSzyMMmP5',
        address_n: [0, 0],
    },
    {
        // xpub: m/48'/1'/3'/0'
        node: 'tpubDFLKt47Wb4BomPVBFW675DKNuhbd9hkx7s1wr2C8GMgQM5Sa5susNc78xKWsjkrkkCQsMT4o7m5RD8ZJqTgh9cjwEQg8pjCxr9Ar77C2wiv',
        address_n: [0, 0],
    },
];

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'Testnet (multisig): 2 of 3 (unorderd)',
            params: {
                coin: 'testnet',
                inputs: [
                    {
                        address_n: "m/48'/1'/1'/0'/0/0",
                        prev_hash:
                            '6b07c1321b52d9c85743f9695e13eb431b41708cdf4e1585258d51208e5b93fc',
                        prev_index: 0,
                        amount: 1496278,
                        script_type: 'SPENDMULTISIG',
                        multisig: {
                            pubkeys: PUBKEYS_2_OF_3,
                            signatures: ['', '', ''],
                            m: 2,
                            pubkeys_order: MultisigPubkeysOrder.PRESERVED,
                        },
                    },
                ],
                outputs: [
                    {
                        address: 'mnY26FLTzfC94mDoUcyDJh1GVE3LuAUMbs',
                        amount: 1496278 - 10000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['6b07c1']),
            },
            result: {
                signatures: [
                    '304402206c99b48a12f340599076b93efdc2578b0cdeaedf9092aed628788f4ffc579a50022031b16212dd1f0f62f01bb5862b6d128276c7a5430746aa27a04ae0c8acbcb3b1',
                ],
            },
        },
        {
            description: 'Testnet (multisig): 2 of 3 (fail when ordered gives wrong key))',
            params: {
                coin: 'testnet',
                inputs: [
                    {
                        address_n: "m/48'/1'/1'/0'/0/0",
                        prev_hash:
                            '6b07c1321b52d9c85743f9695e13eb431b41708cdf4e1585258d51208e5b93fc',
                        prev_index: 0,
                        amount: 1496278,
                        script_type: 'SPENDMULTISIG',
                        multisig: {
                            pubkeys: PUBKEYS_2_OF_3,
                            signatures: ['', '', ''],
                            m: 2,
                            pubkeys_order: MultisigPubkeysOrder.LEXICOGRAPHIC,
                        },
                    },
                ],
                outputs: [
                    {
                        address: 'mnY26FLTzfC94mDoUcyDJh1GVE3LuAUMbs',
                        amount: 1496278 - 10000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['6b07c1']),
            },
            result: false,
            legacyResults: [
                // https://github.com/trezor/trezor-firmware/pull/4351
                {
                    rules: ['<2.8.7'],
                    payload: {
                        signatures: [
                            '304402206c99b48a12f340599076b93efdc2578b0cdeaedf9092aed628788f4ffc579a50022031b16212dd1f0f62f01bb5862b6d128276c7a5430746aa27a04ae0c8acbcb3b1',
                        ],
                    },
                },
            ],
        },
    ],
};
