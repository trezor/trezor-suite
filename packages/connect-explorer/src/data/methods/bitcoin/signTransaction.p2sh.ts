import { select } from './common';

const name = 'signTransaction';

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

const examples = {
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
                    .filter(c => c.affectedValue.indexOf('m/49') >= 0)
                    .map(v => {
                        const example = examples[v.value as keyof typeof examples];

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
