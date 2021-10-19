export default [
    {
        description: 'forgotten inputLength',
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
        expected: 'Null script length',
        inputLength: null,
        outputLength: 25,
        dustThreshold: 546,
    },
    {
        description: 'forgotten outputLength',
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
        expected: 'Null script length',
        inputLength: 25,
        outputLength: null,
    },
    {
        description: 'missing input info',
        feeRate: 10,
        inputs: [
            {
                value: '102001',
            },
        ],
        outputs: ['100000'],
        expected: 'Missing information',
        inputLength: 25,
        outputLength: null,
        dustThreshold: 546,
    },
];
