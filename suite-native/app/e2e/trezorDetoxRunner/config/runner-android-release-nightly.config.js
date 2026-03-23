const target = 'android.emu.release';

/*
 * Android Release Nightly config
 * This config is used to run all tests nightly, including non-smoke T3T1 tests.
 * There are projects for all supported device models with the latest firmware versions
 */
/** @type {import('../types').RunnerConfig} */
module.exports = {
    projects: [
        {
            projectName: 'T3W1',
            target,
            model: 'T3W1',
            firmwareVersion: '2-latest',
            grep: '^(?=.*@T3W1)(?!.*@iosOnly)',
        },
        {
            projectName: 'T3T1',
            target,
            model: 'T3T1',
            firmwareVersion: '2-latest',
            grep: '^(?=.*@T3T1)(?!.*@iosOnly)',
        },
        {
            projectName: 'T1B1',
            target,
            model: 'T1B1',
            firmwareVersion: '1-latest',
            grep: '^(?=.*@T1B1)(?!.*@iosOnly)',
        },
        {
            projectName: 'no_device',
            target,
            model: undefined,
            firmwareVersion: undefined,
            grep: '^(?=.*@noDevice)(?!.*@iosOnly)',
        },
    ],
};
