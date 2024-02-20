export default {
    method: 'changeLanguage',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: 'Change language',
            params: {
                language: 'de-DE',
            },
            result: {
                message: 'Language changed',
            },
        },
    ],
};
