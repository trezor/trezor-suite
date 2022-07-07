export default {
    method: 'getFirmwareHash',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'With challenge',
            skip: ['<1.11.1', '<2.5.1'],
            params: {
                challenge: 'aa',
            },
            result: {
                // hash is not deterministic, it depends on actual FW version therefore value will be different for each FW
                hash: expect.any(String),
            },
        },
        {
            description: 'Without challenge',
            skip: ['<1.11.1', '<2.5.1'],
            params: {},
            result: {
                hash: expect.any(String),
            },
        },
    ],
};
