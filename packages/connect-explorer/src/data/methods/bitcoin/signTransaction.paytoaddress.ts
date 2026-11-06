import type { CoinSymbol } from '@trezor/connect-common';

import { select } from './common';

const name = 'signTransaction';

const btc = {
    inputs: [
        {
            address_n: [
                (44 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                0,
                5,
            ],
            prev_hash: '50f6f1209ca92d7359564be803cb2c932cde7d370f7cee50fd1fad6790f6206d',
            prev_index: 1,
            amount: '50000',
        },
    ],
    outputs: [
        {
            address: 'bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3',
            amount: '10000',
            script_type: 'PAYTOADDRESS',
        },
    ],
};

const bch = {
    inputs: [
        {
            address_n: [
                (44 | 0x80000000) >>> 0,
                (145 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                0,
                0,
            ],
            amount: '1995344',
            prev_hash: 'bc37c28dfb467d2ecb50261387bf752a3977d7e5337915071bb4151e6b711a78',
            prev_index: 0,
            script_type: 'SPENDADDRESS',
        },
    ],
    outputs: [
        {
            address_n: [
                (44 | 0x80000000) >>> 0,
                (145 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                1,
                0,
            ],
            amount: '1896050',
            script_type: 'PAYTOADDRESS',
        },
        {
            address: 'bitcoincash:qr23ajjfd9wd73l87j642puf8cad20lfmqdgwvpat4',
            amount: '73452',
            script_type: 'PAYTOADDRESS',
        },
    ],
};

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
            address: 'tb1qw9xp9ac9r224dj7847xn84ffh806hr7ax7d6pp',
            amount: '100000',
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
            amount: '899000',
            script_type: 'PAYTOWITNESS',
        },
    ],
};

const ltc = {
    inputs: [
        {
            address_n: [
                (84 | 0x80000000) >>> 0,
                (2 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                0,
                0,
            ],
            prev_hash: '52d7706c7283d1f3f335fb5662892072582d5ec83c10aed91028b111b84faebb',
            prev_index: 0,
            amount: '44060696',
            script_type: 'SPENDWITNESS',
        },
    ],
    outputs: [
        {
            address: 'ltc1qk45vxl7a4mhkduv2cdfsm3vfedewtzedxh82h0',
            amount: '1000000',
            script_type: 'PAYTOADDRESS',
        },
        {
            address_n: [
                (84 | 0x80000000) >>> 0,
                (2 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                1,
                0,
            ],
            amount: '43059696',
            script_type: 'PAYTOWITNESS',
        },
    ],
};

const zec = {
    inputs: [
        {
            address_n: [
                (44 | 0x80000000) >>> 0,
                (133 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                0,
                3,
            ],
            prev_hash: '0e544e2ef857d4ad5076946d221ceb764af5f0d5ec14a6072c223a13c27d1ba3',
            prev_index: 0,
            amount: '232096',
        },
    ],
    outputs: [
        {
            address: 't1a4gB4zwx5WCTzabBMTttFqLiBrDFeUfTC',
            amount: '222096',
            script_type: 'PAYTOADDRESS',
        },
    ],
};

const doge = {
    inputs: [
        {
            address_n: [
                (44 | 0x80000000) >>> 0,
                (3 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                0,
                2,
            ],
            prev_hash: '70b174184879f098c33e71bacd0eaa48a33831f9506fe672426bb39f7d226224',
            prev_index: 0,
            amount: '1000000000',
        },
    ],
    outputs: [
        {
            address: 'DJZza1gV4SCZpDn961H9TpBh4APfgFMxWz',
            amount: '500000000',
            script_type: 'PAYTOADDRESS',
        },
        {
            address_n: [
                (44 | 0x80000000) >>> 0,
                (3 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                1,
                0,
            ],
            amount: '499000000',
            script_type: 'PAYTOADDRESS',
        },
    ],
};

const examples: Partial<Record<CoinSymbol, { inputs: unknown[]; outputs: unknown[] }>> = {
    btc,
    bch,
    test,
    ltc,
    zec,
    doge,
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
                data: select.map(v => {
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
