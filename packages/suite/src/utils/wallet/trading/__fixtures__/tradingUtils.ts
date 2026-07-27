import { asAccountDescriptor } from '@suite-common/wallet-types';

import { type resolveAddressAndToken } from '../tradingUtils';

type ResolveAddressAndTokenArgs = Parameters<typeof resolveAddressAndToken>;

export const FIXTURE_ACCOUNT_OPTIONS: Array<{
    option: {
        account: ResolveAddressAndTokenArgs[0];
        tokenContractAddress: ResolveAddressAndTokenArgs[1];
    };
    result: { address: string; token: string | null };
}> = [
    {
        option: {
            account: {
                symbol: 'btc',
                descriptor: asAccountDescriptor('bbb'),
            },
            tokenContractAddress: undefined,
        },
        result: {
            address: '',
            token: null,
        },
    },
    {
        option: {
            account: {
                symbol: 'eth',
                descriptor: asAccountDescriptor('eee'),
            },
            tokenContractAddress: undefined,
        },
        result: {
            address: '',
            token: null,
        },
    },
    {
        option: {
            account: {
                symbol: 'eth',
                descriptor: asAccountDescriptor('aaa'),
            },
            tokenContractAddress: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
        },
        result: {
            address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
            token: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
        },
    },
    {
        option: {
            account: {
                symbol: 'sol',
                descriptor: asAccountDescriptor('sss'),
            },
            tokenContractAddress: undefined,
        },
        result: {
            address: 'sss',
            token: null,
        },
    },
    {
        option: {
            account: {
                symbol: 'sol',
                descriptor: asAccountDescriptor('ddd'),
            },
            tokenContractAddress: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
        },
        result: {
            address: '',
            token: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
        },
    },
    {
        option: {
            account: {
                symbol: 'ada',
                descriptor: asAccountDescriptor('ccc'),
            },
            tokenContractAddress: undefined,
        },
        result: {
            address: '',
            token: null,
        },
    },
];
