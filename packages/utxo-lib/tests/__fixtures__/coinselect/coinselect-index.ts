export default [
    {
        description: '1 output, no change, 1 input is unspendable coinbase',
        feeRate: 10,
        inputs: [
            {
                value: '2000001',
                coinbase: true,
                own: true,
                confirmations: 1,
            },
            {
                value: '102001',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['100000'],
        expected: {
            inputs: [
                {
                    i: 1,
                    value: '102001',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
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
    },
    {
        description: '1 output, no change, spendable coinbase',
        feeRate: 10,
        inputs: [
            {
                value: '102001',
                coinbase: false,
                own: true,
                confirmations: 200,
            },
        ],
        outputs: ['100000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '102001',
                    coinbase: false,
                    own: true,
                    confirmations: 200,
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
    },
    {
        description: '1 output, no change, more confirmed given preference',
        feeRate: 10,
        inputs: [
            {
                value: '102001',
                coinbase: false,
                own: true,
                confirmations: 200,
            },
            {
                value: '202001',
                coinbase: false,
                own: true,
                confirmations: 0,
            },
        ],
        outputs: ['100000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '102001',
                    coinbase: false,
                    own: true,
                    confirmations: 200,
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
    },
    {
        description: '1 output, no change, little confirmed own given preference',
        feeRate: 10,
        inputs: [
            {
                value: '102001',
                coinbase: false,
                own: true,
                confirmations: 2,
            },
            {
                value: '202001',
                coinbase: false,
                own: false,
                confirmations: 2,
            },
        ],
        outputs: ['100000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '102001',
                    coinbase: false,
                    own: true,
                    confirmations: 2,
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
    },
    {
        description: '1 output, no change',
        feeRate: 10,
        inputs: [
            {
                value: '102001',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['100000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '102001',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
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
    },
    {
        description: '1 output, no change, value > 2^32',
        feeRate: 10,
        inputs: [
            {
                value: '5000002001',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['5000000000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '5000002001',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
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
    },
    {
        description: '1 output, no change, value > Number.MAX_SAFE_INTEGER (DOGE)',
        feeRate: 10,
        inputs: [
            {
                value: '9007199254742000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['9007199254740000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '9007199254742000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
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
        description: '1 output, bnb change rejected, value > 2^32',
        feeRate: 5,
        inputs: [
            {
                value: '5000000000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['1'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '5000000000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                },
            ],
            outputs: [
                {
                    value: '1',
                },
                {
                    value: '4999998869',
                },
            ],
            fee: 1130,
        },
        dustThreshold: 546,
    },
    {
        description: '1 output, only possibility with change, bnb rejects',
        feeRate: 5,
        inputs: [
            {
                value: '106001',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['100000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '106001',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
            ],
            outputs: [
                {
                    value: '100000',
                },
                {
                    value: '4871',
                },
            ],
            fee: 1130,
        },
        dustThreshold: 546,
    },
    {
        description: '1 output, sub-optimal inputs (if re-ordered), direct possible',
        feeRate: 10,
        inputs: [
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '40000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '40000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['7700'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
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
    },
    {
        description:
            '1 output, sub-optimal inputs (if re-ordered), direct possible, but slightly higher fee, bnb rejects',
        feeRate: 10,
        inputs: [
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '40000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '40000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['6800'],
        expected: {
            inputs: [
                {
                    i: 1,
                    value: '40000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
            ],
            outputs: [
                {
                    value: '6800',
                },
                {
                    value: '30940',
                },
            ],
            fee: 2260,
        },
        dustThreshold: 546,
    },
    {
        description: '1 output, needs combination of conf + unconf',
        feeRate: 5,
        inputs: [
            {
                value: '3000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '3000',
                coinbase: false,
                own: true,
                confirmations: 0,
            },
        ],
        outputs: ['4000'],
        expected: {
            fee: 2000,
            inputs: [
                {
                    i: 0,
                    value: '3000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                },
                {
                    i: 1,
                    value: '3000',
                    coinbase: false,
                    own: true,
                    confirmations: 0,
                },
            ],
            outputs: [
                {
                    value: '4000',
                },
            ],
        },
        dustThreshold: 546,
    },
    {
        description: '1 output, passes, skipped detrimental input',
        feeRate: 5,
        inputs: [
            {
                value: '3000',
                coinbase: false,
                own: true,
                confirmations: 100,
                script: {
                    length: 1000,
                },
            },
            {
                value: '3000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '3000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['4000'],
        expected: {
            fee: 2000,
            inputs: [
                {
                    i: 1,
                    value: '3000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                },
                {
                    i: 2,
                    value: '3000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                },
            ],
            outputs: [
                {
                    value: '4000',
                },
            ],
        },
        dustThreshold: 546,
    },
    {
        description: '1 output, fails, skips (and finishes on) detrimental input',
        feeRate: 55,
        inputs: [
            {
                value: '44000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '800',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['38000'],
        expected: {
            fee: 18700,
        },
        dustThreshold: 546,
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
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '3000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '3000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['4000'],
        expected: {
            inputs: [
                {
                    i: 1,
                    value: '3000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                },
                {
                    i: 2,
                    value: '3000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
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
    },
    {
        description: '1 output, optimal inputs, no change',
        feeRate: 10,
        inputs: [
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['7700'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
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
    },
    {
        description: '1 output, no fee, no bnb match',
        feeRate: 0,
        inputs: [
            {
                value: '5000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '5000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '5000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '5000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '5000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '5000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['28000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '5000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 1,
                    value: '5000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 2,
                    value: '5000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 3,
                    value: '5000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 4,
                    value: '5000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 5,
                    value: '5000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
            ],
            outputs: [
                {
                    value: '28000',
                },
                {
                    value: '2000',
                },
            ],
            fee: 0,
        },
        dustThreshold: 546,
    },
    {
        description: '1 output, 2 inputs (related), no change',
        feeRate: 10,
        inputs: [
            {
                address: 'a',
                value: '100000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                address: 'a',
                value: '2000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['98000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    address: 'a',
                    value: '100000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
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
    },
    {
        description: 'many outputs, no change',
        feeRate: 10,
        inputs: [
            {
                value: '30000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '12220',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10001',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['35000', '5000', '5000', '1000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '30000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                },
                {
                    i: 1,
                    value: '12220',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                },
                {
                    i: 2,
                    value: '10001',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
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
    },
    {
        description: 'many outputs, bnb no match',
        feeRate: 10,
        inputs: [
            {
                value: '30000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '14220',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10001',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['35000', '5000', '5000', '1000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '30000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 1,
                    value: '14220',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 2,
                    value: '10001',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
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
                {
                    value: '1981',
                },
            ],
            fee: 6240,
        },
        dustThreshold: 546,
    },
    {
        description: 'many outputs, no match',
        feeRate: 0,
        inputs: [
            {
                value: '5000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '5000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '5000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '5000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '5000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '5000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['28000', '1000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '5000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 1,
                    value: '5000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 2,
                    value: '5000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 3,
                    value: '5000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 4,
                    value: '5000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 5,
                    value: '5000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
            ],
            outputs: [
                {
                    value: '28000',
                    script: {
                        length: 25,
                    },
                },
                {
                    value: '1000',
                    script: {
                        length: 25,
                    },
                },
                {
                    value: '1000',
                    script: {
                        length: 25,
                    },
                },
            ],
            fee: 0,
        },
        dustThreshold: 546,
    },
    {
        description: 'no outputs, no change',
        feeRate: 10,
        inputs: [
            {
                value: '1900',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: [],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '1900',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                },
            ],
            outputs: [],
            fee: 1900,
        },
        dustThreshold: 546,
    },
    {
        description: 'no outputs, bnb no match',
        feeRate: 10,
        inputs: [
            {
                value: '20000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: [],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '20000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
            ],
            outputs: [
                {
                    value: '18080',
                    script: {
                        length: 25,
                    },
                },
            ],
            fee: 1920,
        },
        dustThreshold: 546,
    },
    {
        description: 'not enough funds, bnb empty result',
        feeRate: 10,
        inputs: [
            {
                value: '20000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['40000'],
        expected: {
            fee: 1920,
        },
        dustThreshold: 546,
    },
    {
        description: 'not enough funds (w/ fee), bnb empty result',
        feeRate: 10,
        inputs: [
            {
                value: '40000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['40000'],
        expected: {
            fee: 1920,
        },
        dustThreshold: 546,
    },
    {
        description: 'not enough funds (no inputs), empty result',
        feeRate: 10,
        inputs: [],
        outputs: [],
        expected: {
            fee: 0,
        },
        dustThreshold: 546,
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
        expected: {
            fee: 0,
        },
        dustThreshold: 546,
    },
    {
        description: '2 outputs, some with missing value (NaN)',
        feeRate: 10,
        inputs: [
            {
                value: '20000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['1000', {}],
        expected: {
            fee: 2260,
        },
        dustThreshold: 546,
    },
    {
        description: 'input is unspendable coinbase',
        feeRate: 10,
        inputs: [
            {
                value: '20000',
                coinbase: true,
                own: false,
                confirmations: 1,
            },
        ],
        outputs: ['10000', '1200'],
        expected: {
            fee: 0,
        },
        dustThreshold: 546,
    },
    {
        description: 'input with float values (NaN)',
        feeRate: 10,
        inputs: [
            {
                value: 20000.5,
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['10000', '1200'],
        expected: {
            fee: 2260,
        },
        dustThreshold: 546,
    },
    {
        description: '2 outputs, with float values (NaN)',
        feeRate: 10,
        inputs: [
            {
                value: '20000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: [10000.25, 1200.5],
        expected: {
            fee: 2260,
        },
        dustThreshold: 546,
    },
    {
        description: '2 outputs, number values (NaN)',
        feeRate: 10,
        inputs: [
            {
                value: '20000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: [
            {
                value: 100,
            },
            {
                value: 204,
            },
        ],
        expected: {
            fee: 2260,
        },
        dustThreshold: 546,
    },
    {
        description: 'exhausting BnB',
        feeRate: 10,
        inputs: [
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
            {
                value: '10000',
                coinbase: false,
                own: true,
                confirmations: 100,
            },
        ],
        outputs: ['1000000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 1,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 2,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 3,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 4,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 5,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 6,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 7,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 8,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 9,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 10,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 11,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 12,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 13,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 14,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 15,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 16,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 17,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 18,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 19,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 20,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 21,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 22,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 23,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 24,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 25,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 26,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 27,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 28,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 29,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 30,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 31,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 32,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 33,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 34,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 35,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 36,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 37,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 38,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 39,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 40,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 41,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 42,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 43,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 44,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 45,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 46,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 47,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 48,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 49,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 50,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 51,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 52,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 53,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 54,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 55,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 56,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 57,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 58,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 59,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 60,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 61,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 62,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 63,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 64,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 65,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 66,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 67,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 68,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 69,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 70,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 71,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 72,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 73,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 74,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 75,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 76,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 77,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 78,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 79,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 80,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 81,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 82,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 83,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 84,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 85,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 86,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 87,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 88,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 89,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 90,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 91,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 92,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 93,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 94,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 95,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 96,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 97,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 98,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 99,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 100,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 101,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 102,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 103,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 104,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 105,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 106,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 107,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 108,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 109,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 110,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 111,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 112,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 113,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 114,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 115,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 116,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
                {
                    i: 117,
                    value: '10000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    script: {
                        length: 108,
                    },
                },
            ],
            outputs: [
                {
                    value: '1000000',
                    script: {
                        length: 25,
                    },
                },
                {
                    value: '4580',
                    script: {
                        length: 25,
                    },
                },
            ],
            fee: 175420,
        },
        dustThreshold: 546,
    },
];
