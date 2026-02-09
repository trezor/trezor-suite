const target = 'ios.sim.release';

/*
 * iOS Release config
 * This config is used to run tests in CI or locally against the latest iOS release build.
 */
/** @type {import('../types').RunnerConfig} */
module.exports = {
    projects: [
        {
            projectName: 'no_device',
            target,
            model: undefined,
            firmwareVersion: undefined,
            grep: '^(?=.*@noDevice)(?!.*@androidOnly)',
        },
    ],
};
