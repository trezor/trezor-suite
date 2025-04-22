export const fixtures = [
    {
        desc: 'last second finished',
        duration: 1000,
        expected: {
            isPastDeadline: true,
            duration: {},
        },
    },
    {
        desc: '90 seconds unfinished',
        duration: 1000 * 90,
        expected: {
            isPastDeadline: false,
            duration: {
                minutes: 1,
                seconds: 29,
            },
        },
    },
];
