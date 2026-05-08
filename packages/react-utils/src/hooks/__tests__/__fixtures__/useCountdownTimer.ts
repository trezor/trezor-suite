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
    {
        desc: 'pastDeadlineLeadMs: 0 keeps isPastDeadline false until the deadline',
        duration: 1000,
        options: { pastDeadlineLeadMs: 0 },
        expected: {
            isPastDeadline: false,
            duration: {},
        },
    },
    {
        desc: 'isEnabled: false does not start the countdown, values stay frozen',
        duration: 1000 * 90,
        options: { isEnabled: false },
        expected: {
            isPastDeadline: false,
            duration: {
                minutes: 1,
                seconds: 30,
            },
        },
    },
];
