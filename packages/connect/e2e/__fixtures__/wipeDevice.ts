export default {
    method: 'wipeDevice',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: 'Wipe device',
            params: {},
            result: {
                message: 'Device wiped',
            },
        },
    ],
};
