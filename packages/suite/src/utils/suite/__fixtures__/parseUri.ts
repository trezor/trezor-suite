export const parseUri = [
    {
        description: 'valid http scheme',
        uri: 'http://www.trezor.io?amount=1',
        result: {
            host: 'www.trezor.io',
            protocol: 'http:',
            pathname: '/',
            search: '?amount=1',
        },
    },
    {
        description: 'valid protocol scheme',
        uri: 'bitcoin:3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf?amount=0.1',
        result: {
            host: '',
            protocol: 'bitcoin:',
            pathname: '3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf',
            search: '?amount=0.1',
        },
    },
    {
        description: 'valid scheme with slashes, but address is value is in host field',
        uri: 'bitcoin://3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf?amount=0.1',
        result: {
            host: '3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf',
            protocol: 'bitcoin:',
            pathname: '',
            search: '?amount=0.1',
        },
    },
    {
        description: 'invalid: no-http',
        uri: 'www.trezor.io',
        result: undefined,
    },
    {
        description: 'invalid: null',
        uri: null,
        result: undefined,
    },
];
