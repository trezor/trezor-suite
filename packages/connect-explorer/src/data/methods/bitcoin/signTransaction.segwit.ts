import type { CoinSymbol } from '@trezor/connect-common';

import { select } from './common';

const name = 'signTransaction';

const test = {
    inputs: [
        {
            address_n: [
                (84 | 0x80000000) >>> 0,
                (1 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                0,
                0,
            ],
            amount: '1000000',
            prev_index: 1,
            prev_hash: 'bb0f9ece9adbca11c7e5a69351c8c4aa7548591f2c06defa690baaa110ad3f44',
            script_type: 'SPENDWITNESS',
        },
    ],
    outputs: [
        {
            address: 'tb1q9l0rk0gkgn73d0gc57qn3t3cwvucaj3h8wtrlu',
            amount: '500000',
            script_type: 'PAYTOADDRESS',
        },
        {
            address_n: [
                (84 | 0x80000000) >>> 0,
                (1 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                1,
                0,
            ],
            script_type: 'PAYTOWITNESS',
            amount: Number(1000000 - 11000 - 500000).toString(),
        },
    ],
};

const examples: Partial<Record<CoinSymbol, { inputs: unknown[]; outputs: unknown[] }>> = {
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
                affect: ['inputs', 'outputs'],
                data: select
                    .filter(c => c.affectedValue.includes('m/49'))
                    .filter(c => examples[c.value])
                    .map(v => {
                        const example = examples[v.value];

                        return {
                            ...v,
                            affectedValue: example ? [example.inputs, example.outputs] : undefined,
                        };
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
