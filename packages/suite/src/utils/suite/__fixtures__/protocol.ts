import { type Protocol } from '@suite-common/suite-constants';

type getProtocolInfoResult =
    | {
          scheme: Protocol;
          address: string;
          amount?: number;
          token?: string;
          tokenAmount?: string;
      }
    | {
          error: string;
          scheme: string;
      };

type getProtocolInfoFixture = {
    description: string;
    uri: string | null;
    result: getProtocolInfoResult | null;
};

export const getProtocolInfo: getProtocolInfoFixture[] = [
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
        description: 'should handle slash at end',
        uri: 'bitcoin:3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf/?amount=0.1',
        result: {
            scheme: 'bitcoin',
            address: '3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf',
            amount: 0.1,
        },
    },
    {
        description: 'should handle slashes after scheme and at end',
        uri: 'bitcoin://3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf/?amount=0.1',
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
        result: { error: 'Unknown protocol', scheme: 'axie' },
    },
    {
        description: 'should log an error when address is missing',
        uri: 'bitcoin:?amount=0.1',
        result: null,
    },
    {
        description: 'should parse ERC-681 token transfer URI (no double slash)',
        uri: 'ethereum:0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7/transfer?address=0x8e23ee67d1332ad560396262c48ffbb01f93d052&uint256=1',
        result: {
            scheme: 'ethereum',
            address: '0x8e23ee67d1332ad560396262c48ffbb01f93d052',
            token: '0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7',
            tokenAmount: '1',
        },
    },
    {
        description: 'should parse ERC-681 token transfer URI (double slash)',
        uri: 'ethereum://0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7/transfer?address=0x8e23ee67d1332ad560396262c48ffbb01f93d052&uint256=1000000',
        result: {
            scheme: 'ethereum',
            address: '0x8e23ee67d1332ad560396262c48ffbb01f93d052',
            token: '0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7',
            tokenAmount: '1000000',
        },
    },
    {
        description: 'should parse ERC-681 token transfer URI on other EVM network',
        uri: 'polygon:0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7/transfer?address=0x8e23ee67d1332ad560396262c48ffbb01f93d052&uint256=500000000000000000',
        result: {
            scheme: 'polygon',
            address: '0x8e23ee67d1332ad560396262c48ffbb01f93d052',
            token: '0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7',
            tokenAmount: '500000000000000000',
        },
    },
    {
        description: 'should parse ERC-681 token transfer URI when uint256 parameter is omitted',
        uri: 'ethereum:0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7/transfer?address=0x8e23ee67d1332ad560396262c48ffbb01f93d052',
        result: {
            scheme: 'ethereum',
            address: '0x8e23ee67d1332ad560396262c48ffbb01f93d052',
            token: '0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7',
            tokenAmount: undefined,
        },
    },
];
