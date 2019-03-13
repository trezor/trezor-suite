/* @flow */

import { select } from './common';

const name = 'signTransaction';
const docs = 'methods/signTransaction.md';

const test = {
    inputs: `[
    {
        address_n: [(44 | 0x80000000) >>> 0, (1 | 0x80000000) >>> 0, (0 | 0x80000000) >>> 0, 1, 0],
        amount: "123456789",
        prev_index: 0,
        prev_hash: "20912f98ea3ed849042efed0fdac8cb4fc301961c5988cba56902d8ffb61c337",
    }
]`,
    outputs: `[
    {
        address: "1MJ2tj2ThBE62zXbBYA5ZaN3fdve5CPAz1",
        amount: "12300000",
        script_type: "PAYTOADDRESS"
    },
    {
        address_n: [(49 | 0x80000000) >>> 0, (1 | 0x80000000) >>> 0, (0 | 0x80000000) >>> 0, 2, 0],
        script_type: "PAYTOADDRESS",
        amount: Number(123456789 - 11000 - 12300000).toString(),
    }
]`
};

const dash = {
    inputs: `[
        {
            address_n: [(44 | 0x80000000) >>> 0, (5 | 0x80000000) >>> 0, (0 | 0x80000000) >>> 0, 1, 0],
            amount: "167280961",
            prev_index: 0,
            prev_hash: "adb43bcd8fc99d6ed353c30ca8e5bd5996cd7bcf719bd4253f103dfb7227f6ed",
        }
]`,
    outputs: `[
    {
        address: "XkNPrBSJtrHZUvUqb3JF4g5rMB3uzaJfEL",
        amount: "167000000",
        script_type: "PAYTOADDRESS"
    },
]`
}


// const zcash = {
//     inputs: `[
//         {
//             address_n: [(44 | 0x80000000) >>> 0, (133 | 0x80000000) >>> 0, (0 | 0x80000000) >>> 0, 0, 0],
//             prev_index: 0,
//             prev_hash: "29d25589db4623d1a33c58745b8f95b131f49841c79dcd171847d0d7e9e2dc3a",
//         }
// ]`,
//     outputs: `[
//     {
//         address: "t1N5zTV5PjJqRgSPmszHopk88Nc6mvMBSD7",
//         amount: "72200",
//         script_type: "PAYTOADDRESS"
//     },
// ]`
// }

const zcash1 = {
    inputs: `[
        {
            address_n: [(44 | 0x80000000) >>> 0, (133 | 0x80000000) >>> 0, (0 | 0x80000000) >>> 0, 0, 2],
            prev_hash: '84533aa6244bcee68040d851dc4f502838ed3fd9ce838e2e48dbf440e7f4df2a',
            prev_index: 0,
        },
        {
            address_n: [(44 | 0x80000000) >>> 0, (133 | 0x80000000) >>> 0, (0 | 0x80000000) >>> 0, 1, 0],
            prev_hash: '84533aa6244bcee68040d851dc4f502838ed3fd9ce838e2e48dbf440e7f4df2a',
            prev_index: 1,
        },
]`,
    outputs: `[
        {
            address: 't1Xin4H451oBDwrKcQeY1VGgMWivLs2hhuR',
            amount: '10212',
            script_type: 'PAYTOADDRESS',
        },
]`
}

// version 3
const zcash = {
    inputs: `[
        {
            address_n: [2147483692, 2147483781, 2147483648, 0, 2],
            prev_hash: '6df53ccdc6fa17e1cd248f7ec57e86178d6f96f2736bdf978602992b5850ac79',
            prev_index: 1,
            amount: '200000'
        },

    ]`,
    outputs: `[
        {
            address: 't1N5zTV5PjJqRgSPmszHopk88Nc6mvMBSD7',
            amount: '100000',
            script_type: 'PAYTOADDRESS',
        },
    ]`,
}

const zcash4 = {
    inputs: `[
        {
            address_n: [2147483692, 2147483781, 2147483648, 0, 2],
            prev_hash: '4264f5f339c9fd498976dabb6d7b8819e112d25a0c1770a0f3ee81de525de8f8',
            amount: '118540',
            prev_index: 0,
        },
    ]`,
    outputs: `[
        {
            address: 't1fT6Zv1LcPwSwausNAuYGdewv2Mke3nrYo',
            amount: '926751',
            script_type: 'PAYTOADDRESS',
        },
    ]`,
}

const examples = {
    test,
    dash,
    zcash,
}

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
                value: 'dash',
                affect: ['inputs', 'outputs'],
                data: select.map(v => {
                    const example = examples[v.value];
                    return {
                        ...v,
                        affectedValue: example ? [example.inputs, example.outputs] : undefined,
                    }
                })
            },
            {
                name: 'inputs',
                type: 'json',
                value: ''
            },
            {
                name: 'outputs',
                type: 'json',
                value: ''
            },
            {
                name: 'push',
                label: 'Push transaction',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
        ]
    },
]