export default [
    {
        description: 'missing input info',
        feeRate: 10,
        inputs: [
            {
                value: '102001',
            },
        ],
        outputs: ['100000'],
        expected: 'Unexpected unreturned result',
        dustThreshold: 546,
    },
];
