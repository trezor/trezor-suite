export const fixtures = [
    {
        method: 'GET',
        path: '/status',
        search: '',
        result: {
            response: {
                status: 200,
            },
        },
    },
    {
        method: 'GET',
        path: '/oauth',
        search: '?code=meow',
        tokenParam: 'state',
        result: {
            emit: [
                'oauth/response',
                {
                    key: 'trezor-oauth',
                    hash: null,
                    // search includes the token-as-state parameter; the inner
                    // OAuth response handler parses it as one of the keys.
                    search: expect.stringMatching(/^\?code=meow&state=/),
                },
            ],
            response: {
                status: 200,
            },
        },
    },
    {
        method: 'GET',
        path: '/oauth',
        search: '?code=meow',
        tokenParam: 'state',
        result: {
            response: {
                status: 200,
            },
        },
    },
];
