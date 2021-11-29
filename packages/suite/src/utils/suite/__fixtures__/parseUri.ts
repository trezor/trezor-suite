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

export const parseQuery = [
    {
        description: 'accepted simple string',
        uri: 'amount=1&foo=bar',
        result: {
            amount: '1',
            foo: 'bar',
        },
    },
    {
        description: 'accepted query string',
        uri: '?amount=1&foo=bar',
        result: {
            amount: '1',
            foo: 'bar',
        },
    },
    {
        description: 'skip host',
        uri: 'http://foo.bar?amount=1',
        result: {
            amount: '1',
        },
    },
    {
        description: 'invalid: null',
        uri: null,
        result: {},
    },
    {
        description: 'invalid: number',
        uri: 1,
        result: {},
    },
    {
        description: 'invalid: no search',
        uri: 'foo?',
        result: {},
    },
];

export const getProtocolInfo = [
    {
        description: 'should parse Bitcoin URI when address and amount are both available',
        uri: 'bitcoin:3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf?amount=0.1',
        result: {
            scheme: 'bitcoin',
            address: '3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf',
            amount: 0.1,
        },
    },
    {
        description:
            'should parse Bitcoin URI when it consists not only of address and amount but also not yet existing variable',
        uri: 'bitcoin:3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf?amount=1&layer=lightning&label=Bender&message=Bite%20my%20shiny%20metal%20Bitcoin',
        result: {
            scheme: 'bitcoin',
            address: '3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf',
            amount: 1,
        },
    },
    {
        description: 'should parse Bitcoin URI when it consists only of address',
        uri: 'bitcoin://3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf',
        result: {
            scheme: 'bitcoin',
            address: '3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf',
            amount: undefined,
        },
    },
    {
        description: 'should parse Bitcoin URI when it consists of address and zero amount',
        uri: 'bitcoin:3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf?amount=0',
        result: {
            scheme: 'bitcoin',
            address: '3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf',
            amount: undefined,
        },
    },
    {
        description:
            'should parse Bitcoin URI and ignore amount when it consists of address, and amount is not a number',
        uri: 'bitcoin:3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf?amount=thousand',
        result: {
            scheme: 'bitcoin',
            address: '3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf',
            amount: undefined,
        },
    },
    {
        description: 'valid AOPP uri',
        uri: 'aopp:?v=0&msg=MESSAGE&asset=btc&format=any&callback=https%3A%2F%2Ftesting.21analytics.ch%2Fproofs%2Fc220a28e-0e99-4be6-8578-a886f628ee20',
        result: {
            scheme: 'aopp',
            v: '0',
            msg: 'MESSAGE',
            asset: 'btc',
            format: 'any',
            callback: 'https://testing.21analytics.ch/proofs/c220a28e-0e99-4be6-8578-a886f628ee20',
        },
    },
    {
        description: 'valid AOPP uri with invalid callback',
        uri: 'aopp:?v=0&msg=MESSAGE&asset=btc&format=any&callback=a',
        result: {
            scheme: 'aopp',
            v: '0',
            msg: 'MESSAGE',
            asset: 'btc',
            format: 'any',
            callback: undefined,
        },
    },
    {
        description: 'valid AOPP uri, callback with slashes',
        uri: 'aopp:?v=0&msg=MESSAGE&asset=btc&format=any&callback=https://foo.bar',
        result: {
            scheme: 'aopp',
            v: '0',
            msg: 'MESSAGE',
            asset: 'btc',
            format: 'any',
            callback: 'https://foo.bar',
        },
    },
    {
        description: 'invalid uri',
        uri: 'gibberish',
        result: null,
    },
    {
        description: 'invalid uri',
        uri: null,
        result: null,
    },
    {
        description: 'should log an error with non-existing scheme',
        uri: 'litecoin:3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf?amount=0.1',
        result: null,
    },
    {
        description: 'should log an error when address is missing',
        uri: 'bitcoin:?amount=0.1',
        result: null,
    },
];
