import { select } from './common';

const name = 'signTransaction';

const test = {
    inputs: [
        {
            address_n: [
                (49 | 0x80000000) >>> 0,
                (1 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                1,
                0,
            ],
            amount: '999500',
            prev_index: 0,
            prev_hash: 'dcd403a9109821e07f928f46895c33c990f56a6d8ad9679b40f6d4f3532514c2',
            script_type: 'SPENDP2SHWITNESS',
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
                (49 | 0x80000000) >>> 0,
                (1 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                1,
                0,
            ],
            amount: '999320',
            script_type: 'PAYTOP2SHWITNESS',
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
                data: select.map(v => {
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
