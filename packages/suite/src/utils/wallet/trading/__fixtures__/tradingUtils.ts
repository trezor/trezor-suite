import { asAccountDescriptor } from '@suite-common/wallet-types';
import { asNetworkSymbol } from '@trezor/network-module';

import { type resolveAddressAndToken } from '../tradingUtils';

type ResolveAddressAndTokenArgs = Parameters<typeof resolveAddressAndToken>;

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');
const solSymbol = asNetworkSymbol('sol');
const adaSymbol = asNetworkSymbol('ada');

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
                symbol: btcSymbol,
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
                symbol: ethSymbol,
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
                symbol: ethSymbol,
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
                symbol: solSymbol,
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
                symbol: solSymbol,
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
                symbol: adaSymbol,
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
