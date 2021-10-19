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
                    value: '5130',
                },
                {
                    value: '5130',
                },
                {
                    value: '5130',
                },
            ],
            fee: 2610,
        },
        inputLength: 107,
        outputLength: 25,
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
                    value: '20905',
                },
                {
                    value: '20905',
                },
            ],
            fee: 8190,
        },
        inputLength: 107,
        outputLength: 25,
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
                    value: '25110',
                },
            ],
            fee: 4890,
        },
        inputLength: 107,
        outputLength: 25,
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
                    value: '6215',
                },
                {
                    value: '6215',
                },
            ],
            fee: 5570,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: '2 to 0 (no result)',
        feeRate: 10,
        inputs: ['10000', '10000'],
        outputs: [],
        expected: {
            fee: 3070,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: '0 to 2 (no result)',
        feeRate: 10,
        inputs: [],
        outputs: [{}, {}],
        expected: {
            fee: 790,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: '1 to 2, output is dust (no result)',
        feeRate: 10,
        inputs: ['2000'],
        outputs: [{}],
        expected: {
            fee: 1930,
        },
        inputLength: 107,
        outputLength: 25,
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
                        length: 107,
                    },
                    value: '9007199254742000',
                },
            ],
            outputs: [
                {
                    script: {
                        length: 25,
                    },
                    value: '4503599627369865',
                },
                {
                    script: {
                        length: 25,
                    },
                    value: '4503599627369865',
                },
            ],
            fee: 2270,
        },
        inputLength: 107,
        outputLength: 25,
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
                    value: '13503',
                },
            ],
            fee: 2497,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: '2 outputs, some with float values (NaN)',
        feeRate: 10,
        inputs: ['20000'],
        outputs: [
            {
                value: '4000.5',
            },
            {},
        ],
        expected: {
            fee: 2270,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: '2 outputs, number values (NaN)',
        feeRate: 11,
        inputs: ['20000'],
        outputs: [
            {
                value: 100,
            },
            {
                value: 204,
            },
        ],
        expected: {
            fee: 2497,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: 'input with float values (NaN)',
        feeRate: 10,
        inputs: ['20000.5'],
        outputs: [{}, {}],
        expected: {
            fee: 2270,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: 'inputs and outputs, bad feeRate - string (NaN)',
        feeRate: '1',
        inputs: ['20000'],
        outputs: [{}],
        expected: {
            fee: 0,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: 'inputs and outputs, bad feeRate - decimal (NaN)',
        feeRate: 1.5,
        inputs: ['20000'],
        outputs: [{}],
        expected: {
            fee: 0,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: '1 to 1, not enough funds',
        feeRate: 1000,
        inputs: ['5000'],
        outputs: [{}],
        expected: {
            fee: 193000,
        },
        inputLength: 107,
        outputLength: 25,
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
            fee: 450,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: 'DOGE: 1 to 1',
        feeRate: 100000,
        baseFee: 100000000,
        floorBaseFee: true,
        dustOutputFee: 100000000,
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
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 99999999,
    },
    {
        description: 'DOGE: 1 to 3',
        feeRate: 100000,
        baseFee: 100000000,
        floorBaseFee: true,
        dustOutputFee: 100000000,
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
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 99999999,
    },
    {
        description: 'DOGE: 1 to 1 with tx size',
        feeRate: 100000,
        baseFee: 100000000,
        floorBaseFee: true,
        dustOutputFee: 100000000,
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
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 99999999,
    },
    {
        description: 'DOGE: 1 to 1 with increased feeRate',
        feeRate: 150000,
        baseFee: 100000000,
        floorBaseFee: true,
        dustOutputFee: 100000000,
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
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 99999999,
    },
    {
        description: 'DOGE: 1 to 2 with dust output',
        feeRate: 100000,
        baseFee: 100000000,
        floorBaseFee: true,
        dustOutputFee: 100000000,
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
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 99999999,
    },
    {
        description: 'DOGE: 1 to 1, not enough funds (feeRate)',
        feeRate: 700000,
        baseFee: 100000000,
        floorBaseFee: true,
        dustOutputFee: 100000000,
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
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 99999999,
    },
    {
        description: 'DOGE: 1 to 1, not enough funds (dust output)',
        feeRate: 100000,
        baseFee: 100000000,
        floorBaseFee: true,
        dustOutputFee: 100000000,
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
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 99999999,
    },
    {
        description: 'DOGE: 1 to 2, not enough funds (dust defined output)',
        feeRate: 100000,
        baseFee: 100000000,
        floorBaseFee: true,
        dustOutputFee: 100000000,
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
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 99999999,
    },
];
