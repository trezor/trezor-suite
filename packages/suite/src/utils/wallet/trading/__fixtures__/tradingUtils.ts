import { type DefinitionType, type TokenDefinitions } from '@suite-common/token-definitions';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';

import { type resolveAddressAndToken } from '../tradingUtils';

export const coinDefinitions: TokenDefinitions[DefinitionType.COIN] = {
    error: false,
    data: [
        '0x1234123412341234123412341234123412341236',
        '0x1234123412341234123412341234123412341235',
    ],
    isLoading: false,
    hide: [],
    show: [],
};

export const FIXTURE_ACCOUNTS: Partial<Account>[] = [
    {
        deviceState: '1stTestnetAddress@device_id:0',
        formattedBalance: '0',
        tokens: [],
        descriptor: asAccountDescriptor('descriptor1'),
        symbol: 'btc',
        visible: true,
        accountType: 'normal',
    },
    {
        deviceState: '1stTestnetAddress@device_id:0',
        formattedBalance: '0.101213',
        tokens: [],
        descriptor: asAccountDescriptor('descriptor2'),
        symbol: 'ltc',
        visible: true,
        accountType: 'normal',
    },
    {
        deviceState: '1stTestnetAddress@device_id:0',
        formattedBalance: '0',
        descriptor: asAccountDescriptor('descriptor3'),
        symbol: 'eth',
        visible: true,
        accountType: 'normal',
        tokens: [
            // unsupported token
            {
                balance: '2.76149',
                contract: '0x1234123412341234123412341234123412341234',
                decimals: 6,
                name: 'Tether USD',
                symbol: 'usdt',
                standard: 'ERC20',
            },
            // unknown token
            {
                balance: '2230',
                contract: '0xdAC17F958D2ee523a2206206994597C13D831ec',
                decimals: 6,
                name: 'USDC',
                symbol: 'usdc',
                standard: 'ERC20',
            },
            // supported and known token
            {
                balance: '2230',
                contract: '0x1234123412341234123412341234123412341236',
                decimals: 6,
                name: 'VeChain',
                symbol: 'VEE',
                standard: 'ERC20',
            },
        ],
    },
    {
        deviceState: '1stTestnet@device_id:0',
        formattedBalance: '0.101213',
        tokens: [],
        descriptor: asAccountDescriptor('descriptor4'),
        symbol: 'btc',
        visible: true,
        accountType: 'normal',
    },
    {
        deviceState: '1stTestnet@device_id:0',
        formattedBalance: '0.101213',
        symbol: 'pol',
        visible: true,
        tokens: [
            {
                balance: '2.76149',
                contract: '0x1234123412341234123412341234123412341235',
                decimals: 6,
                name: 'Tether USD',
                symbol: 'usdt',
                standard: 'ERC20',
            },
        ],
        descriptor: asAccountDescriptor('descriptor5'),
        accountType: 'normal',
    },
    {
        deviceState: '1stTestnetAddress@device_id:0',
        formattedBalance: '250',
        symbol: 'pol',
        visible: true,
        tokens: [
            // unsupported token
            {
                balance: '2.76149',
                contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                decimals: 6,
                name: 'USDC',
                symbol: 'usdc',
                standard: 'ERC20',
            },
        ],
        descriptor: asAccountDescriptor('descriptor6'),
        accountType: 'normal',
    },
    {
        deviceState: '1stTestnetAddress@device_id:0',
        formattedBalance: '250',
        symbol: 'pol',
        visible: false,
        tokens: [
            // unsupported token
            {
                balance: '2.76149',
                contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                decimals: 6,
                name: 'USDC',
                symbol: 'usdc',
                standard: 'ERC20',
            },
        ],
        descriptor: asAccountDescriptor('descriptor6'),
        accountType: 'normal',
    },
    {
        deviceState: '1stTestnetAddress@device_id:0',
        formattedBalance: '1',
        tokens: [],
        descriptor: asAccountDescriptor('descriptor7'),
        symbol: 'btc',
        visible: true,
        accountType: 'coinjoin',
    },
];

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
