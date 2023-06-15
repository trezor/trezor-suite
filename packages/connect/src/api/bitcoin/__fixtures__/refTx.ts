/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
import { networks } from '@trezor/utxo-lib';
// @ts-ignore
import tx43d273 from '../../../../e2e/__txcache__/testnet/43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06.json';
// @ts-ignore
import tx70f987 from '../../../../e2e/__txcache__/testnet/70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e.json';
// @ts-ignore
import txba917a from '../../../../e2e/__txcache__/testnet/ba917a2b563966e324ab37ed7de5f5cd7503b970b0f0bb9a5208f5835557e99c.json';

const tx70f987blockbook = {
    txid: '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
    details: {
        vin: [
            {
                addresses: ['tb1q9l0rk0gkgn73d0gc57qn3t3cwvucaj3h8wtrlu'],
                value: '20000000',
                txid: '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06',
                vout: 1,
            },
        ],
        vout: [
            {
                isAddress: true,
                addresses: ['tb1qkvwu9g3k2pdxewfqr7syz89r3gj557l3uuf9r9'],
            },
            {
                isAddress: true,
                addresses: ['tb1qze76uzqteg6un6jfcryrxhwvfvjj58ts0swg3d'],
            },
        ],
    },
    hex: '0100000000010106fcd13aab9f1eb618d0351196ecf20ff8fb60f9743484ad5917f4cad373d2430100000000fdffffff02a086010000000000160014b31dc2a236505a6cb9201fa0411ca38a254a7bf1d3a52f0100000000160014167dae080bca35c9ea49c0c8335dcc4b252a1d700247304402207da4ce78bf9175ad4764794013360be569d3902861a54922aad6239659422f86022050145fc897a806b4ef06777a58471d39e9a10482cd8e61819ee18d6d22eaa6be01210357cb3a5918d15d224f14a89f0eb54478272108f6cbb9c473c1565e55260f6e9369941400',
};

const ADDRESSES = {
    used: [
        {
            path: "m/84'/1'/0'/0/0",
            address: 'tb1q9l0rk0gkgn73d0gc57qn3t3cwvucaj3h8wtrlu',
        },
    ],
    unused: [],
    change: [
        {
            path: "m/84'/1'/0'/1/0",
            address: 'tb1qze76uzqteg6un6jfcryrxhwvfvjj58ts0swg3d',
        },
    ],
};

