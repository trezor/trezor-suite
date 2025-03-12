export const fixtures = [
    {
        method: 'GET',
        path: '/oauth',
        search: '?code=meow',
        result: {
            emit: ['oauth/response', { search: '?code=meow' }],
            response: {
                status: 200,
            },
        },
    },
    {
        method: 'GET',
        path: '/oauth',
        search: '?code=meow',
        result: {
            response: {
                status: 200,
            },
        },
    },
];
