export default {
    method: 'applyFlags',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: 'Flag 1',
            params: {
                flags: 1,
            },
            result: {
                message: 'Flags applied',
            },
        },
    ],
};
