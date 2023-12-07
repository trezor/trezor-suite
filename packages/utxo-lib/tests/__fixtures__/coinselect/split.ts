export default [
    {
        description: '1 to 3',
        feeRate: 10,
        inputs: ['18000'],
        outputs: [{}, {}, {}],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '18000',
                },
            ],
            outputs: [
                {
                    value: '5133',
                },
                {
                    value: '5133',
                },
                {
                    value: '5133',
                },
            ],
            fee: 2601,
        },
        dustThreshold: 546,
    },
    {
        description: '5 to 2',
        feeRate: 10,
        inputs: ['10000', '10000', '10000', '10000', '10000'],
        outputs: [{}, {}],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '10000',
                },
                {
                    i: 1,
                    value: '10000',
                },
                {
                    i: 2,
                    value: '10000',
                },
                {
                    i: 3,
                    value: '10000',
                },
                {
                    i: 4,
                    value: '10000',
                },
            ],
            outputs: [
                {
                    value: '20910',
                },
                {
                    value: '20910',
                },
            ],
            fee: 8180,
        },
        dustThreshold: 546,
    },
    {
        description: '3 to 1',
        feeRate: 10,
        inputs: ['10000', '10000', '10000'],
        outputs: [{}],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '10000',
                },
                {
                    i: 1,
                    value: '10000',
                },
                {
                    i: 2,
                    value: '10000',
                },
            ],
            outputs: [
                {
                    value: '25120',
                },
            ],
            fee: 4880,
        },
        dustThreshold: 546,
    },
    {
        description: '3 to 3 (1 output pre-defined)',
        feeRate: 10,
        inputs: ['10000', '10000', '10000'],
        outputs: [
            {
                address: 'foobar',
                value: '12000',
            },
            {
                address: 'fizzbuzz',
            },
            {},
        ],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '10000',
                },
                {
                    i: 1,
                    value: '10000',
                },
                {
                    i: 2,
                    value: '10000',
                },
            ],
            outputs: [
                {
                    address: 'foobar',
                    value: '12000',
                },
                {
                    address: 'fizzbuzz',
                    value: '6220',
                },
                {
                    value: '6220',
                },
            ],
            fee: 5560,
        },
        dustThreshold: 546,
    },
    {
        description: '2 to 0 (no result)',
        feeRate: 10,
        inputs: ['10000', '10000'],
        outputs: [],
        expected: {
            fee: 3060,
        },
        dustThreshold: 546,
    },
    {
        description: '0 to 2 (no result)',
        feeRate: 10,
        inputs: [],
        outputs: [{}, {}],
        expected: {
            fee: 780,
        },
        dustThreshold: 546,
    },
    {
        description: '1 to 2, output is dust (no result)',
        feeRate: 10,
        inputs: ['2000'],
        outputs: [{}],
        expected: {
            fee: 1920,
        },
        dustThreshold: 546,
    },
    {
        description: '1 to 2, input value > Number.MAX_SAFE_INTEGER (DOGE)',
        feeRate: 10,
        inputs: ['9007199254742000'],
        outputs: [{}, {}],
        expected: {
            inputs: [
                {
                    i: 0,
                    script: {
                        length: 108,
                    },
                    value: '9007199254742000',
                },
            ],
            outputs: [
                {
                    script: {
                        length: 25,
                    },
                    value: '4503599627369870',
                },
                {
                    script: {
                        length: 25,
                    },
                    value: '4503599627369870',
                },
            ],
            fee: 2260,
        },
        dustThreshold: 546,
    },
    {
        description: '2 outputs, some with missing value (NaN)',
        feeRate: 11,
        inputs: ['20000'],
        outputs: [
            {
                value: '4000',
            },
            {},
        ],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '20000',
                },
            ],
            outputs: [
                {
                    value: '4000',
                },
                {
                    value: '13514',
                },
            ],
            fee: 2486,
        },
        dustThreshold: 546,
    },
    {
        description: '1 to 1, not enough funds',
        feeRate: 1000,
        inputs: ['5000'],
        outputs: [{}],
        expected: {
            fee: 192000,
        },
        dustThreshold: 546,
    },
    {
        description: '1 to 1, not enough funds (coinbase)',
        feeRate: 10,
        inputs: [
            {
                i: 0,
                value: '10000',
                coinbase: true,
            },
        ],
        outputs: [{}],
        expected: {
            fee: 440,
        },
        dustThreshold: 546,
    },
    {
        description: 'DOGE: 1 to 1',
        feeRate: 100000,
        baseFee: 100000000,
        floorBaseFee: true,
        feePolicy: 'doge',
        inputs: ['200000011'],
        outputs: [{}],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '200000011',
                },
            ],
            outputs: [
                {
                    value: '100000011',
                },
            ],
            fee: 100000000,
        },
        dustThreshold: 100000000,
    },
    {
        description: 'DOGE: 1 to 3',
        feeRate: 100000,
        baseFee: 100000000,
        floorBaseFee: true,
        feePolicy: 'doge',
        inputs: ['400000000'],
        outputs: [{}, {}, {}],
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
                    value: '100000000',
                },
                {
                    value: '100000000',
                },
            ],
            fee: 100000000,
        },
        dustThreshold: 100000000,
    },
    {
        description: 'DOGE: 1 to 1 with tx size',
        feeRate: 100000,
        baseFee: 100000000,
        floorBaseFee: true,
        feePolicy: 'doge',
        inputs: [
            {
                i: 0,
                script: {
                    length: 1000,
                },
                value: '400000011',
            },
        ],
        outputs: [{}],
        expected: {
            inputs: [
                {
                    i: 0,
                    script: {
                        length: 1000,
                    },
                    value: '400000011',
                },
            ],
            outputs: [
                {
                    value: '200000011',
                },
            ],
            fee: 200000000,
        },
        dustThreshold: 100000000,
    },
    {
        description: 'DOGE: 1 to 1 with increased feeRate',
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
                value: '400000011',
            },
        ],
        outputs: [{}],
        expected: {
            inputs: [
                {
                    i: 0,
                    script: {
                        length: 700,
                    },
                    value: '400000011',
                },
            ],
            outputs: [
                {
                    value: '200000011',
                },
            ],
            fee: 200000000,
        },
        dustThreshold: 100000000,
    },
    {
        description: 'DOGE: 1 to 2 with dust output',
        feeRate: 100000,
        baseFee: 100000000,
        floorBaseFee: true,
        feePolicy: 'doge',
        inputs: [
            {
                i: 0,
                value: '400000011',
            },
        ],
        outputs: [{}, { value: '1' }],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '400000011',
                },
            ],
            outputs: [
                {
                    value: '200000010',
                },
                {
                    value: '1',
                },
            ],
            fee: 200000000,
        },
        dustThreshold: 100000000,
    },
    {
        description: 'DOGE: 1 to 1, not enough funds (feeRate)',
        feeRate: 700000,
        baseFee: 100000000,
        floorBaseFee: true,
        feePolicy: 'doge',
        inputs: [
            {
                i: 0,
                value: '200000011',
            },
        ],
        outputs: [{}],
        expected: {
            fee: 200000000,
        },
        dustThreshold: 100000000,
    },
    {
        description: 'DOGE: 1 to 1, not enough funds (dust output)',
        feeRate: 100000,
        baseFee: 100000000,
        floorBaseFee: true,
        feePolicy: 'doge',
        inputs: [
            {
                i: 0,
                value: '199999999',
            },
        ],
        outputs: [{}],
        expected: {
            fee: 100000000,
        },
        dustThreshold: 100000000,
    },
    {
        description: 'DOGE: 1 to 2, not enough funds (dust defined output)',
        feeRate: 100000,
        baseFee: 100000000,
        floorBaseFee: true,
        feePolicy: 'doge',
        inputs: [
            {
                i: 0,
                value: '200000011',
            },
        ],
        outputs: [{}, { value: '1' }],
        expected: {
            fee: 200000000,
        },
        dustThreshold: 100000000,
    },
    {
        description:
            'p2pkh to p2pkh with high feeRate and explicit longTermFeeRate (max output > dustThreshold 546)',
        feeRate: 49,
        longTermFeeRate: 4,
        dustThreshold: 546,
        inputs: ['10000'],
        outputs: [{}],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '10000',
                },
            ],
            outputs: [
                {
                    value: '592',
                },
            ],
            fee: 9408,
        },
    },
    {
        description:
            'p2pkh to p2pkh with high feeRate, no explicit dustThreshold, dust amount calculated from inputSize (max output > 148 * 3)',
        feeRate: 49.5,
        inputs: ['10000'],
        outputs: [{}],
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '10000',
                },
            ],
            outputs: [
                {
                    value: '496',
                },
            ],
            fee: 9504,
        },
    },
    {
        description:
            'p2pkh to p2pkh spending dust with lowest feeRate is not possible (no explicit dustThreshold)',
        feeRate: 1,
        inputs: ['546'],
        outputs: [{}],
        expected: {
            // 546 - 192 < 148 * 3
            fee: 192,
        },
    },
    {
        description:
            'p2sh to p2sh with high feeRate and explicit longTermFeeRate (max output > dustThreshold 546)',
        txType: 'p2sh',
        feeRate: 50,
        longTermFeeRate: 4,
        dustThreshold: 546,
        inputs: [
            {
                script: { length: 107 }, // INPUT_SCRIPT_LENGTH.p2sh
                value: '10000',
            },
        ],
        outputs: [{ script: { length: 23 } }], // OUTPUT_SCRIPT_LENGTH.p2sh
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '10000',
                    script: { length: 107 },
                },
            ],
            outputs: [
                {
                    value: '550',
                    script: { length: 23 },
                },
            ],
            fee: 9450,
        },
    },
    {
        description:
            'p2sh to p2sh with high feeRate, no explicit dustThreshold, dust amount calculated from inputSize (max output > 91 * 3)',
        txType: 'p2sh',
        feeRate: 51,
        inputs: [
            {
                script: { length: 107 }, // INPUT_SCRIPT_LENGTH.p2sh
                value: '10000',
            },
        ],
        outputs: [{ script: { length: 23 } }], // OUTPUT_SCRIPT_LENGTH.p2sh
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '10000',
                    script: { length: 107 },
                },
            ],
            outputs: [
                {
                    value: '361',
                    script: { length: 23 },
                },
            ],
            fee: 9639,
        },
    },
    {
        description: 'p2sh to p2sh spending dust with lowest feeRate (no explicit dustThreshold)',
        txType: 'p2sh',
        feeRate: 1,
        inputs: [
            {
                script: { length: 107 }, // INPUT_SCRIPT_LENGTH.p2sh
                value: '546',
            },
        ],
        outputs: [{ script: { length: 23 } }], // OUTPUT_SCRIPT_LENGTH.p2sh
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '546',
                    script: { length: 107 },
                },
            ],
            outputs: [
                {
                    value: '357',
                    script: { length: 23 },
                },
            ],
            fee: 189,
        },
    },
    {
        description:
            'p2wpkh to p2wpkh with high feeRate and explicit longTermFeeRate (max output > dustThreshold 546)',
        txType: 'p2wpkh',
        feeRate: 50,
        longTermFeeRate: 4,
        dustThreshold: 546,
        inputs: [
            {
                script: { length: 107 }, // INPUT_SCRIPT_LENGTH.p2wpkh
                value: '10000',
            },
        ],
        outputs: [{ script: { length: 22 } }], // OUTPUT_SCRIPT_LENGTH.p2wpkh
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '10000',
                    script: { length: 107 },
                },
            ],
            outputs: [
                {
                    value: '600',
                    script: { length: 22 },
                },
            ],
            fee: 9400,
        },
    },
    {
        description:
            'p2wpkh to p2wpkh with high feeRate, no explicit dustThreshold, dust amount calculated from inputSize (max output > 58 * 3)',
        txType: 'p2wpkh',
        feeRate: 51,
        inputs: [
            {
                script: { length: 107 }, // INPUT_SCRIPT_LENGTH.p2wpkh
                value: '10000',
            },
        ],
        outputs: [{ script: { length: 22 } }], // OUTPUT_SCRIPT_LENGTH.p2wpkh
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '10000',
                    script: { length: 107 },
                },
            ],
            outputs: [
                {
                    value: '412',
                    script: { length: 22 },
                },
            ],
            fee: 9588,
        },
    },
    {
        description:
            'p2wpkh to p2wpkh spending dust with lowest feeRate (no explicit dustThreshold)',
        txType: 'p2wpkh',
        feeRate: 1,
        inputs: [
            {
                script: { length: 107 }, // INPUT_SCRIPT_LENGTH.p2wpkh
                value: '546',
            },
        ],
        outputs: [{ script: { length: 22 } }], // OUTPUT_SCRIPT_LENGTH.p2wpkh
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '546',
                    script: { length: 107 },
                },
            ],
            outputs: [
                {
                    value: '358',
                    script: { length: 22 },
                },
            ],
            fee: 188,
        },
    },
    {
        description:
            'p2tr to p2tr with high feeRate and explicit longTermFeeRate (max output > dustThreshold 546)',
        txType: 'p2tr',
        feeRate: 59,
        longTermFeeRate: 4,
        dustThreshold: 546,
        inputs: [
            {
                script: { length: 65 }, // INPUT_SCRIPT_LENGTH.p2tr
                value: '10000',
            },
        ],
        outputs: [{ script: { length: 34 } }], // OUTPUT_SCRIPT_LENGTH.p2tr
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '10000',
                    script: { length: 65 },
                },
            ],
            outputs: [
                {
                    value: '678',
                    script: { length: 34 },
                },
            ],
            fee: 9322,
        },
    },
    {
        description:
            'p2tr to p2tr with high feeRate, no explicit dustThreshold, dust amount calculated from inputSize (max output > 68 * 3)',
        txType: 'p2tr',
        feeRate: 61,
        inputs: [
            {
                script: { length: 65 }, // INPUT_SCRIPT_LENGTH.p2tr
                value: '10000',
            },
        ],
        outputs: [{ script: { length: 34 } }], // OUTPUT_SCRIPT_LENGTH.p2tr
        expected: {
            inputs: [
                {
                    i: 0,
                    value: '10000',
                    script: { length: 65 },
                },
            ],
            outputs: [
                {
                    value: '362',
                    script: { length: 34 },
                },
            ],
            fee: 9638,
        },
    },
    {
        description: 'p2tr to p2tr spending dust with lowest feeRate (no explicit dustThreshold)',
        txType: 'p2tr',
        feeRate: 1,
        inputs: [
            {
                script: { length: 65 }, // INPUT_SCRIPT_LENGTH.p2tr
                value: '546',
            },
        ],
        outputs: [{ script: { length: 34 } }], // OUTPUT_SCRIPT_LENGTH.p2tr
        expected: {
            inputs: [
                {
                    i: 0,
                    script: { length: 65 },
                    value: '546',
                },
            ],
            outputs: [
                {
                    value: '388',
                    script: { length: 34 },
                },
            ],
            fee: 158,
        },
    },
];
