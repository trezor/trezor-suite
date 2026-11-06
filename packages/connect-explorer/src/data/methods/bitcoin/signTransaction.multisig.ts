import type { CoinSymbol } from '@trezor/connect-common';

import { select } from './common';

const name = 'signTransaction';

// Account keys m/48'/1'/1'/0', m/48'/1'/2'/0' and m/48'/1'/3'/0' of a 2-of-3 multisig.
const pubkeys = [
    {
        node: 'tpubDF4tYm8PaDydbLMZZRqcquYZ6AvxFmyTv6RhSokPh6YxccaCxP1gF2VABKV9wsinAdUbsbdLx1vcXdJH8qRcQMM9VYd926rWM685CepPUdN',
        address_n: [0, 0],
    },
    {
        node: 'tpubDEhpbishBroZWzT7sQf9YuXiyCUSdkK6Cur95UkDdTRcyrJUhLtn69GhC8mJwrxmXRLSUitWAgsXcQ3Cb16EaqFyMob4LHPqzohSzyMMmP5',
        address_n: [0, 0],
    },
    {
        node: 'tpubDFLKt47Wb4BomPVBFW675DKNuhbd9hkx7s1wr2C8GMgQM5Sa5susNc78xKWsjkrkkCQsMT4o7m5RD8ZJqTgh9cjwEQg8pjCxr9Ar77C2wiv',
        address_n: [0, 0],
    },
];

const test = {
    inputs: [
        {
            address_n: [
                (48 | 0x80000000) >>> 0,
                (1 | 0x80000000) >>> 0,
                (1 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                0,
                0,
            ],
            prev_hash: '6b07c1321b52d9c85743f9695e13eb431b41708cdf4e1585258d51208e5b93fc',
            prev_index: 0,
            amount: '1496278',
            script_type: 'SPENDMULTISIG',
            multisig: {
                m: 2,
                pubkeys,
                signatures: ['', '', ''],
            },
        },
    ],
    outputs: [
        {
            address: 'mnY26FLTzfC94mDoUcyDJh1GVE3LuAUMbs',
            amount: '1486278',
            script_type: 'PAYTOADDRESS',
        },
    ],
    // The referenced transaction is from the retired testnet3, so it can't be fetched from the backend.
    refTxs: [
        {
            hash: '6b07c1321b52d9c85743f9695e13eb431b41708cdf4e1585258d51208e5b93fc',
            version: 1,
            lock_time: 0,
            inputs: [
                {
                    prev_hash: '95cff04e6b19210c5fb14e7c7c089a94fdef7e657dc93109658065841a69dd38',
                    prev_index: 0,
                    script_sig:
                        '473044022065bc4c95419d402add2ecf18c2a3381c9c3179e656836e80be375c099afda39102205e4d8ae6b99e3a319d5909a8c6ee9085a3f087e32959b73560b934c56559c37101210344e14b3da8f5fe77a5465d0f8fe089d64ed5517d1f1f989edd00f530938a2c22',
                    sequence: 4294967295,
                },
            ],
            bin_outputs: [
                {
                    amount: 1496278,
                    script_pubkey: 'a914b8f771de8bbdcfee76e0dbf76f1005f2028bf3e787',
                },
            ],
        },
    ],
};

const examples: Partial<
    Record<CoinSymbol, { inputs: unknown[]; outputs: unknown[]; refTxs: unknown[] }>
> = {
    test,
};

export default [
    {
        name,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'test',
                affect: ['inputs', 'outputs', 'refTxs'],
                data: select.flatMap(v => {
                    const example = examples[v.value];

                    return example
                        ? [
                              {
                                  ...v,
                                  affectedValue: [example.inputs, example.outputs, example.refTxs],
                              },
                          ]
                        : [];
                }),
            },
            {
                name: 'inputs',
                type: 'json',
                value: '',
            },
            {
                name: 'outputs',
                type: 'json',
                value: '',
            },
            {
                name: 'refTxs',
                type: 'json',
                value: '',
            },
            {
                name: 'push',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
            {
                name: 'chunkify',
                type: 'checkbox',
                value: false,
            },
        ],
    },
];
