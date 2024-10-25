export default {
    method: 'loadDevice',
    setup: {
        wiped: true,
        mnemonic: '',
    },
    tests: [
        {
            description: 'Load device',
            params: {
                mnemonics: ['all all all all all all all all all all all all'],
            },
            result: {
                message: 'Device loaded',
            },
        },
    ],
};
