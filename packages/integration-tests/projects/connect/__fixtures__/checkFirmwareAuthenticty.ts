export default {
    method: 'checkFirmwareAuthenticity',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: 'Check firmware authenticity',
            params: {},
            result: {
                expectedFirmwareHash: expect.any(String),
                actualFirmwareHash: expect.any(String),
                // seems like emulator never produces the same hash as its released counterpart
                valid: expect.any(Boolean),
            },
            legacyResults: [
                {
                    rules: ['<2.5.1'],
                    success: false,
                },
            ],
        },
    ],
};
