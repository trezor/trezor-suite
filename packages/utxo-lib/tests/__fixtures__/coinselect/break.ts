export default [
    {
        description: '1:1, no remainder',
        feeRate: 10,
        inputs: ['11920'],
        output: '10000',
        expected: {
            inputs: [
                {
                    value: '11920',
                },
            ],
            outputs: [
                {
                    value: '10000',
                },
            ],
            fee: 1920,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: '1:1',
        feeRate: 10,
        inputs: ['12000'],
        output: {
            address: 'woop',
            value: '10000',
        },
        expected: {
            fee: 2000,
            inputs: [
                {
                    value: '12000',
                },
            ],
            outputs: [
                {
                    address: 'woop',
                    value: '10000',
                },
            ],
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: '1:1, w/ change',
        feeRate: 10,
        inputs: ['12000'],
        output: '8000',
        expected: {
            inputs: [
                {
                    value: '12000',
                },
            ],
            outputs: [
                {
                    value: '8000',
                },
                {
                    value: '1740',
                },
            ],
            fee: 2260,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: '1:2, strange output type',
        feeRate: 10,
        inputs: ['27000'],
        output: {
            script: {
                length: 220,
            },
            value: '10000',
        },
        expected: {
            inputs: [
                {
                    value: '27000',
                },
            ],
            outputs: [
                {
                    script: {
                        length: 220,
                    },
                    value: '10000',
                },
                {
                    script: {
                        length: 220,
                    },
                    value: '10000',
                },
            ],
            fee: 7000,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: '1:4',
        feeRate: 10,
        inputs: ['12000'],
        output: '2000',
        expected: {
            inputs: [
                {
                    value: '12000',
                },
            ],
            outputs: [
                {
                    value: '2000',
                },
                {
                    value: '2000',
                },
                {
                    value: '2000',
                },
                {
                    value: '2000',
                },
            ],
            fee: 4000,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: '2:5',
        feeRate: 10,
        inputs: ['3000', '12000'],
        output: '2000',
        expected: {
            inputs: [
                {
                    value: '3000',
                },
                {
                    value: '12000',
                },
            ],
            outputs: [
                {
                    value: '2000',
                },
                {
                    value: '2000',
                },
                {
                    value: '2000',
                },
                {
                    value: '2000',
                },
                {
                    value: '2000',
                },
            ],
            fee: 5000,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: '2:5, no fee',
        feeRate: 0,
        inputs: ['5000', '10000'],
        output: '3000',
        expected: {
            inputs: [
                {
                    value: '5000',
                },
                {
                    value: '10000',
                },
            ],
            outputs: [
                {
                    value: '3000',
                },
                {
                    value: '3000',
                },
                {
                    value: '3000',
                },
                {
                    value: '3000',
                },
                {
                    value: '3000',
                },
            ],
            fee: 0,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: '2:2 (+1), w/ change',
        feeRate: 7,
        inputs: ['16000'],
        output: '6000',
        expected: {
            inputs: [
                {
                    value: '16000',
                },
            ],
            outputs: [
                {
                    value: '6000',
                },
                {
                    value: '6000',
                },
                {
                    value: '2180',
                },
            ],
            fee: 1820,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: '2:3 (+1), no fee, w/ change',
        feeRate: 0,
        inputs: ['5000', '10000'],
        output: '4000',
        expected: {
            inputs: [
                {
                    value: '5000',
                },
                {
                    value: '10000',
                },
            ],
            outputs: [
                {
                    value: '4000',
                },
                {
                    value: '4000',
                },
                {
                    value: '4000',
                },
                {
                    value: '3000',
                },
            ],
            fee: 0,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: 'not enough funds',
        feeRate: 10,
        inputs: ['41000', '1000'],
        output: '40000',
        expected: {
            fee: 3400,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: 'no inputs',
        feeRate: 10,
        inputs: [],
        output: '2000',
        expected: {
            fee: 440,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: 'invalid output (NaN)',
        feeRate: 10,
        inputs: [],
        output: {},
        expected: {
            fee: 100,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: 'input with float values (NaN)',
        feeRate: 10,
        inputs: ['10000.5'],
        output: '5000',
        expected: {
            fee: 1580,
        },
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: 'inputs and outputs, bad feeRate - number (NaN)',
        feeRate: 1,
        inputs: ['20000'],
        output: '10000',
        expected: {},
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: 'inputs and outputs, bad feeRate - decimal (NaN)',
        feeRate: 1.5,
        inputs: ['20000'],
        output: '10000',
        expected: {},
        inputLength: 107,
        outputLength: 25,
        dustThreshold: 546,
    },
];