export const validateReferencedTransactions = [
    {
        description:
            'OrigTransaction and RefTransaction in protobuf format (strict fields validation)',
        params: {
            transactions: [
                {
                    hash: '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                    ...tx70f987,
                    // TODO
                },
                {
                    hash: '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06',
                    ...tx43d273,
                    inputs: [{ ...tx43d273.inputs[0], someExtraField: 'should-be-ignored' }],
                    bin_outputs: tx43d273.bin_outputs.slice(0, 2).concat({
                        ...tx43d273.bin_outputs[2],
                        // @ts-expect-error
                        someExtraField: 'should-be-ignored',
                    }),
                },
            ],
            inputs: [
                {
                    prev_hash: '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06',
                    prev_index: 1,
                    orig_hash: '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                    orig_index: 0,
                },
            ],
            outputs: [], // irrelevant
            addresses: {}, // irrelevant
            coinInfo: { network: networks.testnet },
        },
        result: [
            {
                hash: '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                ...tx70f987,
            },
            {
                hash: '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06',
                ...tx43d273,
            },
        ],
    },
    {
        description: 'transform AccountTransaction to RefTransaction',
        params: {
            transactions: [tx70f987blockbook],
            inputs: [
                {
                    prev_hash: '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                    prev_index: 1,
                },
            ],
            addresses: ADDRESSES,
            outputs: [], // irrelevant
            coinInfo: { network: networks.testnet },
        },
        result: [
            {
                hash: '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                version: 1,
                lock_time: 1348713,
                inputs: [
                    {
                        sequence: 4294967293,
                        prev_hash:
                            '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06',
                        prev_index: 1,
                        script_sig: '',
                    },
                ],
                bin_outputs: [
                    {
                        amount: '100000',
                        script_pubkey: '0014b31dc2a236505a6cb9201fa0411ca38a254a7bf1',
                    },
                    {
                        amount: '19899859',
                        script_pubkey: '0014167dae080bca35c9ea49c0c8335dcc4b252a1d70',
                    },
                ],
            },
        ],
    },
    {
        description: 'transform AccountTransaction to OrigTransaction',
        params: {
            transactions: [tx70f987blockbook],
            inputs: [
                {
                    script_type: 'SPENDTAPROOT', // 43d273 is not required because of the script_type
                    prev_hash: '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06',
                    prev_index: 1,
                    orig_hash: '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                    orig_index: 0,
                    address_n: [2147483734, 2147483649, 2147483648, 0, 0],
                    amount: '20000000',
                },
            ],
            addresses: {
                used: [
                    {
                        path: "m/86'/1'/0'/0/0",
                        address: 'tb1q9l0rk0gkgn73d0gc57qn3t3cwvucaj3h8wtrlu',
                    },
                ],
                unused: [],
                change: [
                    {
                        path: "m/86'/1'/0'/1/0",
                        address: 'tb1qze76uzqteg6un6jfcryrxhwvfvjj58ts0swg3d',
                    },
                ],
            },
            outputs: [], // irrelevant
            coinInfo: { network: networks.testnet },
        },
        result: [
            {
                hash: '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                version: 1,
                lock_time: 1348713,
                inputs: [
                    {
                        address_n: [2147483734, 2147483649, 2147483648, 0, 0],
                        script_type: 'SPENDTAPROOT',
                        sequence: 4294967293,
                        amount: '20000000',
                        prev_hash:
                            '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06',
                        prev_index: 1,
                        witness:
                            '0247304402207da4ce78bf9175ad4764794013360be569d3902861a54922aad6239659422f86022050145fc897a806b4ef06777a58471d39e9a10482cd8e61819ee18d6d22eaa6be01210357cb3a5918d15d224f14a89f0eb54478272108f6cbb9c473c1565e55260f6e93',
                        script_sig: '',
                    },
                ],
                outputs: [
                    {
                        address: 'tb1qkvwu9g3k2pdxewfqr7syz89r3gj557l3uuf9r9',
                        amount: '100000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: [2147483734, 2147483649, 2147483648, 1, 0],
                        amount: '19899859',
                        script_type: 'PAYTOTAPROOT',
                    },
                ],
            },
        ],
    },
    {
        description: 'transform AccountTransaction with opreturn output to OrigTransaction',
        params: {
            transactions: [
                // see https://tbtc1.trezor.io/tx/ba917a2b563966e324ab37ed7de5f5cd7503b970b0f0bb9a5208f5835557e99c
                {
                    txid: 'ba917a2b563966e324ab37ed7de5f5cd7503b970b0f0bb9a5208f5835557e99c',
                    details: {
                        vin: [
                            {
                                addresses: ['tb1qcm66dfrtjnpg7vte7pwnt45jvct4jmckszw2nl'],
                                value: '1000000',
                            },
                        ],
                        vout: [
                            {
                                isAddress: false,
                                addresses: ['dead'],
                            },
                            {
                                isAddress: true,
                                addresses: ['tb1qrspwywt63gp07uwn7f5n0522v4jxnhglre009k'],
                            },
                        ],
                    },
                    hex: '010000000001010978ca90092d490a773ca00de50bc5c4d9930fab03b656f5525cf099379783400100000000fdffffff020000000000000000066a0464656164aa410f00000000001600141c02e2397a8a02ff71d3f26937d14a656469dd1f024730440220245e21b27caa065940d5ea4b539926598ad0af4f47f8135a41d85708b7c0df42022050f7108edc8ff3d5ebf8a621e5127133caa302af2d050b7037bdc1a486861557012102a269d4b8faf008074b974b6d64fa1776e17fdf65381a76d1338e9bba88983a8700000000',
                },
            ],
            inputs: [
                {
                    script_type: 'SPENDTAPROOT', // 408397 is not required because of the script_type
                    prev_hash: '4083973799f05c52f556b603ab0f93d9c4c50be50da03c770a492d0990ca7809',
                    prev_index: 1,
                    orig_hash: 'ba917a2b563966e324ab37ed7de5f5cd7503b970b0f0bb9a5208f5835557e99c',
                    orig_index: 0,
                    address_n: [2147483732, 2147483649, 2147483649, 0, 14],
                    amount: '1000000',
                },
            ],
            addresses: {
                ...ADDRESSES,
                used: [
                    {
                        path: "m/84'/1'/1'/0/14",
                        address: 'tb1qcm66dfrtjnpg7vte7pwnt45jvct4jmckszw2nl',
                    },
                ],
                change: [
                    {
                        path: "m/84'/1'/1'/1/10",
                        address: 'tb1qrspwywt63gp07uwn7f5n0522v4jxnhglre009k',
                    },
                ],
            },
            outputs: [], // irrelevant
            coinInfo: { network: networks.testnet },
        },
        result: [
            {
                ...txba917a,
                hash: 'ba917a2b563966e324ab37ed7de5f5cd7503b970b0f0bb9a5208f5835557e99c',
                inputs: [
                    {
                        ...txba917a.inputs[0],
                        amount: '1000000',
                    },
                ],
                outputs: [
                    {
                        ...txba917a.outputs[0],
                        amount: '0',
                    },
                    {
                        ...txba917a.outputs[1],
                        amount: '999850',
                    },
                ],
            },
        ],
    },
    {
        description: 'throws on missing 43d273 tx data',
        params: {
            transactions: [
                {
                    hash: '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                    ...tx70f987,
                },
            ],
            inputs: [
                {
                    prev_hash: '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06',
                    prev_index: 1,
                    orig_hash: '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                    orig_index: 0,
                },
            ],
            outputs: [], // irrelevant
            coinInfo: { network: networks.testnet },
        },
        error: '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06 not provided',
    },
    {
        description: 'AccountTransaction to OrigTransaction throws missing inputs data',
        params: {
            transactions: [
                {
                    ...tx70f987blockbook,
                    details: {
                        ...tx70f987blockbook.details,
                        vin: [],
                    },
                },
            ],
            inputs: [
                {
                    amount: '20000000',
                    script_type: 'SPENDWITNESS',
                    prev_hash: '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06',
                    prev_index: 1,
                    orig_hash: '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                    orig_index: 0,
                },
            ],
            addresses: ADDRESSES,
            outputs: [], // irrelevant
            coinInfo: { network: networks.testnet },
        },
        error: 'invalid input at 70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e [0]',
    },
    {
        description: 'AccountTransaction to OrigTransaction throws missing hex',
        params: {
            transactions: [
                {
                    ...tx70f987blockbook,
                    hex: '',
                },
            ],
            inputs: [
                {
                    prev_hash: '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06',
                    prev_index: 1,
                    orig_hash: '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                    orig_index: 0,
                },
            ],
            outputs: [], // irrelevant
            addresses: {}, // irrelevant
            coinInfo: { network: networks.testnet },
        },
        error: 'hex for 70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e not provided',
    },
    {
        description: 'AccountTransaction to RefTransaction throws missing hex',
        params: {
            transactions: [
                {
                    ...tx70f987blockbook,
                    hex: '',
                },
            ],
            inputs: [
                {
                    prev_hash: '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                    prev_index: 1,
                },
            ],
            outputs: [], // irrelevant
            addresses: {}, // irrelevant
            coinInfo: { network: networks.testnet },
        },
        error: 'hex for 70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e not provided',
    },
    {
        description: 'AccountTransaction to OrigTransaction throws on missing addresses',
        params: {
            transactions: [tx70f987blockbook],
            inputs: [
                {
                    prev_hash: '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06',
                    prev_index: 1,
                    orig_hash: '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                    orig_index: 0,
                },
            ],
            addresses: undefined,
            outputs: [], // irrelevant
            coinInfo: { network: networks.testnet },
        },
        error: 'addresses for 70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e not provided',
    },
    {
        description: 'coverage: empty refTxs',
        params: {
            transactions: [],
            inputs: [], // irrelevant
            outputs: [], // irrelevant
            coinInfo: { network: networks.testnet },
        },
        result: undefined,
    },
    {
        description: 'coverage: refTxs not an array',
        params: {
            transactions: {},
            inputs: [], // irrelevant
            outputs: [], // irrelevant
            coinInfo: { network: networks.testnet },
        },
        result: undefined,
    },
];
