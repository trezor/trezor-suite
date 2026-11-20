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
            prev_hash: 'bb0f9ece9adbca11c7e5a69351c8c4aa7548591f2c06defa690baaa110ad3f44',
            prev_index: 1,
            amount: '1000000',
            script_type: 'SPENDWITNESS',
        },
    ],
    outputs: [
        {
            op_return_data: 'deadbeef',
            amount: '0',
            script_type: 'PAYTOOPRETURN',
        },
        {
            address_n: [
                (84 | 0x80000000) >>> 0,
                (1 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                1,
                0,
            ],
            amount: '999000',
            script_type: 'PAYTOWITNESS',
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
                data: select.flatMap(v => {
                    const example = examples[v.value];

                    return example
                        ? [{ ...v, affectedValue: [example.inputs, example.outputs] }]
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
