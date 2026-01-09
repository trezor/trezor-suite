import { baseConfig, baseWebProject, createProject } from './playwright-base.config';

const config = {
    ...baseConfig,
    projects: [
        createProject('T3W1', baseWebProject, {
            use: {
                model: 'T3W1',
            },
            grep: /(?=.*@T3W1)/,
        }),
        createProject('T3T1', baseWebProject, {
            use: {
                model: 'T3T1',
            },
            grep: /(?=.*@T3T1)/,
        }),
        createProject('T3B1', baseWebProject, {
            use: {
                model: 'T3B1',
            },
            grep: /(?=.*@T3B1)/,
        }),
        createProject('T2T1', baseWebProject, {
            use: {
                model: 'T2T1',
            },
            grep: /(?=.*@T2T1)/,
        }),
        createProject('T1B1', baseWebProject, {
            use: {
                model: 'T1B1',
            },
            grep: /(?=.*@T1B1)/,
        }),
        createProject('no_device', baseWebProject, {
            use: {
                model: 'T1B1', // model has to be set even when not used
            },
            grep: /(?=.*@noDevice)/,
        }),
    ],
};

/* eslint-disable-next-line import/no-default-export */
export default config;
