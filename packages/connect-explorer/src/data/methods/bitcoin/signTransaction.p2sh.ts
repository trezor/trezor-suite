import type { CoinSymbol } from '@trezor/connect-common';

import { select } from './common';

const name = 'signTransaction';

const btc = {
    inputs: [
        {
            address_n: [
                (49 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                0,
                0,
            ],
            prev_hash: 'a6e9698f9593f669ffe87adb6dd676984ed8519da277878e755982685be74b95',
            prev_index: 0,
            amount: '55306',
            script_type: 'SPENDP2SHWITNESS',
        },
    ],
    outputs: [
        {
            address: '31sEYnj6hftoAftGCacoy2ap7zCJdtzXp8',
            amount: '30000',
            script_type: 'PAYTOADDRESS',
        },
        {
            address_n: [
                (49 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                1,
                0,
            ],
            amount: '24306',
            script_type: 'PAYTOP2SHWITNESS',
        },
    ],
};

const ltc = {
    inputs: [
        {
            address_n: [
                (49 | 0x80000000) >>> 0,
                (2 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                0,
                28,
            ],
            prev_hash: 'ad34eb0d77a10cda278896b3a101bb9bd42317801cb191dd0773cabe5d4ce059',
            prev_index: 1,
            amount: '19964842',
            script_type: 'SPENDP2SHWITNESS',
        },
    ],
    outputs: [
        {
            address: 'MTVQuPyFvaZXF1oGVuFjNZWVPhHNicy2LT',
            amount: '1000000',
            script_type: 'PAYTOADDRESS',
        },
        {
            address_n: [
                (49 | 0x80000000) >>> 0,
                (2 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                1,
                0,
            ],
            amount: '18963842',
            script_type: 'PAYTOP2SHWITNESS',
        },
    ],
};

const examples: Partial<Record<CoinSymbol, { inputs: unknown[]; outputs: unknown[] }>> = {
    btc,
    ltc,
};

export default [
    {
        name,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'btc',
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
