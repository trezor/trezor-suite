export const initialRedirection = [
    {
        description: `success`,
        app: 'start',
    },
    {
        description: `already initialized`,
        state: {
            suite: {
                flags: { initialRun: false },
            },
        },
        app: 'unknown', // app will be set later, after SUITE.READY
    },
    {
        description: `redirect to modal app`,
        pathname: '/bridge' as const,
        app: 'bridge',
    },
    {
        description: `router locked`,
        state: {
            locks: { router: 1 },
        },
        app: 'start',
    },
];
