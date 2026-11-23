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
        result: {
            emit: [
                'oauth/response',
                {
                    key: 'trezor-oauth',
                    hash: null,
                    search: '?code=meow',
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
        // Google's consent page calls the redirect URI itself and sends its own referer
        headers: { referer: 'https://accounts.google.com/' },
        result: {
            emit: [
                'oauth/response',
                {
                    key: 'trezor-oauth',
                    hash: null,
                    search: '?code=meow',
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
        headers: { referer: 'https://evil.example.com/' },
        result: {
            notEmit: 'oauth/response',
            response: {
                status: 403,
            },
        },
    },
];
