export default [
    {
        description: '1 required input, 1 output, no change',
        feeRate: 10,
        inputs: [
            {
                value: '102001',
                required: true,
            },
            {
                value: '202001',
            },
        ],
        outputs: ['100000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '102001',
                    required: true,
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
        description: 'with baseFee: 1 required input, 1 optional input, 1 output, 1 change',
        feeRate: 10,
        baseFee: 2001,
        inputs: [
            {
                value: '102001',
                required: true,
            },
            {
                value: '10000',
            },
            {
                value: '1000000',
            },
        ],
        outputs: ['100000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '102001',
                    required: true,
                },
                {
                    i: 1,
                    value: '10000',
                },
            ],
            outputs: [
                {
                    value: '100000',
                },
                {
                    value: '6260',
                },
            ],
            fee: 5741,
        },
        dustThreshold: 546,
    },
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
    },
    {
        description: '1 output, change expected',
        feeRate: 5,
        inputs: ['106001'],
        outputs: ['100000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '106001',
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
        description: '1 output, change expected, value > 2^32',
        feeRate: 5,
        inputs: ['5000000000'],
        outputs: ['1'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '5000000000',
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
        description: '1 output, change expected, value > Number.MAX_SAFE_INTEGER (DOGE)',
        feeRate: 5,
        inputs: ['9007199254742000'],
        outputs: ['1'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '9007199254742000',
                },
            ],
            outputs: [
                {
                    value: '1',
                },
                {
                    value: '9007199254740869',
                },
            ],
            fee: 1130,
        },
        dustThreshold: 546,
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
    },
    {
        description:
            '1 output, sub-optimal inputs (if re-ordered), direct possible, but slightly higher fee',
        feeRate: 12,
        inputs: ['10000', '40000', '40000'],
        outputs: ['6800'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '10000',
                },
            ],
            outputs: [
                {
                    value: '6800',
                },
            ],
            fee: 3200,
        },
        dustThreshold: 546,
    },
    {
        description:
            '1 output, sub-optimal inputs (if re-ordered, no direct possible), change expected',
        feeRate: 5,
        inputs: ['10000', '40000', '40000'],
        outputs: ['4700'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '10000',
                },
            ],
            outputs: [
                {
                    value: '4700',
                },
                {
                    value: '4170',
                },
            ],
            fee: 1130,
        },
        dustThreshold: 546,
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
        expected: {
            fee: 18700,
        },
        dustThreshold: 546,
    },
    {
        description: '1 output, passes, poor ordering causing high fee',
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
                    i: 0,
                    script: {
                        length: 500,
                    },
                    value: '3000',
                },
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
            fee: 5000,
        },
        dustThreshold: 546,
    },
    {
        description: '1 output, passes, improved ordering causing low fee, no waste',
        feeRate: 5,
        inputs: [
            {
                value: '3000',
            },
            {
                value: '3000',
            },
            {
                script: {
                    length: 400,
                },
                value: '3000',
            },
        ],
        outputs: ['4000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '3000',
                },
                {
                    i: 1,
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
    },
    {
        description: '1 output, no fee, change expected',
        feeRate: 0,
        inputs: ['5000', '5000', '5000', '5000', '5000', '5000'],
        outputs: ['28000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '5000',
                },
                {
                    i: 1,
                    value: '5000',
                },
                {
                    i: 2,
                    value: '5000',
                },
                {
                    i: 3,
                    value: '5000',
                },
                {
                    i: 4,
                    value: '5000',
                },
                {
                    i: 5,
                    value: '5000',
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
        description: '1 output, script provided, no change',
        feeRate: 12,
        inputs: ['100000'],
        outputs: [
            {
                script: {
                    length: 200,
                },
                value: '95000',
            },
        ],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '100000',
                },
            ],
            outputs: [
                {
                    script: {
                        length: 200,
                    },
                    value: '95000',
                },
            ],
            fee: 5000,
        },
        dustThreshold: 546,
    },
    {
        description: '1 output, script provided, change expected',
        feeRate: 10,
        inputs: ['200000'],
        outputs: [
            {
                script: {
                    length: 200,
                },
                value: '95000',
            },
        ],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '200000',
                },
            ],
            outputs: [
                {
                    script: {
                        length: 200,
                    },
                    value: '95000',
                },
                {
                    value: '100990',
                },
            ],
            fee: 4010,
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
    },
    {
        description: 'many outputs, change expected',
        feeRate: 10,
        inputs: ['30000', '14220', '10001'],
        outputs: ['35000', '5000', '5000', '1000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '30000',
                },
                {
                    i: 1,
                    value: '14220',
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
                {
                    value: '1981',
                },
            ],
            fee: 6240,
        },
        dustThreshold: 546,
    },
    {
        description: 'many outputs, no fee, change expected',
        feeRate: 0,
        inputs: ['5000', '5000', '5000', '5000', '5000', '5000'],
        outputs: ['28000', '1000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '5000',
                },
                {
                    i: 1,
                    value: '5000',
                },
                {
                    i: 2,
                    value: '5000',
                },
                {
                    i: 3,
                    value: '5000',
                },
                {
                    i: 4,
                    value: '5000',
                },
                {
                    i: 5,
                    value: '5000',
                },
            ],
            outputs: [
                {
                    value: '28000',
                },
                {
                    value: '1000',
                },
                {
                    value: '1000',
                },
            ],
            fee: 0,
        },
        dustThreshold: 546,
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
    },
    {
        description: 'no outputs, change expected',
        feeRate: 10,
        inputs: ['20000'],
        outputs: [],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '20000',
                },
            ],
            outputs: [
                {
                    value: '18080',
                },
            ],
            fee: 1920,
        },
        dustThreshold: 546,
    },
    {
        description: 'inputs used in order of DESCENDING',
        feeRate: 10,
        inputs: [
            '20000',
            {
                script: {
                    length: 300,
                },
                value: '10000',
            },
            '10000',
        ],
        outputs: ['25000'],
        expected: {
            fee: 7140,
            inputs: [
                {
                    i: 0,
                    value: '20000',
                },
                {
                    i: 1,
                    script: {
                        length: 300,
                    },
                    value: '10000',
                },
                {
                    i: 2,
                    value: '10000',
                },
            ],
            outputs: [
                {
                    value: '25000',
                },
                {
                    value: '7860',
                },
            ],
        },
        dustThreshold: 546,
    },
    {
        description: 'not enough funds, empty result',
        feeRate: 10,
        inputs: ['20000'],
        outputs: ['40000'],
        expected: {
            fee: 1920,
        },
        dustThreshold: 546,
    },
    {
        description: 'not enough funds (w/ fee), empty result',
        feeRate: 10,
        inputs: ['40000'],
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
            fee: 100,
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
            fee: 9960,
        },
        dustThreshold: 546,
    },
    {
        description: '2 outputs, some with missing value (NaN)',
        feeRate: 10,
        inputs: ['20000'],
        outputs: ['1000', {}],
        expected: {
            fee: 2260,
        },
        dustThreshold: 546,
    },
    {
        description: 'DOGE: 2 inputs, not enough to cover fee',
        feeRate: 100000,
        baseFee: 100000000,
        floorBaseFee: true,
        feePolicy: 'doge',
        inputs: ['200000000', '20000000'],
        outputs: ['120000001'],
        expected: {
            fee: 100000000,
        },
        dustThreshold: 100000000,
    },
    {
        description: 'DOGE: 2 inputs, not enough to cover fee (tx size)',
        feeRate: 100000,
        baseFee: 100000000,
        floorBaseFee: true,
        feePolicy: 'doge',
        inputs: [
            '200000000',
            {
                script: {
                    length: 1000,
                },
                value: '20000000',
            },
        ],
        outputs: ['110000000'],
        expected: {
            fee: 200000000,
        },
        dustThreshold: 100000000,
    },
    {
        description: 'DOGE: 1 input, not enough to cover fee (output-dust)',
        feeRate: 100000,
        baseFee: 100000000,
        floorBaseFee: true,
        feePolicy: 'doge',
        inputs: ['200000000'],
        outputs: ['10000000'],
        expected: {
            fee: 200000000,
        },
        dustThreshold: 100000000,
    },
    {
        description: 'DOGE: 1 input, 1 output, expect change',
        feeRate: 100000,
        baseFee: 100000000,
        floorBaseFee: true,
        feePolicy: 'doge',
        inputs: ['500000111'],
        outputs: ['100000000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '500000111',
                },
            ],
            outputs: [
                {
                    value: '100000000',
                },
                {
                    value: '300000111',
                },
            ],
            fee: 100000000,
        },
        dustThreshold: 100000000,
    },
    {
        description: 'DOGE: 2 outputs, no change (spend dust)',
        feeRate: 100000,
        baseFee: 100000000,
        floorBaseFee: true,
        feePolicy: 'doge',
        inputs: ['400000000'],
        outputs: ['100000000', '5'],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '400000000',
                },
            ],
            outputs: [
                {
                    value: '100000000',
                },
                {
                    value: '5',
                },
            ],
            fee: 299999995,
        },
        dustThreshold: 100000000,
    },
    {
        description: 'DOGE: 1 output, no change (tx size)',
        feeRate: 100000,
        baseFee: 100000000,
        floorBaseFee: true,
        feePolicy: 'doge',
        inputs: [
            {
                script: {
                    length: 1000,
                },
                value: '300000000',
            },
        ],
        outputs: ['100000000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    script: {
                        length: 1000,
                    },
                    value: '300000000',
                },
            ],
            outputs: [
                {
                    value: '100000000',
                },
            ],
            fee: 200000000,
        },
        dustThreshold: 100000000,
    },
    {
        description: 'DOGE: 1 outputs, no change (increased fee rate)',
        feeRate: 150000,
        baseFee: 100000000,
        floorBaseFee: true,
        feePolicy: 'doge',
        inputs: [
            {
                i: 0,
                script: {
                    length: 700,
                },
                value: '300000000',
            },
        ],
        outputs: ['100000000'],
        expected: {
            inputs: [
                {
                    i: 0,
                    script: {
                        length: 700,
                    },
                    value: '300000000',
                },
            ],
            outputs: [
                {
                    value: '100000000',
                },
            ],
            fee: 200000000,
        },
        dustThreshold: 100000000,
    },
    {
        description:
            'p2pkh with high feeRate and explicit longTermFeeRate (change > dustThreshold 546)',
        txType: 'p2pkh',
        feeRate: 40,
        longTermFeeRate: 4,
        dustThreshold: 546,
        inputs: ['100000'],
        outputs: [{ value: '90000' }],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '100000',
                    script: { length: 108 },
                },
            ],
            outputs: [
                {
                    script: { length: 25 },
                    value: '90000',
                },
                {
                    script: { length: 25 },
                    value: '960',
                },
            ],
            fee: 9040,
        },
    },
    {
        description:
            'p2pkh with high feeRate, no explicit dustThreshold, dust amount calculated from inputSize (change > 148 * 3)',
        txType: 'p2pkh',
        feeRate: 42,
        inputs: ['100000'],
        outputs: [{ value: '90000' }],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '100000',
                    script: { length: 108 },
                },
            ],
            outputs: [
                {
                    script: { length: 25 },
                    value: '90000',
                },
                {
                    script: { length: 25 },
                    value: '508',
                },
            ],
            fee: 9492,
        },
    },
    {
        description:
            'p2pkh with high feeRate, no explicit dustThreshold, dust dropped (change < 148 * 3)',
        txType: 'p2pkh',
        feeRate: 43,
        inputs: ['100000'],
        outputs: [{ value: '90000' }],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '100000',
                    script: { length: 108 },
                },
            ],
            outputs: [
                {
                    script: { length: 25 },
                    value: '90000',
                },
            ],
            fee: 10000,
        },
    },
    {
        description:
            'p2sh with high feeRate and explicit longTermFeeRate (change > dustThreshold 546)',
        txType: 'p2sh',
        feeRate: 42,
        longTermFeeRate: 4,
        dustThreshold: 546,
        inputs: [
            {
                script: { length: 107 }, // INPUT_SCRIPT_LENGTH.p2sh
                value: '100000',
            },
        ],
        outputs: [{ value: '90000' }],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '100000',
                    script: { length: 107 },
                },
            ],
            outputs: [
                {
                    script: { length: 25 },
                    value: '90000',
                },
                {
                    script: { length: 23 },
                    value: '634',
                },
            ],
            fee: 9366,
        },
    },
    {
        description:
            'p2sh with high feeRate, no explicit dustThreshold, dust amount calculated from inputSize (change > 91 * 3)',
        txType: 'p2sh',
        feeRate: 43,
        inputs: [
            {
                script: { length: 107 }, // INPUT_SCRIPT_LENGTH.p2sh
                value: '100000',
            },
        ],
        outputs: [{ value: '90000' }],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '100000',
                    script: { length: 107 },
                },
            ],
            outputs: [
                {
                    script: { length: 25 },
                    value: '90000',
                },
                {
                    script: { length: 23 },
                    value: '411',
                },
            ],
            fee: 9589,
        },
    },
    {
        description:
            'p2sh with high feeRate, no explicit dustThreshold, dust dropped (change < 91 * 3)',
        txType: 'p2sh',
        feeRate: 44,
        inputs: [
            {
                script: { length: 107 }, // INPUT_SCRIPT_LENGTH.p2sh
                value: '100000',
            },
        ],
        outputs: [{ value: '90000' }],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '100000',
                    script: { length: 107 },
                },
            ],
            outputs: [
                {
                    script: { length: 25 },
                    value: '90000',
                },
            ],
            fee: 10000,
        },
    },
    {
        description:
            'p2wpkh with high feeRate and explicit longTermFeeRate (change > dustThreshold 546)',
        txType: 'p2wpkh',
        feeRate: 42,
        longTermFeeRate: 4,
        dustThreshold: 546,
        inputs: [
            {
                script: { length: 107 }, // INPUT_SCRIPT_LENGTH.p2wpkh
                value: '100000',
            },
        ],
        outputs: [{ value: '90000' }],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '100000',
                    script: { length: 107 },
                },
            ],
            outputs: [
                {
                    script: { length: 25 },
                    value: '90000',
                },
                {
                    script: { length: 22 },
                    value: '676',
                },
            ],
            fee: 9324,
        },
    },
    {
        description:
            'p2wpkh with high feeRate, no explicit dustThreshold, dust amount calculated from inputSize (change > 58 * 3)',
        txType: 'p2wpkh',
        feeRate: 43,
        inputs: [
            {
                script: { length: 107 }, // INPUT_SCRIPT_LENGTH.p2wpkh
                value: '100000',
            },
        ],
        outputs: [{ value: '90000' }],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '100000',
                    script: { length: 107 },
                },
            ],
            outputs: [
                {
                    script: { length: 25 },
                    value: '90000',
                },
                {
                    script: { length: 22 },
                    value: '454',
                },
            ],
            fee: 9546,
        },
    },
    {
        description:
            'p2wpkh with high feeRate, no explicit dustThreshold, dust dropped (change < 58 * 3)',
        txType: 'p2wpkh',
        feeRate: 45,
        inputs: [
            {
                script: { length: 107 }, // INPUT_SCRIPT_LENGTH.p2wpkh
                value: '100000',
            },
        ],
        outputs: [{ value: '90000' }],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '100000',
                    script: { length: 107 },
                },
            ],
            outputs: [
                {
                    script: { length: 25 },
                    value: '90000',
                },
            ],
            fee: 10000,
        },
    },
    {
        description:
            'p2tr with high feeRate and explicit longTermFeeRate (change > dustThreshold 546)',
        txType: 'p2tr',
        feeRate: 49,
        longTermFeeRate: 4,
        dustThreshold: 546,
        inputs: [
            {
                script: { length: 65 }, // INPUT_SCRIPT_LENGTH.p2tr
                value: '100000',
            },
        ],
        outputs: [{ value: '90000' }],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '100000',
                    script: { length: 65 },
                },
            ],
            outputs: [
                {
                    script: { length: 25 },
                    value: '90000',
                },
                {
                    script: { length: 34 },
                    value: '592',
                },
            ],
            fee: 9408,
        },
    },
    {
        description:
            'p2tr with high feeRate, no explicit dustThreshold, dust amount calculated from inputSize (> 68 * 3)',
        txType: 'p2tr',
        feeRate: 50,
        inputs: [
            {
                script: { length: 65 }, // INPUT_SCRIPT_LENGTH.p2tr
                value: '100000',
            },
        ],
        outputs: [{ value: '90000' }],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '100000',
                    script: { length: 65 },
                },
            ],
            outputs: [
                {
                    script: { length: 25 },
                    value: '90000',
                },
                {
                    script: { length: 34 },
                    value: '400',
                },
            ],
            fee: 9600,
        },
    },
    {
        description:
            'p2tr with high feeRate, no explicit dustThreshold, dust dropped (change < 68 * 3)',
        txType: 'p2tr',
        feeRate: 53,
        inputs: [
            {
                script: { length: 65 }, // INPUT_SCRIPT_LENGTH.p2tr
                value: '100000',
            },
        ],
        outputs: [{ value: '90000' }],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '100000',
                    script: { length: 65 },
                },
            ],
            outputs: [
                {
                    script: { length: 25 },
                    value: '90000',
                },
            ],
            fee: 10000,
        },
    },
];
