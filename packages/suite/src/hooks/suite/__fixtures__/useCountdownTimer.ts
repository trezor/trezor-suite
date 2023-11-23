export const fixtures = [
    {
        desc: 'last second finished',
        duration: 1000,
        expected: {
            isPastDeadline: true,
            duration: {
                years: 0,
                months: 0,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
            },
        },
    },
    {
        desc: '90 seconds unfinished',
        duration: 1000 * 90,
        expected: {
            isPastDeadline: false,
            duration: {
                years: 0,
                months: 0,
                days: 0,
                hours: 0,
                minutes: 1,
                seconds: 29,
            },
        },
    },
];
