const target = 'ios.sim.debug';

/*
 * iOS Debug config
 * This config is used to run tests locally against iOS debug build.
 */
/** @type {import('../types').RunnerConfig} */
module.exports = {
    projects: [
        {
            projectName: 'no_device',
            target,
            model: undefined,
            firmwareVersion: undefined,
            grep: '^(?=.*@noDevice)(?!.*@androidOnly)(?!.*@fixIos)',
        },
    ],
};
