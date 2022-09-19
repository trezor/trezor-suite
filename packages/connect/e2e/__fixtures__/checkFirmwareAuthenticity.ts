// if custom build is used, we ignore firmware version numbers
const customFirmwareBuild =
    process.env.TESTS_CUSTOM_FIRMWARE_BUILD ||
    process.env.TESTS_FIRMWARE?.includes('master') ||
    // integration tests in trezor-firmware repo use 2.99.99 version
    process.env.TESTS_FIRMWARE === '2.99.99';

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
                    rules: [customFirmwareBuild ? '<2.99.99' : '<2.5.1'],
                    success: false,
                },
            ],
        },
    ],
};
