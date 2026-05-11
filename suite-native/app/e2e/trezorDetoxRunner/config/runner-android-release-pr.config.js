const target = 'android.emu.release';

/*
 * Android Release PR config
 * Temporary config — one project per spec so each CI worker runs exactly one test suite.
 * Remove this file and revert the workflow change when no longer needed.
 */
/** @type {import('../types').RunnerConfig} */
module.exports = {
    projects: [
        {
            projectName: 'suite-sync',
            target,
            model: 'T3T1',
            firmwareVersion: '2-latest',
            grep: '^Suite Sync - Labelling',
        },
        {
            projectName: 'entropy-check',
            target,
            model: 'T3T1',
            firmwareVersion: '2-latest',
            grep: '^Simulated entropy check failure on T3T1',
        },
        {
            projectName: 'device-onboarding',
            target,
            model: 'T3T1',
            firmwareVersion: '2-latest',
            grep: '^Device onboarding',
        },
        {
            projectName: 'others-accounts-import',
            target,
            model: undefined,
            firmwareVersion: undefined,
            grep: '^Import accounts of other networks',
        },
        {
            projectName: 'app-settings',
            target,
            model: undefined,
            firmwareVersion: undefined,
            grep: '^App Settings - without device interactions',
        },
    ],
};
