/* eslint-disable @typescript-eslint/camelcase */

const fixtures = [
    {
        description: 'Success',
        mocks: {
            rollout: {
                success: new ArrayBuffer(512),
            },
            connect: {
                success: true,
            },
        },
        // this is how to override default state, nested merge and override works like a charm using lodash
        initialState: {
            suite: {
                device: {
                    features: { major_version: 2 },
                },
            },
        },
        result: {
            actions: [
                // todo: notification
                { type: '@suite/lock-ui', payload: true },
                { type: '@suite/set-update-status', payload: 'started' },
                { type: '@suite/set-update-status', payload: 'downloading' },
                { type: '@suite/set-update-status', payload: 'installing' },
                { type: '@suite/set-update-status', payload: 'restarting' },
                { type: '@suite/lock-ui', payload: false },
            ],
            state: { firmware: { status: 'restarting' } },
        },
    },
    {
        description: 'Fails for missing device',
        initialState: {
            suite: {
                device: null,
            },
        },
        result: {
            state: { firmware: { status: 'error' } },
        },
    },
    {
        description: 'Downloading fails for whatever reason thrown in rollout',
        mocks: {
            rollout: {
                error: 'foo',
            },
        },
        result: {
            state: { firmware: { status: 'downloading' } },
        },
    },
    {
        description: 'Downloading fails because rollout does not find suitable firmware',
        mocks: {
            rollout: {
                success: null,
            },
        },
        result: {
            state: { firmware: { status: 'downloading' } },
        },
    },
];

export default fixtures;
