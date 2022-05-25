export default [
    {
        description: '1 output, no change',
        feeRate: 10,
        inputs: ['102001'],
        outputs: ['100000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '102001',
                },
            ],
            outputs: [
                {
                    value: '100000',
                },
            ],
            fee: 2001,
        },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: '1 output, no change, value > 2^32',
        feeRate: 10,
        inputs: ['5000002001'],
        outputs: ['5000000000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '5000002001',
                },
            ],
            outputs: [
                {
                    value: '5000000000',
                },
            ],
            fee: 2001,
        },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: '1 output, no change, value > Number.MAX_SAFE_INTEGER (DOGE)',
        feeRate: 10,
        inputs: ['9007199254742000'],
        outputs: ['9007199254740000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '9007199254742000',
                },
            ],
            outputs: [
                {
                    value: '9007199254740000',
                },
            ],
            fee: 2000,
        },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: '1 output, change rejected, value > 2^32',
        feeRate: 5,
        inputs: ['5000000000'],
        outputs: ['1'],
        expected: { fee: 0 },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: '1 output, only possibility with change, rejects',
        feeRate: 5,
        inputs: ['106001'],
        outputs: ['100000'],
        expected: { fee: 0 },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: '1 output, sub-optimal inputs (if re-ordered), direct possible',
        feeRate: 10,
        inputs: ['10000', '40000', '40000'],
        outputs: ['7700'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '10000',
                },
            ],
            outputs: [
                {
                    value: '7700',
                },
            ],
            fee: 2300,
        },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description:
            '1 output, sub-optimal inputs (if re-ordered), direct possible, but slightly higher fee, rejecte',
        feeRate: 10,
        inputs: ['10000', '40000', '40000'],
        outputs: ['6800'],
        expected: { fee: 0 },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: '1 output, passes, skipped detrimental input',
        feeRate: 5,
        inputs: [
            {
                script: {
                    length: 1000,
                },
                value: '3000',
            },
            {
                value: '3000',
            },
            {
                value: '3000',
            },
        ],
        outputs: ['4000'],
        expected: {
            fee: 2000,
            inputs: [
                {
                    i: 1,
                    value: '3000',
                },
                {
                    i: 2,
                    value: '3000',
                },
            ],
            outputs: [
                {
                    value: '4000',
                },
            ],
        },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: '1 output, fails, skips (and finishes on) detrimental input',
        feeRate: 55,
        inputs: [
            {
                value: '44000',
            },
            {
                value: '800',
            },
        ],
        outputs: ['38000'],
        expected: { fee: 0 },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: '1 output, passes, good match despite bad ordering',
        feeRate: 5,
        inputs: [
            {
                script: {
                    length: 500,
                },
                value: '3000',
            },
            {
                value: '3000',
            },
            {
                value: '3000',
            },
        ],
        outputs: ['4000'],
        expected: {
            inputs: [
                {
                    i: 1,
                    value: '3000',
                },
                {
                    i: 2,
                    value: '3000',
                },
            ],
            outputs: [
                {
                    value: '4000',
                },
            ],
            fee: 2000,
        },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: '1 output, optimal inputs, no change',
        feeRate: 10,
        inputs: ['10000'],
        outputs: ['7700'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '10000',
                },
            ],
            outputs: [
                {
                    value: '7700',
                },
            ],
            fee: 2300,
        },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: '1 output, no fee, no match',
        feeRate: 0,
        inputs: ['5000', '5000', '5000', '5000', '5000', '5000'],
        outputs: ['28000'],
        expected: { fee: 0 },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: '1 output, 2 inputs (related), no change',
        feeRate: 10,
        inputs: [
            {
                address: 'a',
                value: '100000',
            },
            {
                address: 'a',
                value: '2000',
            },
        ],
        outputs: ['98000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    address: 'a',
                    value: '100000',
                },
            ],
            outputs: [
                {
                    value: '98000',
                },
            ],
            fee: 2000,
        },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: 'many outputs, no change',
        feeRate: 10,
        inputs: ['30000', '12220', '10001'],
        outputs: ['35000', '5000', '5000', '1000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '30000',
                },
                {
                    i: 1,
                    value: '12220',
                },
                {
                    i: 2,
                    value: '10001',
                },
            ],
            outputs: [
                {
                    value: '35000',
                },
                {
                    value: '5000',
                },
                {
                    value: '5000',
                },
                {
                    value: '1000',
                },
            ],
            fee: 6221,
        },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: 'many outputs, no match',
        feeRate: 10,
        inputs: ['30000', '14220', '10001'],
        outputs: ['35000', '5000', '5000', '1000'],
        expected: { fee: 0 },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: 'many outputs, no match',
        feeRate: 0,
        inputs: ['5000', '5000', '5000', '5000', '5000', '5000'],
        outputs: ['28000', '1000'],
        expected: { fee: 0 },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: 'no outputs, no change',
        feeRate: 10,
        inputs: ['1900'],
        outputs: [],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '1900',
                },
            ],
            outputs: [],
            fee: 1900,
        },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: 'no outputs, no match',
        feeRate: 10,
        inputs: ['20000'],
        outputs: [],
        expected: { fee: 0 },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: 'not enough funds, empty result',
        feeRate: 10,
        inputs: ['20000'],
        outputs: ['40000'],
        expected: { fee: 0 },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: 'not enough funds (w/ fee), empty result',
        feeRate: 10,
        inputs: ['40000'],
        outputs: ['40000'],
        expected: { fee: 0 },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: 'not enough funds (no inputs), empty result',
        feeRate: 10,
        inputs: [],
        outputs: [],
        expected: { fee: 0 },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: 'not enough funds (no inputs), empty result (>1KiB)',
        feeRate: 10,
        inputs: [],
        outputs: [
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
            '1',
        ],
        expected: { fee: 0 },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: '2 outputs, some with missing value (NaN)',
        feeRate: 10,
        inputs: ['20000'],
        outputs: ['1000', {}],
        expected: { fee: 0 },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: 'input with float values (NaN)',
        feeRate: 10,
        inputs: ['20000.5'],
        outputs: ['10000', '1200'],
        expected: { fee: 0 },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: '2 outputs, with float values (NaN)',
        feeRate: 10,
        inputs: ['20000'],
        outputs: ['10000.25', '1200.5'],
        expected: { fee: 0 },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: '2 outputs, string values (NaN)',
        feeRate: 10,
        inputs: ['20000'],
        outputs: [
            {
                value: '100',
            },
            {
                value: '204',
            },
        ],
        expected: { fee: 0 },
        dustThreshold: 546,
        factor: 0.5,
    },
    {
        description: 'exhausting BnB',
        feeRate: 10,
        inputs: [
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
            '10000',
        ],
        outputs: ['1000000'],
        expected: { fee: 0 },
        dustThreshold: 546,
        factor: 0.5,
    },
];
