export default {
    method: 'changeLanguage',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            skip: ['1', '<2.7.0'],
            description: 'Change language to en-US',
            params: {
                language: 'en-US',
            },
            result: {
                message: 'Language changed',
            },
        },
    ],
};
