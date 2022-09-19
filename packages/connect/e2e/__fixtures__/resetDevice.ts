export default {
    method: 'resetDevice',
    setup: {
        wipe: true,
    },
    // todo: can't run multiple resets, will get already initialized. maybe change beforeAll to beforeEach?
    tests: [
        {
            description: 'Reset device',
            params: {
                skipBackup: true,
            },
            result: {
                message: 'Initialized',
            },
        },
    ],
};
