/* eslint-disable no-bitwise */
import { select } from './common';

const name = 'signTransaction';
const docs = 'methods/signTransaction.md';

const btc = {
    inputs: [
        {
            address_n: [44 | 0x80000000, 0 | 0x80000000, 0 | 0x80000000, 0, 5],
            prev_hash: '50f6f1209ca92d7359564be803cb2c932cde7d370f7cee50fd1fad6790f6206d',
            prev_index: 1,
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
            address_n: [44 | 0x80000000, 145 | 0x80000000, 0 | 0x80000000, 0, 0],
            amount: '1995344',
            prev_hash: 'bc37c28dfb467d2ecb50261387bf752a3977d7e5337915071bb4151e6b711a78',
            prev_index: 0,
            script_type: 'SPENDADDRESS',
        },
    ],
    outputs: [
        {
            address_n: [44 | 0x80000000, 145 | 0x80000000, 0 | 0x80000000, 1, 0],
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
                (44 | 0x80000000) >>> 0,
                (1 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                1,
                0,
            ],
            amount: '123456789',
            prev_index: 0,
            prev_hash: '20912f98ea3ed849042efed0fdac8cb4fc301961c5988cba56902d8ffb61c337',
        },
    ],
    outputs: [
        {
            address: '1MJ2tj2ThBE62zXbBYA5ZaN3fdve5CPAz1',
            amount: '12300000',
            script_type: 'PAYTOADDRESS',
        },
        {
            address_n: [
                (49 | 0x80000000) >>> 0,
                (1 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                2,
                0,
            ],
            script_type: 'PAYTOADDRESS',
            amount: Number(123456789 - 11000 - 12300000).toString(),
        },
    ],
};

const dash = {
    inputs: [
        {
            address_n: [
                (44 | 0x80000000) >>> 0,
                (5 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                1,
                0,
            ],
            amount: '167280961',
            prev_index: 0,
            prev_hash: 'adb43bcd8fc99d6ed353c30ca8e5bd5996cd7bcf719bd4253f103dfb7227f6ed',
        },
    ],
    outputs: [
        {
            address: 'XkNPrBSJtrHZUvUqb3JF4g5rMB3uzaJfEL',
            amount: '167000000',
            script_type: 'PAYTOADDRESS',
        },
    ],
};

// version 3
const zcash = {
    inputs: [
        {
            address_n: [2147483692, 2147483781, 2147483648, 0, 2],
            prev_hash: '6df53ccdc6fa17e1cd248f7ec57e86178d6f96f2736bdf978602992b5850ac79',
            prev_index: 1,
            amount: '200000',
        },
    ],
    outputs: [
        {
            address: 't1N5zTV5PjJqRgSPmszHopk88Nc6mvMBSD7',
            amount: '100000',
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
                1,
                0,
            ],
            prev_index: 12,
            prev_hash: '0a4cb7d5c27455333701f0e53812e4be56a0272ad7f168279acfed7b065ee118',
        },
    ],
    outputs: [
        {
            address: 'D9vbBhmwXgRegm5kVAcx8j6H2GDM87D58T',
            amount: '1351855234633976',
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
            amount: '10000000000000000',
            script_type: 'PAYTOADDRESS',
        },
    ],
};

const examples = {
    btc,
    bch,
    test,
    dash,
    zcash,
    doge,
};

export default [
    {
        url: '/method/signTransaction-paytoaddress',
        name,
        docs,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'bch',
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
                label: 'Push transaction',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
            {
                name: 'chunkify',
                label: 'Display recipient address in chunks of 4 characters',
                type: 'checkbox',
                value: false,
            },
        ],
    },
];
