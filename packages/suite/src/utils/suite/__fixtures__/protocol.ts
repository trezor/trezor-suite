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
        description: 'should parse Dogecoin URI when address and amount are both available',
        uri: 'dogecoin:DDogepartyxxxxxxxxxxxxxxxxxxw1dfzr?amount=0.1',
        result: {
            scheme: 'dogecoin',
            address: 'DDogepartyxxxxxxxxxxxxxxxxxxw1dfzr',
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
        uri: 'axie:3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf?amount=0.1',
        result: null,
    },
    {
        description: 'should log an error when address is missing',
        uri: 'bitcoin:?amount=0.1',
        result: null,
    },
];

export const isProtocolScheme = [
    {
        description: 'should validate bitcoin protocol as valid',
        scheme: 'bitcoin',
        result: true,
    },
    {
        description: 'should validate litecoin protocol as valid',
        scheme: 'litecoin',
        result: true,
    },
    {
        description: 'should validate axie protocol as invalid',
        scheme: 'axie',
        result: false,
    },
];
